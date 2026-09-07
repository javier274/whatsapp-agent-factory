import { getSupabase } from "@/lib/supabase";
import type {
  AgentSettingsRow,
  ClientRow,
  OfferItemRow,
  PersuasionItemRow,
  RetrievedContext,
} from "@/lib/agent/types";

function scorePersuasion(
  item: PersuasionItemRow,
  inboundText: string,
): number {
  const text = inboundText.toLowerCase();
  const trigger = item.trigger.toLowerCase();
  let score = 0;
  if (trigger && text.includes(trigger)) score += 10;
  for (const token of trigger.split(/\s+/).filter((t) => t.length > 3)) {
    if (text.includes(token)) score += 2;
  }
  // Slight preference by type useful early in funnel
  if (item.type === "benefit") score += 1;
  if (item.type === "objection") score += 1;
  return score;
}

/** Load client by YCloud phone number id (tenant isolation root). */
export async function resolveClientByPhoneNumberId(
  phoneNumberId: string,
): Promise<ClientRow> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("clients")
    .select(
      "id,name,timezone,human_name,human_phone,ycloud_phone_number_id,wa_display_number,active",
    )
    .eq("ycloud_phone_number_id", phoneNumberId)
    .eq("active", true)
    .maybeSingle();

  if (error) throw new Error(`clients lookup failed: ${error.message}`);
  if (!data) {
    throw new Error(
      `No active client for ycloud_phone_number_id=${phoneNumberId}`,
    );
  }
  return data as ClientRow;
}

/** Retrieve 2–5 persuasion rows + optional offer + settings + recent msgs. */
export async function retrieveContext(params: {
  clientId: string;
  conversationId: string;
  inboundText: string;
}): Promise<RetrievedContext> {
  const sb = getSupabase();
  const { clientId, conversationId, inboundText } = params;

  const [settingsRes, persuasionRes, offerRes, messagesRes] = await Promise.all([
    sb
      .from("agent_settings")
      .select(
        "id,client_id,system_prompt,restrictions,language,tone,handoff_threshold_eur,openrouter_model,version,active",
      )
      .eq("client_id", clientId)
      .eq("active", true)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle(),
    sb
      .from("persuasion_items")
      .select(
        "id,client_id,type,trigger,response,proof,intensity,version,active",
      )
      .eq("client_id", clientId)
      .eq("active", true)
      .limit(50),
    sb
      .from("offer_items")
      .select(
        "id,client_id,name,price_min,price_max,includes,excludes,cta,active",
      )
      .eq("client_id", clientId)
      .eq("active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    sb
      .from("messages")
      .select("direction,body")
      .eq("client_id", clientId)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  if (settingsRes.error) {
    throw new Error(`agent_settings: ${settingsRes.error.message}`);
  }
  if (!settingsRes.data) {
    throw new Error(`No active agent_settings for client_id=${clientId}`);
  }
  if (persuasionRes.error) {
    throw new Error(`persuasion_items: ${persuasionRes.error.message}`);
  }
  if (offerRes.error) {
    throw new Error(`offer_items: ${offerRes.error.message}`);
  }
  if (messagesRes.error) {
    throw new Error(`messages: ${messagesRes.error.message}`);
  }

  const clientRes = await sb
    .from("clients")
    .select(
      "id,name,timezone,human_name,human_phone,ycloud_phone_number_id,wa_display_number,active",
    )
    .eq("id", clientId)
    .single();
  if (clientRes.error || !clientRes.data) {
    throw new Error(`client reload failed: ${clientRes.error?.message}`);
  }

  const all = (persuasionRes.data || []) as PersuasionItemRow[];
  const ranked = [...all]
    .map((item) => ({ item, score: scorePersuasion(item, inboundText) }))
    .sort((a, b) => b.score - a.score);

  const picked: PersuasionItemRow[] = [];
  for (const row of ranked) {
    if (picked.length >= 5) break;
    if (row.score > 0 || picked.length < 2) {
      picked.push(row.item);
    }
  }
  // Guarantee 2–5 when inventory allows
  while (picked.length < 2 && picked.length < all.length) {
    const next = all.find((x) => !picked.some((p) => p.id === x.id));
    if (!next) break;
    picked.push(next);
  }

  return {
    client: clientRes.data as ClientRow,
    settings: settingsRes.data as AgentSettingsRow,
    persuasion: picked.slice(0, 5),
    offer: (offerRes.data as OfferItemRow | null) || null,
    recentMessages: ((messagesRes.data || []) as Array<{
      direction: "in" | "out";
      body: string;
    }>).reverse(),
  };
}

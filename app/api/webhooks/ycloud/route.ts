import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase";
import { sendWhatsAppText, verifyYCloudWebhookSecret } from "@/lib/ycloud";
import {
  resolveClientByPhoneNumberId,
  retrieveContext,
} from "@/lib/agent/retrieve";
import { runAgent } from "@/lib/agent/run";

export const runtime = "nodejs";

/**
 * Assumed YCloud inbound webhook payload (document + fixture).
 *
 * YCloud may wrap events; we accept a flattened shape and a nested shape:
 *
 * {
 *   "id": "evt_...",                         // event id (optional)
 *   "type": "whatsapp.inbound_message.received",
 *   "whatsappInboundMessage": {
 *     "id": "wamid.XXX",                      // WhatsApp message id (dedupe key)
 *     "from": "34600000000",                  // lead phone E.164 without +
 *     "to": "34611111111",                    // business display number (optional)
 *     "timestamp": "1710000000",
 *     "type": "text",
 *     "text": { "body": "Hola, quiero precio" },
 *     "customerProfile": { "name": "Ana" },   // optional
 *     "wabaId": "...",                        // optional
 *     "phoneNumberId": "PHONE_NUMBER_ID"      // maps to clients.ycloud_phone_number_id
 *   }
 * }
 *
 * Also accepted: top-level phoneNumberId / from / text / messageId aliases.
 * Non-text messages are acknowledged with 200 and ignored.
 */

const InboundMessageSchema = z.object({
  id: z.string().min(1),
  from: z.string().min(3),
  to: z.string().optional(),
  type: z.string().optional(),
  text: z
    .object({
      body: z.string().min(1),
    })
    .optional(),
  customerProfile: z
    .object({
      name: z.string().optional(),
    })
    .optional(),
  phoneNumberId: z.string().min(1).optional(),
});

const PayloadSchema = z
  .object({
    id: z.string().optional(),
    type: z.string().optional(),
    whatsappInboundMessage: InboundMessageSchema.optional(),
    // flat aliases
    messageId: z.string().optional(),
    from: z.string().optional(),
    text: z.union([z.string(), z.object({ body: z.string() })]).optional(),
    phoneNumberId: z.string().optional(),
    customerName: z.string().optional(),
  })
  .passthrough();

type NormalizedInbound = {
  messageId: string;
  from: string;
  phoneNumberId: string;
  body: string;
  customerName?: string;
};

function normalizePayload(raw: unknown): NormalizedInbound | null {
  const parsed = PayloadSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid payload: ${parsed.error.message}`);
  }
  const p = parsed.data;
  const nested = p.whatsappInboundMessage;

  const messageId = nested?.id || p.messageId || p.id;
  const from = nested?.from || p.from;
  const phoneNumberId = nested?.phoneNumberId || p.phoneNumberId;

  let body: string | undefined;
  if (nested?.text?.body) body = nested.text.body;
  else if (typeof p.text === "string") body = p.text;
  else if (p.text && typeof p.text === "object") body = p.text.body;

  if (!messageId || !from || !phoneNumberId) {
    throw new Error(
      "Payload missing messageId/from/phoneNumberId (see fixture comments)",
    );
  }

  const msgType = nested?.type || "text";
  if (msgType !== "text" || !body) {
    return null; // non-text or empty → ignore
  }

  return {
    messageId,
    from,
    phoneNumberId,
    body,
    customerName: nested?.customerProfile?.name || p.customerName,
  };
}

export async function POST(req: NextRequest) {
  try {
    const secretHeader =
      req.headers.get("x-ycloud-webhook-secret") ||
      req.headers.get("x-webhook-secret");
    verifyYCloudWebhookSecret(secretHeader);

    const raw = await req.json();
    const inbound = normalizePayload(raw);
    if (!inbound) {
      return NextResponse.json({ ok: true, ignored: true, reason: "non_text" });
    }

    const sb = getSupabase();
    const client = await resolveClientByPhoneNumberId(inbound.phoneNumberId);

    // Dedupe by (client_id, external_id)
    const { data: existing } = await sb
      .from("messages")
      .select("id")
      .eq("client_id", client.id)
      .eq("external_id", inbound.messageId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ ok: true, deduped: true });
    }

    // Upsert contact
    const { data: contact, error: contactErr } = await sb
      .from("contacts")
      .upsert(
        {
          client_id: client.id,
          wa_phone: inbound.from,
          name: inbound.customerName || null,
        },
        { onConflict: "client_id,wa_phone" },
      )
      .select("id,client_id,wa_phone,name")
      .single();

    if (contactErr || !contact) {
      throw new Error(`contact upsert: ${contactErr?.message}`);
    }

    // Open conversation
    let conversationId: string;
    const { data: openConv } = await sb
      .from("conversations")
      .select("id")
      .eq("client_id", client.id)
      .eq("contact_id", contact.id)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (openConv?.id) {
      conversationId = openConv.id;
      await sb
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId)
        .eq("client_id", client.id);
    } else {
      const { data: created, error: convErr } = await sb
        .from("conversations")
        .insert({
          client_id: client.id,
          contact_id: contact.id,
          status: "open",
        })
        .select("id")
        .single();
      if (convErr || !created) {
        throw new Error(`conversation insert: ${convErr?.message}`);
      }
      conversationId = created.id;
    }

    // Ensure lead_state
    await sb.from("lead_state").upsert(
      {
        contact_id: contact.id,
        client_id: client.id,
        stage: "new",
      },
      { onConflict: "contact_id", ignoreDuplicates: true },
    );

    // Save inbound
    const { error: inErr } = await sb.from("messages").insert({
      conversation_id: conversationId,
      client_id: client.id,
      direction: "in",
      body: inbound.body,
      external_id: inbound.messageId,
      persuasion_item_ids: [],
    });
    if (inErr) {
      // Unique race → treat as dedupe
      if (inErr.code === "23505") {
        return NextResponse.json({ ok: true, deduped: true });
      }
      throw new Error(`inbound insert: ${inErr.message}`);
    }

    const context = await retrieveContext({
      clientId: client.id,
      conversationId,
      inboundText: inbound.body,
    });

    const agent = await runAgent({
      context,
      inboundText: inbound.body,
      contactName: contact.name,
    });

    const outboundExternalId = `out:${inbound.messageId}`;
    const { error: outErr } = await sb.from("messages").insert({
      conversation_id: conversationId,
      client_id: client.id,
      direction: "out",
      body: agent.replyText,
      external_id: outboundExternalId,
      persuasion_item_ids: agent.persuasionItemIds,
    });
    if (outErr) throw new Error(`outbound insert: ${outErr.message}`);

    if (!client.ycloud_phone_number_id) {
      throw new Error("client missing ycloud_phone_number_id");
    }

    await sendWhatsAppText({
      fromPhoneNumberId: client.ycloud_phone_number_id,
      to: inbound.from,
      text: agent.replyText,
    });

    return NextResponse.json({
      ok: true,
      clientId: client.id,
      conversationId,
      persuasionItemIds: agent.persuasionItemIds,
      model: agent.model,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    const status =
      message.includes("webhook secret") || message.includes("Invalid")
        ? 401
        : message.includes("No active client")
          ? 404
          : message.startsWith("Missing required env")
            ? 500
            : 500;
    console.error("[ycloud webhook]", message);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/webhooks/ycloud",
    hint: "POST inbound WhatsApp events from YCloud",
  });
}

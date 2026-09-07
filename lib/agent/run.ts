import { chatCompletion } from "@/lib/openrouter";
import type { AgentRunInput, AgentRunResult } from "@/lib/agent/types";

function buildSystemPrompt(input: AgentRunInput): string {
  const { context } = input;
  const { settings, client, offer, persuasion } = context;

  const offerBlock = offer
    ? [
        "OFERTA ACTIVA (no inventes fuera de esto):",
        `- ${offer.name}`,
        offer.price_min != null || offer.price_max != null
          ? `  Precio: ${offer.price_min ?? "?"} – ${offer.price_max ?? "?"} EUR`
          : null,
        offer.includes ? `  Incluye: ${offer.includes}` : null,
        offer.excludes ? `  No incluye: ${offer.excludes}` : null,
        offer.cta ? `  CTA: ${offer.cta}` : null,
      ]
        .filter(Boolean)
        .join("\n")
    : "OFERTA: no hay offer_items activos. No des precios; ofrece pasar a humano.";

  const persuasionBlock =
    persuasion.length === 0
      ? "PERSUASION: sin items. Califica y ofrece handoff."
      : [
          "PERSUASION (usa solo lo relevante; cita ids mentalmente):",
          ...persuasion.map(
            (p) =>
              `- [${p.id}] (${p.type}/${p.intensity}) trigger="${p.trigger}" → ${p.response}${
                p.proof ? ` | proof: ${p.proof}` : ""
              }`,
          ),
        ].join("\n");

  const human =
    client.human_name || client.human_phone
      ? `Handoff humano: ${client.human_name || "equipo"} ${client.human_phone || ""}`.trim()
      : "Handoff: deriva al equipo si el lead lo pide.";

  return [
    settings.system_prompt,
    "",
    "RESTRICCIONES:",
    settings.restrictions,
    "",
    `Idioma: ${settings.language}. Tono: ${settings.tone || "profesional cercano"}.`,
    `Negocio: ${client.name}. Zona horaria: ${client.timezone}.`,
    settings.handoff_threshold_eur != null
      ? `Umbral handoff: ${settings.handoff_threshold_eur} EUR.`
      : null,
    human,
    "",
    offerBlock,
    "",
    persuasionBlock,
    "",
    "FORMATO: responde SOLO el texto WhatsApp al lead (2–4 frases). Sin markdown de sistema.",
  ]
    .filter((x) => x != null)
    .join("\n");
}

/** Run LLM with retrieved tenant context. Returns reply + persuasion ids used. */
export async function runAgent(input: AgentRunInput): Promise<AgentRunResult> {
  const system = buildSystemPrompt(input);
  const history = input.context.recentMessages.map((m) => ({
    role: (m.direction === "in" ? "user" : "assistant") as
      | "user"
      | "assistant",
    content: m.body,
  }));

  const userContent = input.contactName
    ? `Contacto: ${input.contactName}\nMensaje: ${input.inboundText}`
    : input.inboundText;

  const result = await chatCompletion({
    model: input.context.settings.openrouter_model,
    messages: [
      { role: "system", content: system },
      ...history,
      { role: "user", content: userContent },
    ],
  });

  // Attribute persuasion items whose trigger tokens appear in inbound or reply
  const hay = `${input.inboundText}\n${result.content}`.toLowerCase();
  const used = input.context.persuasion
    .filter((p) => {
      const t = p.trigger.toLowerCase();
      if (t && hay.includes(t)) return true;
      return t
        .split(/\s+/)
        .filter((w) => w.length > 3)
        .some((w) => hay.includes(w));
    })
    .map((p) => p.id);

  const persuasionItemIds =
    used.length > 0
      ? used.slice(0, 5)
      : input.context.persuasion.slice(0, 2).map((p) => p.id);

  return {
    replyText: result.content,
    persuasionItemIds,
    model: result.model,
  };
}

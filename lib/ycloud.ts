function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function getYCloudWebhookSecret(): string | undefined {
  return process.env.YCLOUD_WEBHOOK_SECRET || undefined;
}

/** Verify webhook secret if configured. Header: x-ycloud-webhook-secret (assumed). */
export function verifyYCloudWebhookSecret(headerValue: string | null): void {
  const expected = getYCloudWebhookSecret();
  if (!expected) return; // optional in early setups
  if (!headerValue || headerValue !== expected) {
    throw new Error("Invalid YCloud webhook secret");
  }
}

export type SendWhatsAppTextParams = {
  fromPhoneNumberId: string;
  to: string;
  text: string;
};

/**
 * Send a WhatsApp text message via YCloud.
 * Assumed endpoint: POST https://api.ycloud.com/v2/whatsapp/messages
 * Auth: Bearer YCLOUD_API_KEY
 * Adjust if your YCloud account uses a different path.
 */
export async function sendWhatsAppText(
  params: SendWhatsAppTextParams,
): Promise<{ id?: string; raw: unknown }> {
  const apiKey = requireEnv("YCLOUD_API_" + "KEY");
  const res = await fetch("https://api.ycloud.com/v2/whatsapp/messages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: params.fromPhoneNumberId,
      to: params.to,
      type: "text",
      text: { body: params.text },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`YCloud send error ${res.status}: ${body.slice(0, 500)}`);
  }

  const raw = await res.json().catch(() => ({}));
  const id =
    typeof raw === "object" && raw && "id" in raw
      ? String((raw as { id: unknown }).id)
      : undefined;
  return { id, raw };
}

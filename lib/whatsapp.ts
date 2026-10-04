// ═══════════════════════════════════════════════════════════════
//  META WHATSAPP CLOUD API — send helper
//  Plain fetch against the Graph API, no SDK needed (Feature 14:
//  minimum required packages).
// ═══════════════════════════════════════════════════════════════
const GRAPH_VERSION = "v21.0";

export async function sendWhatsAppMessage(phoneNumberId: string, to: string, body: string) {
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body, preview_url: false },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`WhatsApp send failed (${res.status}): ${errText}`);
  }

  return res.json();
}

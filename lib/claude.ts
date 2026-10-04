// ═══════════════════════════════════════════════════════════════
//  SHARED CLAUDE CALLER
// ═══════════════════════════════════════════════════════════════
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "sk-ant-placeholder",
});

export async function getAIResponse(systemPrompt: string, messages: any[]) {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    system: systemPrompt,
    messages,
  });

  // ContentBlock is a union; only TextBlock has .text
  const block = response.content?.[0];
  let raw =
    block && block.type === "text" && "text" in block
      ? String((block as { type: "text"; text: string }).text)
      : "{}";
  raw = raw.replace(/```json\n?|\n?```/g, "").trim();

  let parsed: any;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      message: raw,
      action: null,
      appointment: null,
    };
  }

  let message = String(parsed.message || "");

  const firstBrace = message.indexOf("{");
  if (firstBrace !== -1 && /["']message["']\s*:/.test(message.slice(firstBrace))) {
    message = message.substring(0, firstBrace).trim();
  }
  if (message.trim().startsWith("{")) {
    try {
      const inner = JSON.parse(message);
      if (inner && inner.message) message = String(inner.message);
    } catch {
      /* keep */
    }
  }

  message = message.replace(/```[\s\S]*?```/g, "").trim();
  message = message.replace(/\n{3,}/g, "\n\n");
  message = message.replace(/\n\s*\{[\s\S]*"action"[\s\S]*\}\s*$/g, "").trim();

  return {
    message,
    action: parsed.action || null,
    appointment: parsed.appointment || null,
  };
}

// ═══════════════════════════════════════════════════════════════
//  SHARED CLAUDE CALLER
//  Extracted from app/api/chat/route.js so the WhatsApp webhook
//  (Feature 2) can reuse the exact same Claude call + response
//  cleanup logic instead of duplicating it, per the "no duplicated
//  AI logic" requirement. Logic below is copied verbatim from
//  route.js — not rewritten.
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

  let raw = response.content?.[0]?.text || "{}";
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

  // Remove any JSON object appended to the message (model sometimes echoes schema)
  const firstBrace = message.indexOf("{");
  if (firstBrace !== -1 && /["']message["']\s*:/.test(message.slice(firstBrace))) {
    message = message.substring(0, firstBrace).trim();
  }
  // If the whole message is JSON, use parsed fields only
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

  // Final safety: drop a trailing raw JSON line
  message = message.replace(/\n\s*\{[\s\S]*"action"[\s\S]*\}\s*$/g, "").trim();

  return {
    message,
    action: parsed.action || null,
    appointment: parsed.appointment || null,
  };
}

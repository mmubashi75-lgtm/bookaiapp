// ═══════════════════════════════════════════════════════════════
// SHARED CLAUDE CALLER
// Used by chat, WhatsApp and other AI endpoints.
// Cleans Claude responses and guarantees the customer never sees
// leaked JSON, markdown or code.
// Compatible with the latest Anthropic SDK.
// ═══════════════════════════════════════════════════════════════

import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  throw new Error("ANTHROPIC_API_KEY is missing.");
}

const anthropic = new Anthropic({
  apiKey,
});

export async function getAIResponse(
  systemPrompt: string,
  messages: any[]
) {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    system: systemPrompt,
    messages,
  });

  // Find the first text block (latest SDK safe)
  const textBlock = response.content.find(
    (block) => block.type === "text"
  );

  let raw =
    textBlock && "text" in textBlock
      ? textBlock.text
      : "{}";

  // Remove markdown fences
  raw = raw.replace(/```json\s*|\s*```/g, "").trim();

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

  let message = String(parsed.message ?? "");

  // Sometimes Claude appends another JSON object after the message.
  const jsonStart = message.indexOf('{"message"');

  if (jsonStart !== -1) {
    message = message.substring(0, jsonStart).trim();
  }

  // Remove any remaining JSON object
  message = message.replace(
    /\{[\s\S]*"action"[\s\S]*\}$/m,
    ""
  );

  // Remove markdown/code blocks
  message = message.replace(/```[\s\S]*?```/g, "");

  // Remove inline JSON
  message = message.replace(/\{[\s\S]*\}/g, "");

  // Remove excessive blank lines
  message = message.replace(/\n{3,}/g, "\n\n");

  message = message.trim();

  return {
    message,
    action: parsed.action ?? null,
    appointment: parsed.appointment ?? null,
  };
}
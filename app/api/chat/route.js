import { NextResponse } from "next/server";
import { getAIResponse } from "@/lib/claude";

// NOTE: identical behavior to before. The Claude call + JSON cleanup
// logic was extracted into lib/claude.ts (getAIResponse) so the new
// WhatsApp webhook can reuse it without duplicating this logic —
// this route's request/response shape is unchanged.
export async function POST(request) {
  try {
    const { systemPrompt, messages } = await request.json();

    const result = await getAIResponse(systemPrompt, messages);

    return NextResponse.json(result);

  } catch (error) {
    console.error("Claude API Error:", error);

    return NextResponse.json(
      {
        error: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

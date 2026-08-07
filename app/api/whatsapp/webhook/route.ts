import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAIResponse } from "@/lib/claude";
import { buildAIPrompt } from "@/lib/ai-prompt";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import {
  findBusinessByWhatsAppPhoneNumberId,
  loadApptsForUser,
  cancelAppointmentByName,
} from "@/lib/appointments-admin";

// ═══════════════════════════════════════════════════════════════
//  META WHATSAPP CLOUD API WEBHOOK
//  WhatsApp → this webhook → existing AI (lib/claude.ts + lib/ai-
//  prompt.ts) → existing /api/book route for bookings → Supabase →
//  WhatsApp reply. Matches the flow diagram in the Feature 2 spec —
//  no booking logic is duplicated here.
// ═══════════════════════════════════════════════════════════════

// Meta's one-time webhook verification handshake.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge || "", { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  const body = await request.json();

  try {
    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    // Ignore delivery/read status callbacks and non-text messages —
    // acknowledge with 200 so Meta doesn't retry.
    if (!message || message.type !== "text") {
      return NextResponse.json({ received: true });
    }

    const phoneNumberId = value.metadata?.phone_number_id;
    const from = message.from; // customer's WhatsApp number, e.g. "923001234567"
    const text = message.text?.body?.trim();

    if (!phoneNumberId || !from || !text) {
      return NextResponse.json({ received: true });
    }

    const business = await findBusinessByWhatsAppPhoneNumberId(phoneNumberId);
    if (!business) {
      console.warn("WhatsApp message for unknown phone_number_id:", phoneNumberId);
      return NextResponse.json({ received: true });
    }

    // Find or create the conversation for this customer + business.
    let { data: conversation } = await supabaseAdmin
      .from("conversations")
      .select("*")
      .eq("user_id", business.user_id)
      .eq("channel", "whatsapp")
      .eq("customer_phone", from)
      .maybeSingle();

    if (!conversation) {
      const { data: created, error: createErr } = await supabaseAdmin
        .from("conversations")
        .insert({ user_id: business.user_id, channel: "whatsapp", customer_phone: from })
        .select()
        .single();
      if (createErr) throw createErr;
      conversation = created;
    }

    const { data: priorMessages } = await supabaseAdmin
      .from("conversation_messages")
      .select("role, content")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true });

    const history = (priorMessages || []).map((m: any) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));
    history.push({ role: "user", content: text });

    const appts = await loadApptsForUser(business.user_id);
    const systemPrompt = buildAIPrompt(business, appts, false);

    const parsed = await getAIResponse(systemPrompt, history);

    // Persist both sides of the exchange.
    await supabaseAdmin.from("conversation_messages").insert([
      { conversation_id: conversation.id, role: "user", content: text },
      { conversation_id: conversation.id, role: "assistant", content: parsed.message },
    ]);
    await supabaseAdmin
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversation.id);

    if (parsed.action === "book" && parsed.appointment) {
      // Reuse the EXISTING /api/book route — no duplicated booking logic.
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
      await fetch(`${siteUrl}/api/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: business.slug,
          customer_name: parsed.appointment.name,
          service: parsed.appointment.service,
          date: parsed.appointment.date,
          time: parsed.appointment.time,
          phone: parsed.appointment.phone || from,
        }),
      });
    } else if (parsed.action === "cancel" && parsed.appointment?.name) {
      await cancelAppointmentByName(business.user_id, parsed.appointment.name);
    }

    await sendWhatsAppMessage(phoneNumberId, from, parsed.message);

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("WhatsApp webhook error:", err);
    // Still return 200 — Meta retries aggressively on non-2xx and
    // that would just resend the same customer message repeatedly.
    return NextResponse.json({ received: true, error: err.message });
  }
}

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

/**
 * POST /api/reminders/run
 * Call from a cron job (Vercel Cron, GitHub Actions, or external) every 10–15 min.
 * Header: Authorization: Bearer CRON_SECRET
 *
 * Sends 24h / 2h / 30m reminders for future confirmed appointments only.
 */
const LEADS = [24 * 60, 2 * 60, 30]; // minutes before appointment

function parseApptLocal(dateStr: string, timeStr: string): Date | null {
  // date: YYYY-MM-DD preferred; time like "10:00 AM"
  try {
    const d = String(dateStr || "").trim();
    const t = String(timeStr || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
    const m = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!m) return null;
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    const ap = (m[3] || "").toUpperCase();
    if (ap === "PM" && h < 12) h += 12;
    if (ap === "AM" && h === 12) h = 0;
    const iso = `${d}T${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:00`;
    const dt = new Date(iso);
    return isNaN(dt.getTime()) ? null : dt;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") || "";
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const { data: appts, error } = await supabaseAdmin
    .from("appointments")
    .select("id, user_id, customer_name, service, date, time, status, phone")
    .eq("status", "confirmed")
    .limit(500);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const a of appts || []) {
    const when = parseApptLocal(a.date, a.time);
    if (!when) continue;
    const minsUntil = (when.getTime() - now) / 60000;
    if (minsUntil <= 0) continue; // past — never remind

    for (const lead of LEADS) {
      // within a 20-minute window so cron every 15m catches it
      if (minsUntil > lead || minsUntil < lead - 20) continue;

      const { data: existing } = await supabaseAdmin
        .from("appointment_reminders")
        .select("id")
        .eq("appointment_id", a.id)
        .eq("channel", "whatsapp")
        .eq("lead_minutes", lead)
        .maybeSingle();
      if (existing) continue;

      // Resolve business WhatsApp phone_number_id
      const { data: biz } = await supabaseAdmin
        .from("businesses")
        .select("name, whatsapp_phone_number_id")
        .eq("user_id", a.user_id)
        .maybeSingle();

      const phoneNumberId = biz?.whatsapp_phone_number_id;
      const to = (a.phone || "").replace(/\D/g, "");
      if (!phoneNumberId || to.length < 10) continue;

      const label =
        lead >= 1440 ? "24 hours" : lead >= 120 ? "2 hours" : "30 minutes";
      const body = `Reminder from ${biz?.name || "us"}: ${a.customer_name}, your ${a.service} is in about ${label} (${a.date} ${a.time}). See you soon!`;

      try {
        await sendWhatsAppMessage(phoneNumberId, to, body);
        await supabaseAdmin.from("appointment_reminders").insert({
          appointment_id: a.id,
          user_id: a.user_id,
          channel: "whatsapp",
          lead_minutes: lead,
        });
        sent++;
      } catch (e: any) {
        errors.push(`${a.id}: ${e.message}`);
      }
    }
  }

  // Mark past confirmed appointments as completed (date/time in the past)
  for (const a of appts || []) {
    const when = parseApptLocal(a.date, a.time);
    if (when && when.getTime() < now - 60 * 60 * 1000) {
      await supabaseAdmin
        .from("appointments")
        .update({ status: "completed" })
        .eq("id", a.id)
        .eq("status", "confirmed");
    }
  }

  return NextResponse.json({ sent, errors: errors.slice(0, 20) });
}

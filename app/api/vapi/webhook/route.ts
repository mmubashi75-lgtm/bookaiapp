import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { recordCallUsage } from "@/lib/vapi-usage";

/**
 * POST /api/vapi/webhook
 * Vapi server URL for end-of-call-report (and other events).
 *
 * Configure in Vapi dashboard:
 *   Server URL = https://YOUR_DOMAIN/api/vapi/webhook
 *
 * Expected payload shapes vary; we handle:
 * - { message: { type: "end-of-call-report", call: {...}, durationSeconds } }
 * - { type: "end-of-call-report", call: {...} }
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const message = payload.message || payload;
    const type = message.type || payload.type || "";

    // Ignore non-end events (still 200 so Vapi doesn't retry forever)
    if (type && type !== "end-of-call-report") {
      return NextResponse.json({ ok: true, ignored: type });
    }

    const call = message.call || payload.call || {};
    const callId = call.id || message.callId || payload.callId || null;

    // Duration: prefer explicit fields, else started/ended timestamps
    let durationSeconds =
      Number(
        message.durationSeconds ??
          message.duration ??
          call.durationSeconds ??
          call.duration ??
          0
      ) || 0;

    if (!durationSeconds && call.startedAt && call.endedAt) {
      durationSeconds = Math.max(
        0,
        (new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) /
          1000
      );
    }

    // Resolve business via metadata / variableValues set at call start
    const meta =
      call.metadata ||
      message.metadata ||
      call.assistantOverrides?.variableValues ||
      call.variableValues ||
      {};

    const slug =
      meta.slug ||
      meta.businessSlug ||
      message.slug ||
      payload.slug ||
      null;
    const businessId = meta.businessId || meta.business_id || null;

    let biz = null as any;
    if (businessId) {
      const { data } = await supabaseAdmin
        .from("businesses")
        .select("*")
        .eq("id", businessId)
        .maybeSingle();
      biz = data;
    } else if (slug) {
      const { data } = await supabaseAdmin
        .from("businesses")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      biz = data;
    }

    if (!biz) {
      console.warn("Vapi webhook: business not resolved", { callId, slug, businessId });
      return NextResponse.json({
        ok: true,
        warning: "Business not found — usage not recorded",
      });
    }

    const result = await recordCallUsage({
      businessId: biz.id,
      userId: biz.user_id,
      callId,
      durationSeconds,
      raw: payload,
    });

    return NextResponse.json({
      ok: true,
      minutesRecorded: result.minutes,
      usage: result.snapshot,
    });
  } catch (err: any) {
    console.error("Vapi webhook error", err);
    return NextResponse.json(
      { error: err.message || "Webhook failed" },
      { status: 500 }
    );
  }
}

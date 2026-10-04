import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  ensureUsagePeriod,
  maxDurationSeconds,
  snapshotFromBusiness,
} from "@/lib/vapi-usage";

/**
 * POST /api/vapi/start-call
 * Body: { slug: string }
 *
 * Server-side gate before any Vapi call starts.
 * Returns remaining minutes + maxDurationSeconds for the Web SDK.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const slug = String(body.slug || "").trim();
    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const { data: biz, error } = await supabaseAdmin
      .from("businesses")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    if (!biz) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const fresh = await ensureUsagePeriod(biz);
    const usage = snapshotFromBusiness(fresh);

    if (usage.blocked) {
      return NextResponse.json(
        {
          allowed: false,
          error: "Monthly voice limit reached. Upgrade your plan or buy more minutes.",
          usage,
        },
        { status: 402 }
      );
    }

    const maxSec = maxDurationSeconds(usage.remaining);

    return NextResponse.json({
      allowed: true,
      maxDurationSeconds: maxSec,
      assistantId:
        fresh.vapi_assistant_id ||
        process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID ||
        null,
      usage,
      business: {
        id: fresh.id,
        name: fresh.name,
        slug: fresh.slug,
        emoji: fresh.emoji,
        color: fresh.color,
        light: fresh.light,
        greeting: fresh.greeting,
        hours: fresh.hours,
        address: fresh.address,
        services: fresh.services,
        faqs: fresh.faqs,
        type: fresh.type,
      },
    });
  } catch (err: any) {
    console.error("start-call error", err);
    return NextResponse.json(
      { error: err.message || "Failed to authorize call" },
      { status: 500 }
    );
  }
}

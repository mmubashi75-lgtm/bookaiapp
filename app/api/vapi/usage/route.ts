import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUsageByUserId, getUsageBySlug } from "@/lib/vapi-usage";

/**
 * GET /api/vapi/usage
 * - ?slug=xxx  → public-ish usage for a business (no secrets)
 * - Authorization: Bearer <supabase access token> → owner usage
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (slug) {
      const usage = await getUsageBySlug(slug);
      if (!usage) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({
        minutesUsed: usage.minutesUsed,
        effectiveLimit: usage.effectiveLimit,
        remaining: usage.remaining,
        periodResetAt: usage.periodResetAt,
        plan: usage.plan,
        blocked: usage.blocked,
      });
    }

    const auth = request.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
    const { data: userData, error: userErr } = await sb.auth.getUser();
    if (userErr || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const usage = await getUsageByUserId(userData.user.id);
    if (!usage) {
      return NextResponse.json({ error: "No business" }, { status: 404 });
    }
    return NextResponse.json(usage);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed" },
      { status: 500 }
    );
  }
}

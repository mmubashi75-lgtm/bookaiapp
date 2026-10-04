import { supabaseAdmin } from "@/lib/supabase-admin";

/** Plan → monthly minute allowance */
export const PLAN_MINUTES: Record<string, number> = {
  none: 0,
  simple: 100,
  growth: 300,
  pro_voice: 1000,
};

/** One-time top-up packs (minutes) */
export const TOPUP_PACKS: Record<string, number> = {
  pack_50: 50,
  pack_100: 100,
  pack_300: 300,
  pack_500: 500,
  pack_1000: 1000,
};

export type UsageSnapshot = {
  businessId: string;
  userId: string;
  plan: string;
  monthlyLimit: number;
  extraMinutes: number;
  effectiveLimit: number;
  minutesUsed: number;
  remaining: number;
  usagePeriodStart: string;
  periodResetAt: string;
  blocked: boolean;
};

function addOneMonth(from: Date): Date {
  const d = new Date(from);
  d.setMonth(d.getMonth() + 1);
  return d;
}

/** Reset usage if current period has ended */
export async function ensureUsagePeriod(business: any): Promise<any> {
  const start = business.usage_period_start
    ? new Date(business.usage_period_start)
    : new Date();
  const resetAt = addOneMonth(start);
  const now = new Date();

  if (now >= resetAt) {
    const { data, error } = await supabaseAdmin
      .from("businesses")
      .update({
        minutes_used: 0,
        usage_period_start: now.toISOString(),
        // keep extra_minutes (purchased top-ups roll forward) — or zero them if you prefer
      })
      .eq("id", business.id)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }
  return business;
}

export function snapshotFromBusiness(business: any): UsageSnapshot {
  const plan = String(business.subscription_plan || "simple");
  const planLimit =
    business.monthly_minutes_limit != null
      ? Number(business.monthly_minutes_limit)
      : PLAN_MINUTES[plan] ?? 100;
  const extra = Number(business.extra_minutes || 0);
  const used = Number(business.minutes_used || 0);
  const effectiveLimit = planLimit + extra;
  const remaining = Math.max(0, effectiveLimit - used);
  const start = business.usage_period_start
    ? new Date(business.usage_period_start)
    : new Date();
  const resetAt = addOneMonth(start);

  return {
    businessId: business.id,
    userId: business.user_id,
    plan,
    monthlyLimit: planLimit,
    extraMinutes: extra,
    effectiveLimit,
    minutesUsed: used,
    remaining,
    usagePeriodStart: start.toISOString(),
    periodResetAt: resetAt.toISOString(),
    blocked: remaining <= 0,
  };
}

export async function getUsageBySlug(slug: string): Promise<UsageSnapshot | null> {
  const { data: biz, error } = await supabaseAdmin
    .from("businesses")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!biz) return null;
  const fresh = await ensureUsagePeriod(biz);
  return snapshotFromBusiness(fresh);
}

export async function getUsageByUserId(userId: string): Promise<UsageSnapshot | null> {
  const { data: biz, error } = await supabaseAdmin
    .from("businesses")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!biz) return null;
  const fresh = await ensureUsagePeriod(biz);
  return snapshotFromBusiness(fresh);
}

/**
 * Max call length in seconds from remaining minutes.
 * Floor at 0; cap at 60 minutes per single call for safety.
 */
export function maxDurationSeconds(remainingMinutes: number): number {
  if (remainingMinutes <= 0) return 0;
  const secs = Math.floor(remainingMinutes * 60);
  return Math.min(secs, 60 * 60); // hard cap 1 hour per call
}

/** Record finished call; idempotent on call_id */
export async function recordCallUsage(opts: {
  businessId: string;
  userId: string;
  callId?: string | null;
  durationSeconds: number;
  raw?: any;
}): Promise<{ minutes: number; snapshot: UsageSnapshot }> {
  const durationSeconds = Math.max(0, Math.round(opts.durationSeconds || 0));
  // Bill in minutes, rounded up to nearest 0.1 min (6 seconds) so short calls still count
  const minutes = Math.ceil((durationSeconds / 60) * 10) / 10;

  if (opts.callId) {
    const { data: existing } = await supabaseAdmin
      .from("vapi_usage")
      .select("id")
      .eq("call_id", opts.callId)
      .maybeSingle();
    if (existing) {
      // already recorded
      const { data: biz } = await supabaseAdmin
        .from("businesses")
        .select("*")
        .eq("id", opts.businessId)
        .single();
      return {
        minutes: 0,
        snapshot: snapshotFromBusiness(biz),
      };
    }
  }

  await supabaseAdmin.from("vapi_usage").insert({
    business_id: opts.businessId,
    user_id: opts.userId,
    call_id: opts.callId || null,
    duration_seconds: durationSeconds,
    minutes,
    source: "vapi",
    raw: opts.raw || null,
  });

  // Atomic-ish increment
  const { data: biz } = await supabaseAdmin
    .from("businesses")
    .select("*")
    .eq("id", opts.businessId)
    .single();

  if (!biz) throw new Error("Business not found while recording usage");

  const fresh = await ensureUsagePeriod(biz);
  const newUsed = Number(fresh.minutes_used || 0) + minutes;

  const { data: updated, error } = await supabaseAdmin
    .from("businesses")
    .update({ minutes_used: newUsed })
    .eq("id", opts.businessId)
    .select("*")
    .single();

  if (error) throw error;
  return { minutes, snapshot: snapshotFromBusiness(updated) };
}

/** Apply a top-up pack to a business */
export async function applyTopUp(opts: {
  userId: string;
  minutes: number;
  pack: string;
  paddleTxnId?: string;
}) {
  const { data: biz, error } = await supabaseAdmin
    .from("businesses")
    .select("*")
    .eq("user_id", opts.userId)
    .maybeSingle();
  if (error) throw error;
  if (!biz) throw new Error("Business not found");

  const extra = Number(biz.extra_minutes || 0) + opts.minutes;
  await supabaseAdmin
    .from("businesses")
    .update({ extra_minutes: extra })
    .eq("id", biz.id);

  await supabaseAdmin.from("minute_purchases").insert({
    user_id: opts.userId,
    business_id: biz.id,
    minutes_added: opts.minutes,
    paddle_txn_id: opts.paddleTxnId || null,
    plan_or_pack: opts.pack,
  });

  return getUsageByUserId(opts.userId);
}

/** Set plan + monthly limit (e.g. after Paddle subscription) */
export async function setBusinessPlan(userId: string, plan: string) {
  const limit = PLAN_MINUTES[plan] ?? 100;
  const { error } = await supabaseAdmin
    .from("businesses")
    .update({
      subscription_plan: plan,
      monthly_minutes_limit: limit,
    })
    .eq("user_id", userId);
  if (error) throw error;
}

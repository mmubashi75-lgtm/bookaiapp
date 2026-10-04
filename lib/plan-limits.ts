/** How many recent customer conversations each plan can view in Live Chat */
export const PLAN_CHAT_LIMITS: Record<string, number> = {
  none: 10,
  simple: 10,
  starter: 10,
  growth: 30,
  pro: 70,
  pro_voice: 70,
};

export function chatLimitForPlan(plan?: string | null, isPro?: boolean): number {
  const p = String(plan || "simple").toLowerCase();
  if (PLAN_CHAT_LIMITS[p] != null) return PLAN_CHAT_LIMITS[p];
  if (isPro) return 70;
  return 10;
}

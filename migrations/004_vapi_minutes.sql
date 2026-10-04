-- ═══════════════════════════════════════════════════════════════
-- Migration 004: Vapi voice minutes limits + usage audit
-- Safe / additive on existing businesses table
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS monthly_minutes_limit INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS minutes_used NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS usage_period_start TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'simple',
  ADD COLUMN IF NOT EXISTS extra_minutes NUMERIC(12,2) DEFAULT 0;

COMMENT ON COLUMN public.businesses.monthly_minutes_limit IS 'Base monthly Vapi minutes from plan (e.g. 100 for simple)';
COMMENT ON COLUMN public.businesses.minutes_used IS 'Minutes consumed in current usage period';
COMMENT ON COLUMN public.businesses.usage_period_start IS 'Start of current monthly usage window';
COMMENT ON COLUMN public.businesses.subscription_plan IS 'simple | growth | pro_voice | none';
COMMENT ON COLUMN public.businesses.extra_minutes IS 'Purchased top-up minutes (added to limit until period reset or forever)';

-- Per-call audit log
CREATE TABLE IF NOT EXISTS public.vapi_usage (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id      UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id          UUID REFERENCES auth.users(id),
  call_id          TEXT,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  minutes          NUMERIC(12,2) NOT NULL DEFAULT 0,
  source           TEXT DEFAULT 'vapi',
  raw              JSONB,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_vapi_usage_call_id
  ON public.vapi_usage(call_id)
  WHERE call_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vapi_usage_business
  ON public.vapi_usage(business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vapi_usage_user
  ON public.vapi_usage(user_id, created_at DESC);

ALTER TABLE public.vapi_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_vapi_usage" ON public.vapi_usage;
CREATE POLICY "own_vapi_usage" ON public.vapi_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Optional: minute top-up purchase ledger
CREATE TABLE IF NOT EXISTS public.minute_purchases (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID REFERENCES auth.users(id) NOT NULL,
  business_id      UUID REFERENCES public.businesses(id),
  minutes_added    INTEGER NOT NULL,
  paddle_txn_id    TEXT,
  plan_or_pack     TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.minute_purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own_minute_purchases" ON public.minute_purchases;
CREATE POLICY "own_minute_purchases" ON public.minute_purchases
  FOR SELECT USING (auth.uid() = user_id);

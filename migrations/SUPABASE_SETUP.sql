-- ═══════════════════════════════════════════════════════════════
-- BookAI — run once in Supabase SQL Editor
-- Safe on your existing businesses + appointments tables.
-- Only ADDS missing columns/tables. Does not drop data.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Extra columns on businesses ─────────────────────────────
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_business_account_id TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_connected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_url TEXT,
  ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS phone_public TEXT DEFAULT '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_whatsapp_phone_number_id
  ON public.businesses(whatsapp_phone_number_id)
  WHERE whatsapp_phone_number_id IS NOT NULL;

-- ── 2. Appointments: updated_at (optional) ─────────────────────
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_appointments_user_date
  ON public.appointments(user_id, date);
CREATE INDEX IF NOT EXISTS idx_appointments_status
  ON public.appointments(status);

-- ── 3. Paddle subscriptions (one row per owner) ────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                     UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  paddle_customer_id     TEXT,
  paddle_subscription_id TEXT UNIQUE,
  paddle_price_id        TEXT,
  status                 TEXT NOT NULL DEFAULT 'none',
  next_billed_at         TIMESTAMPTZ,
  canceled_at            TIMESTAMPTZ,
  created_at             TIMESTAMPTZ DEFAULT now(),
  updated_at             TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_subscription" ON public.subscriptions;
CREATE POLICY "own_subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paddle_subscription_id
  ON public.subscriptions(paddle_subscription_id);

-- ── 4. Conversations (WhatsApp / chat log) ─────────────────────
CREATE TABLE IF NOT EXISTS public.conversations (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) NOT NULL,
  channel         TEXT NOT NULL DEFAULT 'whatsapp',
  customer_phone  TEXT,
  customer_name   TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id  UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  role             TEXT NOT NULL,
  content          TEXT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_conversations" ON public.conversations;
CREATE POLICY "own_conversations" ON public.conversations
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own_conversation_messages" ON public.conversation_messages;
CREATE POLICY "own_conversation_messages" ON public.conversation_messages
  FOR ALL USING (
    conversation_id IN (SELECT id FROM public.conversations WHERE user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_customer_phone ON public.conversations(customer_phone);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id
  ON public.conversation_messages(conversation_id);

-- ── 5. Reminder dedupe log ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.appointment_reminders (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id  TEXT NOT NULL,
  user_id         UUID REFERENCES auth.users(id) NOT NULL,
  channel         TEXT NOT NULL DEFAULT 'whatsapp',
  lead_minutes    INT NOT NULL,
  sent_at         TIMESTAMPTZ DEFAULT now(),
  UNIQUE (appointment_id, channel, lead_minutes)
);

ALTER TABLE public.appointment_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_reminders" ON public.appointment_reminders;
CREATE POLICY "own_reminders" ON public.appointment_reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_reminders_appt ON public.appointment_reminders(appointment_id);

-- ── 6. RLS on existing tables (if not already) ─────────────────
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_business" ON public.businesses;
CREATE POLICY "own_business" ON public.businesses
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own_appointments" ON public.appointments;
CREATE POLICY "own_appointments" ON public.appointments
  FOR ALL USING (auth.uid() = user_id);

-- Public read of business by slug (customer chat / voice) via service role
-- Client uses anon + RLS for owner; webhook/book APIs use service role.

-- ── 7. Auth tip ────────────────────────────────────────────────
-- Dashboard → Authentication → Providers → Email
-- Turn OFF "Confirm email" so signup works immediately.

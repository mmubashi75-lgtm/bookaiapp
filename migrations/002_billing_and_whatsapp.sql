-- ═══════════════════════════════════════════════════════════════
-- Migration 002: Paddle Billing + WhatsApp Cloud API
-- Only adds new columns/tables. Does not touch existing
-- `businesses` or `appointments` columns/rows.
-- Run this in Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════

-- ── Feature 1: Paddle Billing ────────────────────────────────────

-- One subscription row per business owner (Supabase auth user).
CREATE TABLE IF NOT EXISTS subscriptions (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  paddle_customer_id   TEXT,
  paddle_subscription_id TEXT UNIQUE,
  paddle_price_id      TEXT,
  status               TEXT NOT NULL DEFAULT 'none',
    -- 'none' | 'trialing' | 'active' | 'past_due' | 'paused' | 'canceled'
  next_billed_at       TIMESTAMPTZ,
  canceled_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);
-- Inserts/updates to this table are only ever done by the webhook
-- and billing API routes, which use the Supabase service role key
-- (bypasses RLS) — no client-side write policy is needed or added.

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paddle_subscription_id ON subscriptions(paddle_subscription_id);

-- Keep updated_at current on every write.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ── Feature 2: WhatsApp Cloud API ────────────────────────────────

-- Each business can connect one WhatsApp Business phone number.
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_business_account_id TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_connected_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_whatsapp_phone_number_id
  ON businesses(whatsapp_phone_number_id)
  WHERE whatsapp_phone_number_id IS NOT NULL;

-- Conversation log, shared by WhatsApp now and reusable later for
-- Feature 9 (Live Chat rework) across website chat / voice too.
CREATE TABLE IF NOT EXISTS conversations (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) NOT NULL,
  channel         TEXT NOT NULL DEFAULT 'whatsapp', -- 'whatsapp' | 'chat' | 'voice'
  customer_phone  TEXT,
  customer_name   TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversation_messages (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  role            TEXT NOT NULL, -- 'user' | 'assistant' | 'owner'
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_conversations" ON conversations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "own_conversation_messages" ON conversation_messages
  FOR ALL USING (
    conversation_id IN (SELECT id FROM conversations WHERE user_id = auth.uid())
  );
-- The WhatsApp webhook itself writes with the Supabase service role
-- key (bypasses RLS), since it runs before the customer is
-- authenticated as anyone.

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_customer_phone ON conversations(customer_phone);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);

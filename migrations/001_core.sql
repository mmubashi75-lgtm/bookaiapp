-- ═══════════════════════════════════════════════════════════════
-- Migration 001: Core tables (businesses + appointments)
-- Run this FIRST in Supabase SQL Editor, then run 002.
-- Minimal schema required by the billing + WhatsApp features.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS businesses (
  id                          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                     UUID REFERENCES auth.users(id) NOT NULL,
  slug                        TEXT UNIQUE,
  name                        TEXT NOT NULL DEFAULT 'My Business',
  hours                       TEXT DEFAULT 'Mon–Fri 9am–6pm',
  address                     TEXT,
  services                    JSONB DEFAULT '[]'::jsonb,
  faqs                        JSONB DEFAULT '[]'::jsonb,
  -- WhatsApp columns are added in 002
  created_at                  TIMESTAMPTZ DEFAULT now(),
  updated_at                  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_businesses" ON businesses
  FOR ALL USING (auth.uid() = user_id);

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) NOT NULL,
  customer_name   TEXT NOT NULL,
  phone           TEXT,
  service         TEXT NOT NULL,
  date            TEXT NOT NULL,   -- YYYY-MM-DD
  time            TEXT NOT NULL,
  status          TEXT DEFAULT 'confirmed',
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_appointments" ON appointments
  FOR ALL USING (auth.uid() = user_id);

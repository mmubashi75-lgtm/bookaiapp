-- ═══════════════════════════════════════════════════════════════
-- Migration 003: Branding, reminders, booking enhancements
-- Additive only. Safe to run after 001 + 002.
-- ═══════════════════════════════════════════════════════════════

-- Branding on businesses
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_url TEXT,
  ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS phone_public TEXT DEFAULT '';

-- Service/FAQ image support lives inside existing JSONB
-- services[].image_url, faqs[].image_url (no schema change)

-- Appointments: ensure phone + timestamps + status values
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Reminders log (avoid duplicate sends)
CREATE TABLE IF NOT EXISTS appointment_reminders (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id  TEXT NOT NULL,
  user_id         UUID REFERENCES auth.users(id) NOT NULL,
  channel         TEXT NOT NULL DEFAULT 'whatsapp', -- whatsapp | chat | phone | sms
  lead_minutes    INT NOT NULL,                    -- 1440 | 120 | 30
  sent_at         TIMESTAMPTZ DEFAULT now(),
  UNIQUE (appointment_id, channel, lead_minutes)
);

ALTER TABLE appointment_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_reminders" ON appointment_reminders
  FOR SELECT USING (auth.uid() = user_id);
-- Writes via service role only

CREATE INDEX IF NOT EXISTS idx_reminders_appt ON appointment_reminders(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_date ON appointments(user_id, date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Storage buckets (run in Supabase Dashboard → Storage, or via SQL if available):
-- 1. Create public bucket: business-branding
-- 2. Policies: authenticated users can upload to folder matching their user_id
--
-- Example storage policies (Supabase Storage):
-- INSERT: (bucket_id = 'business-branding' AND auth.uid()::text = (storage.foldername(name))[1])
-- SELECT: public read for business-branding

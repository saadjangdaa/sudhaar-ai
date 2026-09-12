-- Agent 4 verification columns for the reports table.
-- Run in Supabase SQL editor if the table already exists.

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS after_image_url text,
  ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS verification_confidence numeric,
  ADD COLUMN IF NOT EXISTS verification_reason text,
  ADD COLUMN IF NOT EXISTS tamper_flag boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;

-- Optional: constrain verification_status values
-- ALTER TABLE reports ADD CONSTRAINT reports_verification_status_check
--   CHECK (verification_status IN ('unverified', 'fixed', 'not_fixed', 'inconclusive'));

-- Base reports table (run first if starting fresh).
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_type text NOT NULL,
  summary text,
  authority_assigned text,
  complaint_text text,
  area_tag text,
  media_url text,
  upvotes integer DEFAULT 0,
  after_image_url text,
  verification_status text DEFAULT 'unverified',
  verification_confidence numeric,
  verification_reason text,
  tamper_flag boolean DEFAULT false,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

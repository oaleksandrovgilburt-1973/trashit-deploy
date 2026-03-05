-- Create disputes table
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  opened_by_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  opened_against_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'open', -- open, resolved, closed
  resolution TEXT,
  resolved_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for disputes
CREATE INDEX IF NOT EXISTS idx_disputes_request_id ON disputes(request_id);
CREATE INDEX IF NOT EXISTS idx_disputes_opened_by_id ON disputes(opened_by_id);
CREATE INDEX IF NOT EXISTS idx_disputes_opened_against_id ON disputes(opened_against_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON disputes(created_at DESC);

-- Enable RLS on disputes
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for disputes
-- Users can view disputes they are involved in
CREATE POLICY "users_view_own_disputes" ON disputes
  FOR SELECT
  USING (
    auth.uid() = opened_by_id 
    OR auth.uid() = opened_against_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can create disputes
CREATE POLICY "users_create_disputes" ON disputes
  FOR INSERT
  WITH CHECK (auth.uid() = opened_by_id);

-- Admins can update disputes
CREATE POLICY "admins_update_disputes" ON disputes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create dispute evidence table for attachments
CREATE TABLE IF NOT EXISTS dispute_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50), -- photo, document, etc
  description TEXT,
  uploaded_by_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for dispute evidence
CREATE INDEX IF NOT EXISTS idx_dispute_evidence_dispute_id ON dispute_evidence(dispute_id);
CREATE INDEX IF NOT EXISTS idx_dispute_evidence_uploaded_by_id ON dispute_evidence(uploaded_by_id);

-- Enable RLS on dispute evidence
ALTER TABLE dispute_evidence ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dispute evidence
-- Users can view evidence for disputes they are involved in
CREATE POLICY "users_view_dispute_evidence" ON dispute_evidence
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM disputes d
      WHERE d.id = dispute_id
      AND (d.opened_by_id = auth.uid() OR d.opened_against_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can upload evidence for their disputes
CREATE POLICY "users_upload_evidence" ON dispute_evidence
  FOR INSERT
  WITH CHECK (
    auth.uid() = uploaded_by_id
    AND EXISTS (
      SELECT 1 FROM disputes d
      WHERE d.id = dispute_id
      AND (d.opened_by_id = auth.uid() OR d.opened_against_id = auth.uid())
    )
  );

-- Create user reports table
CREATE TABLE IF NOT EXISTS user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason VARCHAR(100) NOT NULL, -- inappropriate_behavior, fraud, etc
  description TEXT,
  status VARCHAR(50) DEFAULT 'open', -- open, investigating, resolved, dismissed
  resolution TEXT,
  resolved_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for user reports
CREATE INDEX IF NOT EXISTS idx_user_reports_reporter_id ON user_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_reported_user_id ON user_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports(status);
CREATE INDEX IF NOT EXISTS idx_user_reports_created_at ON user_reports(created_at DESC);

-- Enable RLS on user reports
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user reports
-- Admins can view all reports
CREATE POLICY "admins_view_reports" ON user_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can view their own reports
CREATE POLICY "users_view_own_reports" ON user_reports
  FOR SELECT
  USING (auth.uid() = reporter_id OR auth.uid() = reported_user_id);

-- Users can create reports
CREATE POLICY "users_create_reports" ON user_reports
  FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Admins can update reports
CREATE POLICY "admins_update_reports" ON user_reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Update requests table to add dispute_id and disputed_at columns
ALTER TABLE requests ADD COLUMN IF NOT EXISTS dispute_id UUID REFERENCES disputes(id) ON DELETE SET NULL;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS disputed_at TIMESTAMP WITH TIME ZONE;

-- Create index for dispute_id
CREATE INDEX IF NOT EXISTS idx_requests_dispute_id ON requests(dispute_id);

-- Function to auto-update updated_at timestamp for disputes
CREATE OR REPLACE FUNCTION update_disputes_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER disputes_updated_at
  BEFORE UPDATE ON disputes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to auto-update updated_at timestamp for user_reports
CREATE OR REPLACE FUNCTION update_user_reports_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER user_reports_updated_at
  BEFORE UPDATE ON user_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

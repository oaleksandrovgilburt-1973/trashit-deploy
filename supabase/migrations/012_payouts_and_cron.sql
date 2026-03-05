-- Create payouts table for tracking provider payments
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'BGN',
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed, disputed
  stripe_transfer_id VARCHAR(255),
  dispute_reason TEXT,
  dispute_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_payouts_provider_id ON payouts(provider_id);
CREATE INDEX IF NOT EXISTS idx_payouts_customer_id ON payouts(customer_id);
CREATE INDEX IF NOT EXISTS idx_payouts_request_id ON payouts(request_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_created_at ON payouts(created_at);

-- Enable RLS on payouts
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payouts
-- Providers can view their own payouts
CREATE POLICY "providers_view_own_payouts" ON payouts
  FOR SELECT
  USING (auth.uid() = provider_id);

-- Customers can view payouts for their requests
CREATE POLICY "customers_view_request_payouts" ON payouts
  FOR SELECT
  USING (auth.uid() = customer_id);

-- Admins can view all payouts
CREATE POLICY "admins_view_all_payouts" ON payouts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only system can insert/update payouts
CREATE POLICY "system_manage_payouts" ON payouts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "system_update_payouts" ON payouts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create audit log for payouts
CREATE TABLE IF NOT EXISTS payout_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id UUID NOT NULL REFERENCES payouts(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payout_audit_payout_id ON payout_audit_log(payout_id);

-- Function to auto-close completed jobs after 48 hours
CREATE OR REPLACE FUNCTION auto_close_completed_jobs()
RETURNS TABLE (closed_count INT) AS $$
DECLARE
  v_closed_count INT := 0;
  v_request RECORD;
BEGIN
  -- Find all completed requests older than 48 hours that are not yet closed
  FOR v_request IN
    SELECT r.id, r.provider_id, r.customer_id, r.price_offer, r.stripe_payment_intent_id
    FROM requests r
    WHERE r.status = 'completed'
      AND r.completed_at < NOW() - INTERVAL '48 hours'
      AND NOT EXISTS (
        SELECT 1 FROM requests r2
        WHERE r2.id = r.id AND r2.status = 'closed'
      )
  LOOP
    -- Update request status to closed
    UPDATE requests
    SET status = 'closed', updated_at = NOW()
    WHERE id = v_request.id;

    -- Create payout record if not exists
    INSERT INTO payouts (request_id, provider_id, customer_id, amount_cents, status)
    VALUES (v_request.id, v_request.provider_id, v_request.customer_id, v_request.price_offer, 'pending')
    ON CONFLICT DO NOTHING;

    -- Log the auto-close action
    INSERT INTO audit_log (entity_type, entity_id, actor_id, action, new_value)
    VALUES ('request', v_request.id, v_request.provider_id, 'auto_closed', '{"status":"closed"}');

    v_closed_count := v_closed_count + 1;
  END LOOP;

  RETURN QUERY SELECT v_closed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the auto-close function to run every hour
-- Note: This requires pg_cron extension to be enabled
-- Run this in Supabase SQL Editor after enabling pg_cron
-- SELECT cron.schedule('auto-close-jobs', '0 * * * *', 'SELECT auto_close_completed_jobs()');

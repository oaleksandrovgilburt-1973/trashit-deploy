/**
 * TRASHit Atomic Request Acceptance & Audit Logging
 * 
 * Execute this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
 * Creates RPC function for atomic job acceptance with race-condition safety
 */

-- ─── 1. Audit Log Table ──────────────────────────────────────────────────────
-- Track all important actions for compliance and debugging

CREATE TABLE IF NOT EXISTS audit_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type       TEXT NOT NULL,
  entity_id         UUID NOT NULL,
  actor_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action            TEXT NOT NULL,
  old_value         JSONB,
  new_value         JSONB,
  ip_address        INET,
  user_agent        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);

-- ─── 2. Atomic Accept RPC Function ───────────────────────────────────────────
-- Uses FOR UPDATE NOWAIT to prevent race conditions
-- Returns JSON with success/error status

CREATE OR REPLACE FUNCTION accept_request(
  p_request_id UUID,
  p_provider_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request requests%ROWTYPE;
  v_customer_id UUID;
BEGIN
  -- Lock the request row for update (fail immediately if already locked)
  SELECT * INTO v_request FROM requests
    WHERE id = p_request_id
    FOR UPDATE NOWAIT;

  -- Check if request exists and is still open
  IF NOT FOUND OR v_request.status != 'open' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'already_taken',
      'message', 'Тази работа вече е възложена на друг доставчик'
    );
  END IF;

  -- Check if provider is in the request's region
  IF NOT EXISTS (
    SELECT 1 FROM provider_regions
    WHERE provider_id = p_provider_id
    AND region_id = v_request.region_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not_in_region',
      'message', 'Вие не работите в този регион'
    );
  END IF;

  -- Check if provider is approved
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_provider_id
    AND provider_status = 'approved'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not_approved',
      'message', 'Вашият профил не е одобрен'
    );
  END IF;

  -- Get customer ID for audit log
  v_customer_id := v_request.customer_id;

  -- Update request status
  UPDATE requests SET
    status = 'assigned',
    provider_id = p_provider_id,
    updated_at = NOW()
  WHERE id = p_request_id;

  -- Create audit log entry
  INSERT INTO audit_log(entity_type, entity_id, actor_id, action, old_value, new_value)
  VALUES (
    'request',
    p_request_id,
    p_provider_id,
    'status_changed',
    jsonb_build_object('status', 'open', 'provider_id', NULL),
    jsonb_build_object('status', 'assigned', 'provider_id', p_provider_id)
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Работата е успешно възложена',
    'request_id', p_request_id,
    'customer_id', v_customer_id
  );

EXCEPTION
  WHEN lock_not_available THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'already_taken',
      'message', 'Тази работа вече е възложена на друг доставчик'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'database_error',
      'message', SQLERRM
    );
END;
$$;

-- ─── 3. RLS Policies for Audit Log ──────────────────────────────────────────

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
ON audit_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Users can view audit logs for their own entities
CREATE POLICY "Users can view own audit logs"
ON audit_log FOR SELECT
USING (
  actor_id = auth.uid()
  OR entity_id IN (
    SELECT id FROM requests
    WHERE customer_id = auth.uid()
    OR provider_id = auth.uid()
  )
);

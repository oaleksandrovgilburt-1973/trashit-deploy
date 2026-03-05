/**
 * TRASHit Job Completion & Rating System
 * 
 * Execute this in Supabase SQL Editor
 * Adds completion notes, ratings, and review functionality
 */

-- ─── 1. Add Completion Fields to Requests ───────────────────────────────────

ALTER TABLE requests
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completion_notes TEXT,
ADD COLUMN IF NOT EXISTS payment_captured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_captured_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_requests_completed_at ON requests(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_payment_captured ON requests(payment_captured);

-- ─── 2. Ratings & Reviews Table ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ratings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id        UUID NOT NULL UNIQUE REFERENCES requests(id) ON DELETE CASCADE,
  rater_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rated_user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating            INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ratings_request ON ratings(request_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rater ON ratings(rater_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rated_user ON ratings(rated_user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_created ON ratings(created_at DESC);

-- ─── 3. RLS Policies for Ratings ─────────────────────────────────────────────

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Users can view all ratings
CREATE POLICY "Anyone can view ratings"
ON ratings FOR SELECT
USING (true);

-- Users can create ratings for requests they're involved in
CREATE POLICY "Users can create ratings for their requests"
ON ratings FOR INSERT
WITH CHECK (
  rater_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM requests
    WHERE requests.id = request_id
    AND (
      requests.customer_id = auth.uid()
      OR requests.provider_id = auth.uid()
    )
  )
);

-- Users can update their own ratings
CREATE POLICY "Users can update their own ratings"
ON ratings FOR UPDATE
USING (rater_id = auth.uid())
WITH CHECK (rater_id = auth.uid());

-- ─── 4. Complete Request RPC Function ────────────────────────────────────────

CREATE OR REPLACE FUNCTION complete_request(
  p_request_id UUID,
  p_provider_id UUID,
  p_completion_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request requests%ROWTYPE;
BEGIN
  -- Lock the request row for update
  SELECT * INTO v_request FROM requests
    WHERE id = p_request_id
    FOR UPDATE NOWAIT;

  -- Check if request exists and is assigned to this provider
  IF NOT FOUND OR v_request.status != 'assigned' OR v_request.provider_id != p_provider_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_request',
      'message', 'Работата не е възложена на вас или вече е завършена'
    );
  END IF;

  -- Update request status
  UPDATE requests SET
    status = 'completed',
    completed_at = NOW(),
    completion_notes = p_completion_notes,
    updated_at = NOW()
  WHERE id = p_request_id;

  -- Create audit log entry
  INSERT INTO audit_log(entity_type, entity_id, actor_id, action, old_value, new_value)
  VALUES (
    'request',
    p_request_id,
    p_provider_id,
    'status_changed',
    jsonb_build_object('status', 'assigned'),
    jsonb_build_object('status', 'completed', 'completed_at', NOW())
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Работата е маркирана като завършена',
    'request_id', p_request_id,
    'customer_id', v_request.customer_id
  );

EXCEPTION
  WHEN lock_not_available THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'locked',
      'message', 'Работата е заключена. Опитайте отново.'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'database_error',
      'message', SQLERRM
    );
END;
$$;

-- ─── 5. Calculate Provider Rating Function ───────────────────────────────────

CREATE OR REPLACE FUNCTION get_provider_rating(p_provider_id UUID)
RETURNS TABLE(
  avg_rating NUMERIC,
  total_ratings BIGINT,
  five_star BIGINT,
  four_star BIGINT,
  three_star BIGINT,
  two_star BIGINT,
  one_star BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ROUND(AVG(rating)::NUMERIC, 2) as avg_rating,
    COUNT(*) as total_ratings,
    COUNT(*) FILTER (WHERE rating = 5) as five_star,
    COUNT(*) FILTER (WHERE rating = 4) as four_star,
    COUNT(*) FILTER (WHERE rating = 3) as three_star,
    COUNT(*) FILTER (WHERE rating = 2) as two_star,
    COUNT(*) FILTER (WHERE rating = 1) as one_star
  FROM ratings
  WHERE rated_user_id = p_provider_id;
$$;

-- ─── 6. Update Requests Table RLS for Completion ──────────────────────────────

-- Customers can update their own requests (for rating)
CREATE POLICY "Customers can update their own requests"
ON requests FOR UPDATE
USING (customer_id = auth.uid())
WITH CHECK (customer_id = auth.uid());

-- Providers can update their assigned requests (for completion)
CREATE POLICY "Providers can update their assigned requests"
ON requests FOR UPDATE
USING (provider_id = auth.uid())
WITH CHECK (provider_id = auth.uid());

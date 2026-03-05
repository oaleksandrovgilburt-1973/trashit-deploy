-- Create audit_log table for tracking all system events
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_email VARCHAR(255),
  entity_type VARCHAR(50) NOT NULL, -- 'request', 'dispute', 'user', 'payment', etc.
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'accepted', etc.
  old_values JSONB, -- Previous values for updates
  new_values JSONB, -- New values for updates
  changes JSONB, -- Specific fields that changed
  description TEXT, -- Human-readable description
  ip_address INET,
  user_agent TEXT,
  status_code INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_audit_log_actor_id ON audit_log(actor_id);
CREATE INDEX idx_audit_log_entity_type ON audit_log(entity_type);
CREATE INDEX idx_audit_log_entity_id ON audit_log(entity_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_composite ON audit_log(entity_type, entity_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policy: System can insert audit logs (service role)
CREATE POLICY "System can insert audit logs"
  ON audit_log
  FOR INSERT
  WITH CHECK (true);

-- Create function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_actor_id UUID,
  p_actor_email VARCHAR,
  p_entity_type VARCHAR,
  p_entity_id UUID,
  p_action VARCHAR,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_changes JSONB DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_status_code INTEGER DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO audit_log (
    actor_id,
    actor_email,
    entity_type,
    entity_id,
    action,
    old_values,
    new_values,
    changes,
    description,
    ip_address,
    user_agent,
    status_code,
    error_message
  ) VALUES (
    p_actor_id,
    p_actor_email,
    p_entity_type,
    p_entity_id,
    p_action,
    p_old_values,
    p_new_values,
    p_changes,
    p_description,
    p_ip_address,
    p_user_agent,
    p_status_code,
    p_error_message
  ) RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get audit log summary
CREATE OR REPLACE FUNCTION get_audit_log_summary(
  p_entity_type VARCHAR DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  actor_id UUID,
  actor_email VARCHAR,
  entity_type VARCHAR,
  entity_id UUID,
  action VARCHAR,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  actor_name VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.actor_id,
    al.actor_email,
    al.entity_type,
    al.entity_id,
    al.action,
    al.description,
    al.created_at,
    p.full_name
  FROM audit_log al
  LEFT JOIN profiles p ON al.actor_id = p.id
  WHERE (p_entity_type IS NULL OR al.entity_type = p_entity_type)
    AND (p_entity_id IS NULL OR al.entity_id = p_entity_id)
  ORDER BY al.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Create function to get audit log count
CREATE OR REPLACE FUNCTION get_audit_log_count(
  p_entity_type VARCHAR DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM audit_log
  WHERE (p_entity_type IS NULL OR entity_type = p_entity_type)
    AND (p_entity_id IS NULL OR entity_id = p_entity_id);

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to log request status changes
CREATE OR REPLACE FUNCTION log_request_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    PERFORM log_audit_event(
      p_actor_id := NULL,
      p_actor_email := NULL,
      p_entity_type := 'request',
      p_entity_id := NEW.id,
      p_action := 'status_changed',
      p_old_values := jsonb_build_object('status', OLD.status),
      p_new_values := jsonb_build_object('status', NEW.status),
      p_changes := jsonb_build_object('status', jsonb_build_object('from', OLD.status, 'to', NEW.status)),
      p_description := 'Request status changed from ' || OLD.status || ' to ' || NEW.status
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on requests table
DROP TRIGGER IF EXISTS trigger_log_request_status_change ON requests;
CREATE TRIGGER trigger_log_request_status_change
AFTER UPDATE ON requests
FOR EACH ROW
EXECUTE FUNCTION log_request_status_change();

-- Create trigger to log dispute status changes
CREATE OR REPLACE FUNCTION log_dispute_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    PERFORM log_audit_event(
      p_actor_id := NEW.resolved_by_id,
      p_actor_email := NULL,
      p_entity_type := 'dispute',
      p_entity_id := NEW.id,
      p_action := 'status_changed',
      p_old_values := jsonb_build_object('status', OLD.status),
      p_new_values := jsonb_build_object('status', NEW.status),
      p_changes := jsonb_build_object('status', jsonb_build_object('from', OLD.status, 'to', NEW.status)),
      p_description := 'Dispute status changed from ' || OLD.status || ' to ' || NEW.status
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on disputes table
DROP TRIGGER IF EXISTS trigger_log_dispute_status_change ON disputes;
CREATE TRIGGER trigger_log_dispute_status_change
AFTER UPDATE ON disputes
FOR EACH ROW
EXECUTE FUNCTION log_dispute_status_change();

-- Create trigger to log user status changes
CREATE OR REPLACE FUNCTION log_user_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_blocked != NEW.is_blocked OR OLD.is_banned != NEW.is_banned THEN
    PERFORM log_audit_event(
      p_actor_id := NULL,
      p_actor_email := NULL,
      p_entity_type := 'user',
      p_entity_id := NEW.id,
      p_action := 'status_changed',
      p_old_values := jsonb_build_object('is_blocked', OLD.is_blocked, 'is_banned', OLD.is_banned),
      p_new_values := jsonb_build_object('is_blocked', NEW.is_blocked, 'is_banned', NEW.is_banned),
      p_changes := jsonb_build_object('blocked', jsonb_build_object('from', OLD.is_blocked, 'to', NEW.is_blocked), 'banned', jsonb_build_object('from', OLD.is_banned, 'to', NEW.is_banned)),
      p_description := 'User status changed'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS trigger_log_user_status_change ON profiles;
CREATE TRIGGER trigger_log_user_status_change
AFTER UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION log_user_status_change();

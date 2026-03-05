-- Create user_blocks table for blocking functionality
CREATE TABLE IF NOT EXISTS user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a user can only block another user once
  UNIQUE(blocker_id, blocked_user_id),
  
  -- Ensure a user cannot block themselves
  CONSTRAINT no_self_block CHECK (blocker_id != blocked_user_id)
);

-- Create index for faster lookups
CREATE INDEX idx_user_blocks_blocker_id ON user_blocks(blocker_id);
CREATE INDEX idx_user_blocks_blocked_user_id ON user_blocks(blocked_user_id);
CREATE INDEX idx_user_blocks_composite ON user_blocks(blocker_id, blocked_user_id);

-- Enable Row Level Security
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own blocks
CREATE POLICY "Users can view their own blocks"
  ON user_blocks
  FOR SELECT
  USING (auth.uid() = blocker_id OR auth.uid() = blocked_user_id);

-- RLS Policy: Users can create blocks
CREATE POLICY "Users can create blocks"
  ON user_blocks
  FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

-- RLS Policy: Users can delete their own blocks
CREATE POLICY "Users can delete their own blocks"
  ON user_blocks
  FOR DELETE
  USING (auth.uid() = blocker_id);

-- RLS Policy: Admins can view all blocks
CREATE POLICY "Admins can view all blocks"
  ON user_blocks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to check if user is blocked
CREATE OR REPLACE FUNCTION is_user_blocked(
  p_blocker_id UUID,
  p_blocked_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_blocks
    WHERE blocker_id = p_blocker_id
      AND blocked_user_id = p_blocked_user_id
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Create function to check if user is suspended
CREATE OR REPLACE FUNCTION is_user_suspended(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_user_id
      AND (is_blocked = true OR is_banned = true)
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Add audit logging for blocks
CREATE TABLE IF NOT EXISTS block_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES profiles(id),
  blocked_user_id UUID NOT NULL REFERENCES profiles(id),
  action VARCHAR(50) NOT NULL, -- 'block' or 'unblock'
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for audit log
CREATE INDEX idx_block_audit_log_created_at ON block_audit_log(created_at DESC);

-- Enable Row Level Security on audit log
ALTER TABLE block_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can view all audit logs
CREATE POLICY "Admins can view block audit logs"
  ON block_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

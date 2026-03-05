-- Create notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
-- Users can view their own notifications
CREATE POLICY "users_view_own_notifications" ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "users_update_own_notifications" ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- System can insert notifications
CREATE POLICY "system_insert_notifications" ON notifications
  FOR INSERT
  WITH CHECK (true);

-- Create email_log table for tracking sent emails
CREATE TABLE IF NOT EXISTS email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email_address TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  subject TEXT NOT NULL,
  resend_id TEXT,
  status VARCHAR(50) DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for email log
CREATE INDEX IF NOT EXISTS idx_email_log_user_id ON email_log(user_id);
CREATE INDEX IF NOT EXISTS idx_email_log_type ON email_log(type);
CREATE INDEX IF NOT EXISTS idx_email_log_created_at ON email_log(created_at DESC);

-- Enable RLS on email_log
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_log
-- Admins can view all email logs
CREATE POLICY "admins_view_email_logs" ON email_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can view their own email logs
CREATE POLICY "users_view_own_email_logs" ON email_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert email logs
CREATE POLICY "system_insert_email_logs" ON email_log
  FOR INSERT
  WITH CHECK (true);

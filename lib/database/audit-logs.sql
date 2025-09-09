-- Audit Logs Table
-- Tracks all administrative actions and system events for security and compliance

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- e.g., 'user_created', 'company_deleted', 'role_changed'
  resource_type VARCHAR(50) NOT NULL, -- e.g., 'user', 'company', 'invitation'
  resource_id UUID, -- ID of the affected resource
  old_values JSONB, -- Previous state of the resource
  new_values JSONB, -- New state of the resource
  metadata JSONB, -- Additional context (IP address, user agent, etc.)
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('low', 'info', 'warning', 'error', 'critical'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);

-- RLS Policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only site admins can view audit logs
CREATE POLICY "Site admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'site_admin'
    )
  );

-- System can insert audit logs (no user context needed for system events)
CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- Audit log categories for better organization
CREATE TYPE audit_action_category AS ENUM (
  'user_management',
  'company_management', 
  'invitation_management',
  'system_configuration',
  'security_event',
  'data_export',
  'bulk_operations'
);

-- Add category column
ALTER TABLE audit_logs ADD COLUMN category audit_action_category DEFAULT 'user_management';

-- Index for category
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(category);

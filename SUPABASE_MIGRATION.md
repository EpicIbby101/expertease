# Database Migration Required

To fix the users table and enable soft deletion, please run the following SQL in your Supabase SQL Editor:

## Users Soft Delete Migration

```sql
-- Add soft delete columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_reason TEXT;

-- Add indexes for soft delete queries
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_users_deleted_by ON users(deleted_by);
```

## Audit Logs Migration

```sql
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
```

## System Configuration Migration

```sql
-- System Configuration Table
-- Stores platform-wide settings and configuration options

CREATE TABLE IF NOT EXISTS system_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'invitation_expiry_days', 'max_company_trainees'
  value JSONB NOT NULL, -- Flexible value storage
  description TEXT, -- Human-readable description
  category VARCHAR(50) NOT NULL, -- e.g., 'invitations', 'companies', 'security', 'email'
  data_type VARCHAR(20) NOT NULL DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json', 'array')),
  is_public BOOLEAN DEFAULT false, -- Whether this config can be accessed by non-admins
  is_required BOOLEAN DEFAULT false, -- Whether this config is required
  validation_rules JSONB, -- JSON schema for validation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(key);
CREATE INDEX IF NOT EXISTS idx_system_config_category ON system_config(category);
CREATE INDEX IF NOT EXISTS idx_system_config_is_public ON system_config(is_public);

-- RLS Policies
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Only site admins can view all config
CREATE POLICY "Site admins can view all config" ON system_config
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'site_admin'
    )
  );

-- Public config can be viewed by authenticated users
CREATE POLICY "Authenticated users can view public config" ON system_config
  FOR SELECT USING (
    is_public = true AND auth.uid() IS NOT NULL
  );

-- Only site admins can modify config
CREATE POLICY "Site admins can modify config" ON system_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'site_admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_system_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_system_config_updated_at
  BEFORE UPDATE ON system_config
  FOR EACH ROW
  EXECUTE FUNCTION update_system_config_updated_at();

-- Insert default system configuration
INSERT INTO system_config (key, value, description, category, data_type, is_public, is_required) VALUES
-- Invitation Settings
('invitation_expiry_days', '7', 'Number of days invitations remain valid', 'invitations', 'number', false, true),
('invitation_max_attempts', '3', 'Maximum number of invitation resend attempts', 'invitations', 'number', false, true),
('invitation_email_template', '{"subject": "You are invited to join Expert Ease", "body": "Welcome to Expert Ease! Click the link below to accept your invitation."}', 'Email template for invitations', 'invitations', 'json', false, false),

-- Company Settings
('max_company_trainees', '100', 'Maximum number of trainees per company', 'companies', 'number', false, true),
('company_name_min_length', '2', 'Minimum length for company names', 'companies', 'number', false, true),
('company_name_max_length', '100', 'Maximum length for company names', 'companies', 'number', false, true),

-- Security Settings
('password_min_length', '8', 'Minimum password length', 'security', 'number', true, true),
('password_require_special_chars', 'true', 'Require special characters in passwords', 'security', 'boolean', true, true),
('session_timeout_hours', '24', 'User session timeout in hours', 'security', 'number', false, true),
('max_login_attempts', '5', 'Maximum failed login attempts before lockout', 'security', 'number', false, true),
('lockout_duration_minutes', '30', 'Account lockout duration in minutes', 'security', 'number', false, true),

-- Email Settings
('email_from_name', 'Expert Ease', 'Default sender name for emails', 'email', 'string', false, true),
('email_from_address', 'noreply@expertease.com', 'Default sender email address', 'email', 'string', false, true),
('email_smtp_enabled', 'true', 'Enable SMTP email sending', 'email', 'boolean', false, true),

-- Platform Settings
('maintenance_mode', 'false', 'Enable maintenance mode', 'platform', 'boolean', true, false),
('maintenance_message', 'We are currently performing scheduled maintenance. Please check back later.', 'Message shown during maintenance', 'platform', 'string', true, false),
('platform_name', 'Expert Ease', 'Platform display name', 'platform', 'string', true, true),
('platform_description', 'Professional training and development platform', 'Platform description', 'platform', 'string', true, false),
('support_email', 'support@expertease.com', 'Support contact email', 'platform', 'string', true, true),

-- Analytics Settings
('analytics_enabled', 'true', 'Enable analytics tracking', 'analytics', 'boolean', false, false),
('analytics_retention_days', '365', 'Analytics data retention period in days', 'analytics', 'number', false, false),

-- Audit Settings
('audit_log_retention_days', '90', 'Audit log retention period in days', 'audit', 'number', false, true),
('audit_log_level', 'info', 'Minimum audit log level to store', 'audit', 'string', false, true),

-- Feature Flags
('feature_user_impersonation', 'false', 'Enable user impersonation for admins', 'features', 'boolean', false, false),
('feature_bulk_operations', 'true', 'Enable bulk operations', 'features', 'boolean', false, false),
('feature_data_export', 'true', 'Enable data export functionality', 'features', 'boolean', false, false),
('feature_advanced_analytics', 'true', 'Enable advanced analytics dashboard', 'features', 'boolean', false, false)
ON CONFLICT (key) DO NOTHING;
```

## Instructions

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the SQL above
4. Run the migration
5. The recycling bin and audit logs should now work properly

## What This Enables

- **Users Soft Delete**: Users can now be soft-deleted and recovered
- **Audit Logs**: Complete audit trail for all admin actions
- **System Configuration**: Platform-wide settings management
- **Recycling Bin**: Centralized management of deleted items

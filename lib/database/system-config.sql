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


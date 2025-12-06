-- Support Tickets Table
-- Allows trainees to submit support requests and admins to manage them

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number VARCHAR(20) UNIQUE NOT NULL, -- e.g., TKT-1234567890
  user_id TEXT, -- References users(id) - TEXT type to match users table
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  company_name VARCHAR(255),
  
  -- Ticket details
  category VARCHAR(50) NOT NULL CHECK (category IN ('course', 'technical', 'account', 'access', 'other')),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to TEXT, -- Admin assigned to handle the ticket - TEXT type to match users table
  assigned_to_email VARCHAR(255), -- Email of assigned admin
  
  -- Response tracking
  admin_response TEXT,
  admin_response_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_company_id ON support_tickets(company_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON support_tickets(category);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_support_tickets_ticket_number ON support_tickets(ticket_number);

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := 'TKT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('ticket_sequence')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for ticket numbers if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS ticket_sequence START 1;

-- Trigger to auto-generate ticket number
CREATE TRIGGER set_ticket_number
  BEFORE INSERT ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION generate_ticket_number();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_support_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_support_tickets_timestamp
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_support_tickets_updated_at();

-- RLS Policies
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Trainees can view their own tickets
CREATE POLICY "Trainees can view own tickets" ON support_tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = support_tickets.user_id
      AND users.user_id = auth.uid()::text
      AND users.role = 'trainee'
    )
  );

-- Trainees can create tickets
CREATE POLICY "Trainees can create tickets" ON support_tickets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.user_id = auth.uid()::text
      AND users.role = 'trainee'
      AND users.id = support_tickets.user_id
    )
  );

-- Company admins can view tickets from their company
CREATE POLICY "Company admins can view company tickets" ON support_tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.user_id = auth.uid()::text
      AND users.role = 'company_admin'
      AND users.company_id = support_tickets.company_id
    )
  );

-- Site admins can view all tickets
CREATE POLICY "Site admins can view all tickets" ON support_tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.user_id = auth.uid()::text
      AND users.role = 'site_admin'
    )
  );

-- Company admins and site admins can update tickets
CREATE POLICY "Admins can update tickets" ON support_tickets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.user_id = auth.uid()::text
      AND (users.role = 'company_admin' OR users.role = 'site_admin')
    )
  );


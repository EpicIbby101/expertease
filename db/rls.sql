-- Enable RLS on tables
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (to allow idempotent application)
DROP POLICY IF EXISTS "Users can view their own data" ON "user";
DROP POLICY IF EXISTS "Users can insert their own data" ON "user";
DROP POLICY IF EXISTS "Users can update their own data" ON "user";
DROP POLICY IF EXISTS "Users can delete their own data" ON "user";

DROP POLICY IF EXISTS "Users can view their own payments" ON "payments";
DROP POLICY IF EXISTS "Users can insert their own payments" ON "payments";
DROP POLICY IF EXISTS "Users can update their own payments" ON "payments";
DROP POLICY IF EXISTS "Users can delete their own payments" ON "payments";

DROP POLICY IF EXISTS "Users can view their own subscriptions" ON "subscriptions";
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON "subscriptions";
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON "subscriptions";
DROP POLICY IF EXISTS "Users can delete their own subscriptions" ON "subscriptions";

DROP POLICY IF EXISTS "Anyone can view subscription plans" ON "subscriptions_plans";
DROP POLICY IF EXISTS "Only admins can modify subscription plans" ON "subscriptions_plans";

DROP POLICY IF EXISTS "Users can view their own invoices" ON "invoices";
DROP POLICY IF EXISTS "Users can insert their own invoices" ON "invoices";
DROP POLICY IF EXISTS "Users can update their own invoices" ON "invoices";
DROP POLICY IF EXISTS "Users can delete their own invoices" ON "invoices";

-- Create indexes for better RLS performance
CREATE INDEX IF NOT EXISTS idx_user_user_id ON "user"(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON "payments"(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON "subscriptions"(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON "invoices"(user_id);

-- User table policies
CREATE POLICY "Users can view their own data" 
  ON "user" 
  FOR SELECT 
  USING ((select auth.uid())::text = user_id);

CREATE POLICY "Users can insert their own data" 
  ON "user" 
  FOR INSERT 
  WITH CHECK ((select auth.uid())::text = user_id);

CREATE POLICY "Users can update their own data" 
  ON "user" 
  FOR UPDATE 
  USING ((select auth.uid())::text = user_id)
  WITH CHECK ((select auth.uid())::text = user_id);

CREATE POLICY "Users can delete their own data" 
  ON "user" 
  FOR DELETE 
  USING ((select auth.uid())::text = user_id);

-- Payments table policies
CREATE POLICY "Users can view their own payments" 
  ON "payments" 
  FOR SELECT 
  USING ((select auth.uid())::text = user_id);

CREATE POLICY "Users can insert their own payments" 
  ON "payments" 
  FOR INSERT 
  WITH CHECK ((select auth.uid())::text = user_id);

CREATE POLICY "Users can update their own payments" 
  ON "payments" 
  FOR UPDATE 
  USING ((select auth.uid())::text = user_id)
  WITH CHECK ((select auth.uid())::text = user_id);

CREATE POLICY "Users can delete their own payments" 
  ON "payments" 
  FOR DELETE 
  USING ((select auth.uid())::text = user_id);

-- Subscriptions table policies
CREATE POLICY "Users can view their own subscriptions" 
  ON "subscriptions" 
  FOR SELECT 
  USING ((select auth.uid())::text = user_id);

CREATE POLICY "Users can insert their own subscriptions" 
  ON "subscriptions" 
  FOR INSERT 
  WITH CHECK ((select auth.uid())::text = user_id);

CREATE POLICY "Users can update their own subscriptions" 
  ON "subscriptions" 
  FOR UPDATE 
  USING ((select auth.uid())::text = user_id)
  WITH CHECK ((select auth.uid())::text = user_id);

CREATE POLICY "Users can delete their own subscriptions" 
  ON "subscriptions" 
  FOR DELETE 
  USING ((select auth.uid())::text = user_id);

-- Subscription plans table policies (public readable, admin writable)
CREATE POLICY "Anyone can view subscription plans" 
  ON "subscriptions_plans" 
  FOR SELECT 
  USING (true);

CREATE POLICY "Only admins can modify subscription plans" 
  ON "subscriptions_plans" 
  FOR ALL 
  USING ((select auth.jwt()->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->>'role') = 'admin');

-- Invoices table policies
CREATE POLICY "Users can view their own invoices" 
  ON "invoices" 
  FOR SELECT 
  USING ((select auth.uid())::text = user_id);

CREATE POLICY "Users can insert their own invoices" 
  ON "invoices" 
  FOR INSERT 
  WITH CHECK ((select auth.uid())::text = user_id);

CREATE POLICY "Users can update their own invoices" 
  ON "invoices" 
  FOR UPDATE 
  USING ((select auth.uid())::text = user_id)
  WITH CHECK ((select auth.uid())::text = user_id);

CREATE POLICY "Users can delete their own invoices" 
  ON "invoices" 
  FOR DELETE 
  USING ((select auth.uid())::text = user_id); 
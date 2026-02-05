-- Database Assignment Table for Hybrid Multi-Database Architecture
-- Add this to the existing Supabase schema

-- User database assignments table
CREATE TABLE IF NOT EXISTS public.user_database_assignments (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  database_provider TEXT NOT NULL CHECK (database_provider IN ('mongodb', 'supabase')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_database_provider CHECK (database_provider IN ('mongodb', 'supabase'))
);

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_user_database_assignments_provider ON public.user_database_assignments(database_provider);

-- RLS Policies
ALTER TABLE public.user_database_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assignment" ON public.user_database_assignments
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all assignments (for admin and auto-assignment)
CREATE POLICY "Service role can manage assignments" ON public.user_database_assignments
  FOR ALL USING (auth.role() = 'service_role');

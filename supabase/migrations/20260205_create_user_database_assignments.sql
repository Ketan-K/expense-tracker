-- Create user_database_assignments table
-- This table tracks which database (MongoDB or Supabase) each user's data is stored in

CREATE TABLE IF NOT EXISTS public.user_database_assignments (
  user_id TEXT PRIMARY KEY,
  database_provider TEXT NOT NULL CHECK (database_provider IN ('mongodb', 'supabase')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_database_assignments_user_id ON public.user_database_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_database_assignments_provider ON public.user_database_assignments(database_provider);

-- Enable Row Level Security
ALTER TABLE public.user_database_assignments ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only read their own assignment
CREATE POLICY "Users can read own database assignment"
  ON public.user_database_assignments
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- Create policy: Service role can do everything (for admin/migration)
CREATE POLICY "Service role has full access"
  ON public.user_database_assignments
  FOR ALL
  USING (auth.role() = 'service_role');

-- Add comment
COMMENT ON TABLE public.user_database_assignments IS 'Tracks which database (MongoDB or Supabase) stores each user''s data during hybrid database migration';

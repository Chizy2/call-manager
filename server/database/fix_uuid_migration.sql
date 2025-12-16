-- Fix UUID Migration Issue
-- Run this if you're getting UUID/INTEGER type mismatch errors
-- This script checks and fixes column types

-- First, check if tables exist and what types they have
-- Run this query first to see current column types:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name IN ('users', 'contacts', 'call_records');

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can view all contacts" ON contacts;
DROP POLICY IF EXISTS "Users can create contacts" ON contacts;
DROP POLICY IF EXISTS "Users can view their own call records" ON call_records;
DROP POLICY IF EXISTS "Users can create call records" ON call_records;
DROP POLICY IF EXISTS "Users can update their own call records" ON call_records;

-- If users table exists with wrong type, drop and recreate
-- (Only do this if you don't have important data!)
-- DROP TABLE IF EXISTS call_records CASCADE;
-- DROP TABLE IF EXISTS contacts CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- Recreate users table with correct UUID type
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  username TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(email),
  UNIQUE(username)
);

-- Fix contacts table if uploaded_by is INTEGER
-- Check first: SELECT data_type FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'uploaded_by';
-- If it's INTEGER, run:
-- ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_uploaded_by_fkey;
-- ALTER TABLE contacts ALTER COLUMN uploaded_by TYPE UUID USING uploaded_by::text::uuid;
-- Then recreate foreign key:
-- ALTER TABLE contacts ADD CONSTRAINT contacts_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL;

-- Fix call_records table if user_id is INTEGER
-- Check first: SELECT data_type FROM information_schema.columns WHERE table_name = 'call_records' AND column_name = 'user_id';
-- If it's INTEGER, run:
-- ALTER TABLE call_records DROP CONSTRAINT IF EXISTS call_records_user_id_fkey;
-- ALTER TABLE call_records ALTER COLUMN user_id TYPE UUID USING user_id::text::uuid;
-- Then recreate foreign key:
-- ALTER TABLE call_records ADD CONSTRAINT call_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Ensure contacts.uploaded_by is UUID
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'contacts' AND column_name = 'uploaded_by' 
             AND data_type != 'uuid') THEN
    ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_uploaded_by_fkey;
    ALTER TABLE contacts ALTER COLUMN uploaded_by TYPE UUID USING NULL;
    ALTER TABLE contacts ADD CONSTRAINT contacts_uploaded_by_fkey 
      FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Ensure call_records.user_id is UUID
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'call_records' AND column_name = 'user_id' 
             AND data_type != 'uuid') THEN
    ALTER TABLE call_records DROP CONSTRAINT IF EXISTS call_records_user_id_fkey;
    ALTER TABLE call_records ALTER COLUMN user_id TYPE UUID USING NULL;
    ALTER TABLE call_records ADD CONSTRAINT call_records_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Now create the policies (they should work now)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can view all contacts"
  ON contacts FOR SELECT
  USING (true);

CREATE POLICY "Users can create contacts"
  ON contacts FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can view their own call records"
  ON call_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create call records"
  ON call_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own call records"
  ON call_records FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to automatically create user profile when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on auth user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


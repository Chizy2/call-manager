-- Fix infinite recursion in RLS policies
-- Run this in Supabase SQL Editor

-- 1. Drop ALL existing policies for users table
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON users';
    END LOOP;
END $$;

-- 2. Drop ALL existing policies for call_records table
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'call_records') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON call_records';
    END LOOP;
END $$;

-- 3. Drop ALL existing policies for contacts table
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'contacts') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON contacts';
    END LOOP;
END $$;

-- 4. Create new simple policies for users
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- 5. Create new policies for call_records
CREATE POLICY "Users can view own calls"
  ON call_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own calls"
  ON call_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calls"
  ON call_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 6. Create new policies for contacts
CREATE POLICY "Users can view all contacts"
  ON contacts FOR SELECT
  USING (true);

CREATE POLICY "Users can insert contacts"
  ON contacts FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update contacts"
  ON contacts FOR UPDATE
  USING (true);

-- 7. Verify the policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('users', 'call_records', 'contacts')
ORDER BY tablename, policyname;


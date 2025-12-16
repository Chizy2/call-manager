-- Fix infinite recursion in admin policies
-- Run this in Supabase SQL Editor

-- Drop the problematic policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Recreate policies WITHOUT infinite recursion
-- Simple policy: users can see their own data
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Fix call_records policies for admins
DROP POLICY IF EXISTS "Admins can view all call records" ON call_records;
DROP POLICY IF EXISTS "Users can view own call records" ON call_records;
DROP POLICY IF EXISTS "Users can update own call records" ON call_records;

-- Recreate call_records policies
CREATE POLICY "Users can view own calls"
  ON call_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own calls"
  ON call_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calls"
  ON call_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- For contacts - similar approach
DROP POLICY IF EXISTS "Users can view own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can insert contacts" ON contacts;
DROP POLICY IF EXISTS "Users can update own contacts" ON contacts;

CREATE POLICY "Users can view all contacts"
  ON contacts FOR SELECT
  USING (true);  -- All authenticated users can view contacts

CREATE POLICY "Users can insert contacts"
  ON contacts FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update contacts"
  ON contacts FOR UPDATE
  USING (true);  -- Allow updates for call records

-- Note: Admin access is handled by the SERVICE ROLE KEY on the backend
-- The backend uses supabaseAdmin which bypasses RLS entirely
-- So we don't need special admin policies that cause recursion


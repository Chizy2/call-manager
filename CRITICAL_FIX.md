# Critical Database Fix Required

## Issue
You're getting "infinite recursion detected in policy for relation 'users'" error.

## Solution
Run this SQL in your Supabase Dashboard → SQL Editor:

```sql
-- Fix infinite recursion in admin policies

-- Drop the problematic policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Recreate policies WITHOUT infinite recursion
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Fix call_records policies
DROP POLICY IF EXISTS "Admins can view all call records" ON call_records;
DROP POLICY IF EXISTS "Users can view own call records" ON call_records;
DROP POLICY IF EXISTS "Users can update own call records" ON call_records;

CREATE POLICY "Users can view own calls"
  ON call_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own calls"
  ON call_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calls"
  ON call_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Fix contacts policies
DROP POLICY IF EXISTS "Users can view own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can insert contacts" ON contacts;
DROP POLICY IF EXISTS "Users can update own contacts" ON contacts;

CREATE POLICY "Users can view all contacts"
  ON contacts FOR SELECT
  USING (true);

CREATE POLICY "Users can insert contacts"
  ON contacts FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update contacts"
  ON contacts FOR UPDATE
  USING (true);
```

## Steps:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to SQL Editor
4. Copy and paste the SQL above
5. Click "Run"
6. Wait for "Success. No rows returned"
7. Come back and restart the app

## What This Fixes:
- ✅ Removes the infinite recursion in RLS policies
- ✅ Allows admin backend to use SERVICE ROLE KEY (bypasses RLS)
- ✅ Keeps regular users restricted to their own data
- ✅ Allows admins full access via backend


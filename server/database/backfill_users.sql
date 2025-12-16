-- Backfill User Profiles for Existing Auth Users
-- Run this in Supabase SQL Editor to create user profiles for existing auth users
-- who don't have profiles yet

INSERT INTO public.users (id, email, full_name, username)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', ''),
  COALESCE(au.raw_user_meta_data->>'username', split_part(au.email, '@', 1))
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;


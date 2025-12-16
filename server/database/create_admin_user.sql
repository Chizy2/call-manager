-- Create admin user: admin@mejorra.com
-- This script creates an admin user directly in Supabase

-- IMPORTANT: Run this in Supabase SQL Editor (Dashboard > SQL Editor)

-- Step 1: Create the auth user (this will create the user in auth.users)
-- Note: You need to do this through Supabase Dashboard > Authentication > Users > "Add user"
-- OR use the signup form on your app with:
--   Email: admin@mejorra.com
--   Password: 6cb4OKE..
--   Check "Register as Admin"

-- Step 2: If the user already exists in auth.users, update their profile to be admin
-- First, get the user ID from auth.users
DO $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Get the user ID
    SELECT id INTO user_uuid
    FROM auth.users
    WHERE email = 'admin@mejorra.com';

    -- If user exists in auth, create/update their profile
    IF user_uuid IS NOT NULL THEN
        -- Insert or update the user profile
        INSERT INTO public.users (id, email, full_name, username, is_admin, created_at)
        VALUES (
            user_uuid,
            'admin@mejorra.com',
            'Admin User',
            'admin',
            true,
            NOW()
        )
        ON CONFLICT (id) 
        DO UPDATE SET
            is_admin = true,
            full_name = 'Admin User',
            username = 'admin';

        RAISE NOTICE 'Admin profile created/updated for user %', user_uuid;
    ELSE
        RAISE NOTICE 'User not found in auth.users. Please create the user first through signup.';
    END IF;
END $$;

-- Verify the admin user
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.username,
    u.is_admin,
    au.created_at as auth_created_at
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE u.email = 'admin@mejorra.com';


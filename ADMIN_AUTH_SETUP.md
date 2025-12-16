# Admin Authentication Setup

## Overview
Admin authentication has been successfully integrated into the Call Manager app using **Supabase Auth** (the same system used for regular users). Admins are differentiated by the `is_admin` flag in the database.

## How It Works

### 1. **Client-Side Authentication** (Browser)
- All authentication (signup/login) happens on the **client side** using the Supabase JS client
- This avoids server-side network blocking issues
- Works identically for both regular users and admins

### 2. **Admin Flag Management** (Server)
- After Supabase creates the user, the backend creates a user profile with the `is_admin` flag
- Only emails ending with `@mejorra.com` can register as admins
- The server validates this domain restriction

### 3. **Role-Based Access Control**
- Admin status is stored in the `users` table (`is_admin` column)
- RLS policies in Supabase control data access based on this flag
- Admin routes on the backend check the `is_admin` flag before granting access

## Files Modified

### Backend
1. **`server/routes/auth.js`**
   - Changed to accept `userId` after client-side Supabase auth
   - Creates user profile with `is_admin` flag
   - Validates `@mejorra.com` domain for admin accounts

2. **`server/middleware/auth.js`**
   - Uses Supabase JS client to verify tokens
   - No direct HTTP calls (avoids network blocking)

3. **`server/index.js`**
   - Removed SSL bypass code (no longer needed)

### Frontend
1. **`client/src/services/supabase.js`** (NEW)
   - Supabase client configuration for the frontend
   - Handles all authentication operations

2. **`client/src/context/AuthContext.js`**
   - Updated to use Supabase directly for signup/login
   - Calls backend to create user profile with admin flag
   - Stores session token and user data in localStorage

3. **`client/src/components/Login.js`**
   - Already has "Register as Admin" checkbox
   - Shows domain requirement (`@mejorra.com`) when checked

## How to Use

### For Regular Users
1. Go to the login page
2. Click "Sign Up"
3. Enter email, password, and full name
4. Click "Create Account"

### For Admin Users
1. Go to the login page
2. Click "Sign Up"
3. Enter email (must be `@mejorra.com`), password, and full name
4. **Check the "Register as Admin" checkbox**
5. Click "Create Account"

## Testing

### Test Admin Signup
```bash
# Start the frontend
cd client
npm start

# Visit http://localhost:3000/login
# Click "Sign Up"
# Enter:
#   - Email: youremail@mejorra.com
#   - Password: YourPassword123!
#   - Full Name: Your Name
#   - Check "Register as Admin"
# Click "Create Account"
```

### Verify Admin Status
After logging in, check:
- The user object in localStorage should have `is_admin: true`
- The Dashboard should show an "Admin" navigation button
- Clicking it should take you to `/admin` with analytics

## Database Schema

### `users` Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  username TEXT UNIQUE,
  is_admin BOOLEAN DEFAULT FALSE,  -- Admin flag
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS Policies
- Regular users can only see their own data
- Admins can see all data (configured in `admin_migration.sql`)

## Admin Features

### Admin Dashboard (`/admin`)
- **Overview**: Total stats (contacts, calls, users)
- **Monthly Contacts**: Contacts added per month
- **Daily Calls**: Calls made per day by the team
- **Team Performance**: Individual user call statistics
- **Yearly Report**: Year-over-year comparison

### Admin Routes (`server/routes/admin.js`)
- `GET /api/admin/stats` - Overview statistics
- `GET /api/admin/monthly-contacts` - Monthly contact report
- `GET /api/admin/daily-calls` - Daily call report
- `GET /api/admin/team-performance` - Team performance metrics
- `GET /api/admin/yearly-report?year=2025` - Yearly report

All routes are protected by the `isAdmin` middleware.

## Security Notes

1. **Domain Restriction**: Only `@mejorra.com` emails can become admins
2. **Server Validation**: The backend validates admin eligibility before creating profiles
3. **RLS Protection**: Database-level security ensures data isolation
4. **Token-Based Auth**: All API requests require valid Supabase tokens
5. **No Hardcoded Credentials**: Admin accounts are created through the UI, not in code

## Troubleshooting

### "Admin registration is only available for @mejorra.com email addresses"
- You're trying to register as admin with a non-@mejorra.com email
- Either use a @mejorra.com email or uncheck "Register as Admin"

### "User profile not found" on login
- The user exists in Supabase Auth but not in the `users` table
- This shouldn't happen with the new flow, but if it does, run the backfill script:
  ```sql
  -- In Supabase SQL Editor
  -- Run: server/database/backfill_users.sql
  ```

### Admin dashboard shows "Access Denied"
- Your account doesn't have `is_admin: true`
- Check the `users` table in Supabase to verify
- You may need to manually update: `UPDATE users SET is_admin = true WHERE email = 'your@mejorra.com';`

## Next Steps

1. **Test the flow**: Try creating an admin account through the UI
2. **Verify access**: Log in and check if you can access `/admin`
3. **Check data**: Ensure the admin dashboard loads correctly
4. **Production**: When deploying, ensure environment variables are set correctly

## Environment Variables

### Backend (`.env` in `/server`)
```env
SUPABASE_URL=https://elyzdlrkpgxrmhigdzzb.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=5001
```

### Frontend (`.env` in `/client`)
```env
REACT_APP_SUPABASE_URL=https://elyzdlrkpgxrmhigdzzb.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
REACT_APP_API_URL=http://localhost:5001/api
```

## Summary

✅ **Single Auth System**: Uses Supabase Auth for both regular users and admins
✅ **Client-Side Auth**: All authentication happens in the browser (no server blocking)
✅ **Role-Based Access**: Admins identified by `is_admin` flag in database
✅ **Domain Restriction**: Only `@mejorra.com` emails can become admins
✅ **RLS Protection**: Database-level security for data access
✅ **Admin Dashboard**: Full analytics and team management features
✅ **No Breaking Changes**: Regular user authentication remains untouched


# Supabase Setup Guide

This application now uses Supabase as the database instead of SQLite.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Your Supabase project URL and API key

## Setup Steps

### 1. Run the Migration SQL

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `server/database/migrations.sql`
4. Click **Run** to execute the migration

This will create the following tables:
- `users` - User accounts
- `contacts` - Contact information
- `call_records` - Call tracking records

### 2. Configure Environment Variables

Create a `.env` file in the `server` directory (if it doesn't exist):

```env
SUPABASE_URL=https://elyzdlrkpgxrmhigdzzb.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
JWT_SECRET=your-secret-key-change-in-production
PORT=5001
```

**Note:** The Supabase URL and key are already configured in `server/database/supabase.js` as defaults, but it's recommended to use environment variables for production.

### 3. Get Your Supabase API Key

1. Go to your Supabase Dashboard
2. Navigate to **Settings** > **API**
3. Copy the **anon/public** key
4. Add it to your `.env` file as `SUPABASE_ANON_KEY`

### 4. Start the Server

The server will automatically:
- Connect to Supabase
- Create the default admin user (username: `admin`, password: `admin123`)

```bash
cd server
npm run dev
```

## Default Credentials

After running the migration, create an account through the registration page or use:
- **Email:** admin@callhub.com
- **Password:** admin123

**Note:** You'll need to create the admin account manually through the registration endpoint or Supabase dashboard, as Supabase Auth requires email verification for new accounts.

## Database Schema

### Users Table (linked to Supabase Auth)
- `id` - Primary key (UUID, references auth.users)
- `email` - User email (from auth.users)
- `username` - Display username
- `created_at` - Timestamp

**Note:** User authentication is handled by Supabase Auth. The `users` table stores additional profile information linked to `auth.users`.

### Contacts Table
- `id` - Primary key (SERIAL)
- `name` - Contact name
- `number` - Phone number
- `address` - Address (optional)
- `uploaded_by` - Foreign key to users.id (UUID)
- `uploaded_at` - Timestamp

### Call Records Table
- `id` - Primary key (SERIAL)
- `contact_id` - Foreign key to contacts.id
- `user_id` - Foreign key to users.id (UUID)
- `status` - Call status (pending, in-progress, completed, etc.)
- `comments` - Notes/comments
- `requested_at` - Timestamp
- `updated_at` - Timestamp

## Troubleshooting

### Connection Errors

If you see connection errors:
1. Verify your Supabase URL and API key are correct
2. Make sure you've run the migration SQL in Supabase dashboard
3. Check that your Supabase project is active

### Table Not Found Errors

If you get "relation does not exist" errors:
- Make sure you've run the migration SQL script
- Check the table names match exactly (case-sensitive)

### Default User Not Created

The default admin user needs to be created manually:
1. Use the registration endpoint: `POST /api/auth/register` with email and password
2. Or create through Supabase Dashboard → Authentication → Users
3. The user profile will be automatically created via database trigger

**Note:** Supabase Auth handles password hashing automatically - no manual password hashing needed.

## Benefits of Supabase Auth

- ✅ **Built-in Authentication** - No need to manage passwords/hashing
- ✅ **Email Verification** - Automatic email verification support
- ✅ **Secure Token Management** - JWT tokens handled by Supabase
- ✅ **Row Level Security** - Automatic RLS policies for data protection
- ✅ **Cloud-hosted** - No local database files
- ✅ **Automatic Backups** - Built-in backup system
- ✅ **Production Ready** - Scalable and secure
- ✅ **Real-time Capabilities** - Can be added later

## Authentication Flow

1. **Registration**: User signs up with email/password (optional username)
2. **Login**: User signs in with email/password
3. **Token**: Supabase Auth returns access token (JWT)
4. **Authorization**: Token is verified on each API request
5. **User Profile**: Automatically created in `users` table via database trigger


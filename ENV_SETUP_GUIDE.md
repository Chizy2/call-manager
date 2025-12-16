# Environment Variables Setup Guide

## Server Environment Variables

Create `/server/.env` file with:

```env
# Production Environment Variables
NODE_ENV=production
PORT=5001

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# CORS Configuration (your frontend domain)
FRONTEND_URL=https://yourdomain.com

# Security
SESSION_SECRET=your_very_long_random_secret_key_here
```

## Client Environment Variables

Create `/client/.env.production` file with:

```env
# Production Environment Variables
REACT_APP_API_URL=https://yourdomain.com/api
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## How to Get Values:

### Supabase Credentials:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy:
   - `Project URL` → SUPABASE_URL
   - `anon public` key → SUPABASE_ANON_KEY
   - `service_role` key → SUPABASE_SERVICE_ROLE_KEY (⚠️ Keep secret!)

### Generate SESSION_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Domain Configuration:
- Replace `yourdomain.com` with your actual domain
- For API URL, use your domain + `/api` path
- For FRONTEND_URL, use your full domain with https://


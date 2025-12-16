const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://elyzdlrkpgxrmhigdzzb.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVseXpkbHJrcGd4cm1oaWdkenpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3OTU3MTEsImV4cCI6MjA4MTM3MTcxMX0.yuXmzASOc0S8C5eMq1vsDjqQg9l-3EvWYjWcg--FZek';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

// Default client (for auth operations)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service role client (bypasses RLS - use for backend operations)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create a client with user's access token (for RLS-aware operations)
const getSupabaseClient = (accessToken) => {
  if (!accessToken) {
    return supabaseAdmin; // Fallback to admin if no token
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

module.exports = supabase;
module.exports.getSupabaseClient = getSupabaseClient;
module.exports.supabaseAdmin = supabaseAdmin;


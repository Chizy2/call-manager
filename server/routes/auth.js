const express = require('express');
const supabaseModule = require('../database/supabase');
const supabase = supabaseModule;
const supabaseAdmin = supabaseModule.supabaseAdmin;

const router = express.Router();

// Admin email domain - only emails from this domain can register as admin
const ADMIN_EMAIL_DOMAIN = '@mejorra.com';

// This endpoint is called AFTER client-side Supabase signup
// It just creates the user profile with the admin flag
router.post('/register', async (req, res) => {
  const { userId, email, full_name, isAdmin } = req.body;

  if (!userId || !email || !full_name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Check if user wants admin privileges
  let shouldBeAdmin = false;
  if (isAdmin) {
    if (!email.toLowerCase().endsWith(ADMIN_EMAIL_DOMAIN)) {
      return res.status(403).json({ 
        error: `Admin accounts are only available for ${ADMIN_EMAIL_DOMAIN} email addresses` 
      });
    }
    shouldBeAdmin = true;
  }

  try {
    const username = email.split('@')[0];

    // Create user profile in users table
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .upsert([{
        id: userId,
        email: email,
        full_name: full_name,
        username: username,
        is_admin: shouldBeAdmin
      }], {
        onConflict: 'id'
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return res.status(500).json({ error: 'Error creating user profile' });
    }

    res.status(201).json({
      user: {
        id: userId,
        email: email,
        full_name: full_name,
        username: username,
        is_admin: shouldBeAdmin
      },
      message: shouldBeAdmin ? 'Admin account created successfully' : 'Account created successfully'
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Error creating user profile' });
  }
});

// This endpoint is called AFTER client-side Supabase login
// It retrieves the user profile with admin status
router.post('/login', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    // Get user profile
    const { data: profile, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    res.json({
      user: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name || '',
        username: profile.username || profile.email?.split('@')[0] || 'user',
        is_admin: profile.is_admin || false
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Error retrieving user profile' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Get user from token using Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('full_name, username, is_admin')
      .eq('id', user.id)
      .single();

    res.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: profile?.full_name || '',
        username: profile?.username || user.email?.split('@')[0] || 'user',
        is_admin: profile?.is_admin || false
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

module.exports = router;

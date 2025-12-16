const express = require('express');
const router = express.Router();
const supabaseModule = require('../database/supabase');
const supabaseAdmin = supabaseModule.supabaseAdmin;
const { authenticateToken } = require('../middleware/auth');

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', req.user.id)
      .single();

    if (error || !user || !user.is_admin) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    next();
  } catch (err) {
    console.error('Admin check error:', err);
    res.status(500).json({ error: 'Failed to verify admin status' });
  }
};

// Get overall dashboard stats
router.get('/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    // Total contacts
    const { count: totalContacts } = await supabaseAdmin
      .from('contacts')
      .select('*', { count: 'exact', head: true });

    // Contacts added this month
    const { count: contactsThisMonth } = await supabaseAdmin
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .gte('uploaded_at', startOfMonth);

    // Total calls
    const { count: totalCalls } = await supabaseAdmin
      .from('call_records')
      .select('*', { count: 'exact', head: true });

    // Calls today
    const { count: callsToday } = await supabaseAdmin
      .from('call_records')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', startOfToday)
      .neq('status', 'pending');

    // Calls this month
    const { count: callsThisMonth } = await supabaseAdmin
      .from('call_records')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', startOfMonth)
      .neq('status', 'pending');

    // Calls this year
    const { count: callsThisYear } = await supabaseAdmin
      .from('call_records')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', startOfYear)
      .neq('status', 'pending');

    // Total team members
    const { count: totalTeamMembers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Active team members (made calls today)
    const { data: activeToday } = await supabaseAdmin
      .from('call_records')
      .select('user_id')
      .gte('updated_at', startOfToday)
      .neq('status', 'pending');

    const uniqueActiveToday = new Set(activeToday?.map(r => r.user_id) || []).size;

    res.json({
      totalContacts: totalContacts || 0,
      contactsThisMonth: contactsThisMonth || 0,
      totalCalls: totalCalls || 0,
      callsToday: callsToday || 0,
      callsThisMonth: callsThisMonth || 0,
      callsThisYear: callsThisYear || 0,
      totalTeamMembers: totalTeamMembers || 0,
      activeTeamToday: uniqueActiveToday || 0
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get contacts added per month (last 12 months)
router.get('/contacts-monthly', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('contacts')
      .select('uploaded_at')
      .order('uploaded_at', { ascending: true });

    if (error) throw error;

    // Group by month
    const monthlyData = {};
    const now = new Date();
    
    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = { month: key, count: 0, label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) };
    }

    // Count contacts per month
    data?.forEach(contact => {
      const date = new Date(contact.uploaded_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[key]) {
        monthlyData[key].count++;
      }
    });

    res.json(Object.values(monthlyData));
  } catch (err) {
    console.error('Monthly contacts error:', err);
    res.status(500).json({ error: 'Failed to fetch monthly contacts data' });
  }
});

// Get all contacts with uploader info
router.get('/contacts-all', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('contacts')
      .select(`
        *,
        users!inner(full_name, email)
      `)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    console.error('All contacts error:', err);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Get contacts added this month
router.get('/contacts-this-month', authenticateToken, isAdmin, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data, error } = await supabaseAdmin
      .from('contacts')
      .select(`
        *,
        users!inner(full_name, email)
      `)
      .gte('uploaded_at', startOfMonth)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    console.error('This month contacts error:', err);
    res.status(500).json({ error: 'Failed to fetch contacts for this month' });
  }
});

// Get calls made today
router.get('/calls-today', authenticateToken, isAdmin, async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const { data, error } = await supabaseAdmin
      .from('call_records')
      .select(`
        *,
        users!inner(full_name, email),
        contacts!inner(name, number, address)
      `)
      .gte('updated_at', startOfToday)
      .neq('status', 'pending')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    console.error('Today calls error:', err);
    res.status(500).json({ error: 'Failed to fetch calls for today' });
  }
});

// Get daily calls by team members (last 30 days)
router.get('/calls-daily', authenticateToken, isAdmin, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabaseAdmin
      .from('call_records')
      .select(`
        updated_at,
        status,
        user_id,
        users!inner(full_name, email)
      `)
      .gte('updated_at', thirtyDaysAgo.toISOString())
      .neq('status', 'pending')
      .order('updated_at', { ascending: true });

    if (error) throw error;

    // Group by date
    const dailyData = {};
    const now = new Date();
    
    // Initialize last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      dailyData[key] = { 
        date: key, 
        count: 0, 
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
      };
    }

    // Count calls per day
    data?.forEach(record => {
      const key = record.updated_at.split('T')[0];
      if (dailyData[key]) {
        dailyData[key].count++;
      }
    });

    res.json(Object.values(dailyData));
  } catch (err) {
    console.error('Daily calls error:', err);
    res.status(500).json({ error: 'Failed to fetch daily calls data' });
  }
});

// Get team member performance
router.get('/team-performance', authenticateToken, isAdmin, async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Get all users
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email, is_admin, created_at')
      .order('full_name', { ascending: true });

    if (usersError) throw usersError;

    // Get call stats for each user
    const teamPerformance = await Promise.all(users.map(async (user) => {
      // Calls today
      const { count: callsToday } = await supabaseAdmin
        .from('call_records')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('updated_at', startOfToday)
        .neq('status', 'pending');

      // Calls this week
      const { count: callsThisWeek } = await supabaseAdmin
        .from('call_records')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('updated_at', startOfWeek)
        .neq('status', 'pending');

      // Calls this month
      const { count: callsThisMonth } = await supabaseAdmin
        .from('call_records')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('updated_at', startOfMonth)
        .neq('status', 'pending');

      // Total calls
      const { count: totalCalls } = await supabaseAdmin
        .from('call_records')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .neq('status', 'pending');

      // Confirmed calls
      const { count: confirmedCalls } = await supabaseAdmin
        .from('call_records')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'confirmed');

      // Last activity
      const { data: lastActivity } = await supabaseAdmin
        .from('call_records')
        .select('updated_at')
        .eq('user_id', user.id)
        .neq('status', 'pending')
        .order('updated_at', { ascending: false })
        .limit(1);

      return {
        id: user.id,
        name: user.full_name || user.email.split('@')[0],
        email: user.email,
        isAdmin: user.is_admin,
        joinedAt: user.created_at,
        callsToday: callsToday || 0,
        callsThisWeek: callsThisWeek || 0,
        callsThisMonth: callsThisMonth || 0,
        totalCalls: totalCalls || 0,
        confirmedCalls: confirmedCalls || 0,
        conversionRate: totalCalls > 0 ? ((confirmedCalls / totalCalls) * 100).toFixed(1) : '0.0',
        lastActivity: lastActivity?.[0]?.updated_at || null
      };
    }));

    res.json(teamPerformance);
  } catch (err) {
    console.error('Team performance error:', err);
    res.status(500).json({ error: 'Failed to fetch team performance' });
  }
});

// Get yearly report data
router.get('/yearly-report', authenticateToken, isAdmin, async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const startOfYear = new Date(year, 0, 1).toISOString();
    const endOfYear = new Date(year, 11, 31, 23, 59, 59).toISOString();

    // Get all calls for the year
    const { data: calls, error } = await supabaseAdmin
      .from('call_records')
      .select('status, updated_at')
      .gte('updated_at', startOfYear)
      .lte('updated_at', endOfYear)
      .neq('status', 'pending');

    if (error) throw error;

    // Monthly breakdown
    const monthlyBreakdown = {};
    for (let i = 0; i < 12; i++) {
      const monthName = new Date(year, i, 1).toLocaleDateString('en-US', { month: 'short' });
      monthlyBreakdown[i] = {
        month: monthName,
        total: 0,
        confirmed: 0,
        rejected: 0,
        unreachable: 0,
        callback: 0,
        undecided: 0
      };
    }

    // Status totals
    const statusTotals = {
      confirmed: 0,
      rejected: 0,
      unreachable: 0,
      callback: 0,
      undecided: 0,
      other: 0
    };

    calls?.forEach(call => {
      const month = new Date(call.updated_at).getMonth();
      monthlyBreakdown[month].total++;
      
      if (['confirmed', 'rejected', 'unreachable', 'callback', 'undecided'].includes(call.status)) {
        monthlyBreakdown[month][call.status]++;
        statusTotals[call.status]++;
      } else {
        statusTotals.other++;
      }
    });

    // Get contacts added this year
    const { count: contactsAdded } = await supabaseAdmin
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .gte('uploaded_at', startOfYear)
      .lte('uploaded_at', endOfYear);

    res.json({
      year,
      totalCalls: calls?.length || 0,
      contactsAdded: contactsAdded || 0,
      statusTotals,
      monthlyBreakdown: Object.values(monthlyBreakdown),
      conversionRate: calls?.length > 0 
        ? ((statusTotals.confirmed / calls.length) * 100).toFixed(1) 
        : '0.0'
    });
  } catch (err) {
    console.error('Yearly report error:', err);
    res.status(500).json({ error: 'Failed to fetch yearly report' });
  }
});

// Check if current user is admin
router.get('/check', authenticateToken, async (req, res) => {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    res.json({ isAdmin: user?.is_admin || false });
  } catch (err) {
    console.error('Admin check error:', err);
    res.status(500).json({ error: 'Failed to check admin status' });
  }
});

module.exports = router;


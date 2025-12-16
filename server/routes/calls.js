const express = require('express');
const { getSupabaseClient, supabaseAdmin } = require('../database/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Request a number from the pool
router.post('/request', authenticateToken, async (req, res) => {
  const { contactId } = req.body;

  if (!contactId) {
    return res.status(400).json({ error: 'Contact ID is required' });
  }

  try {
    // Check if contact exists
    const { data: contact, error: contactError } = await supabaseAdmin
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (contactError || !contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Check if contact is already assigned
    const { data: existingRecord, error: checkError } = await supabaseAdmin
      .from('call_records')
      .select('*')
      .eq('contact_id', contactId)
      .neq('status', 'completed')
      .neq('status', 'cancelled')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingRecord) {
      return res.status(400).json({ error: 'Contact is already assigned' });
    }

    // Create call record
    const { data: newRecord, error: createError } = await supabaseAdmin
      .from('call_records')
      .insert([
        {
          contact_id: contactId,
          user_id: req.user.id,
          status: 'pending'
        }
      ])
      .select(`
        *,
        contacts (
          name,
          number,
          address
        )
      `)
      .single();

    if (createError) {
      throw createError;
    }

    // Format response
    const response = {
      ...newRecord,
      name: newRecord.contacts.name,
      number: newRecord.contacts.number,
      address: newRecord.contacts.address,
      contacts: undefined
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Request call error:', error);
    return res.status(500).json({ error: 'Error creating call record' });
  }
});

// Get user's assigned calls
router.get('/my-calls', authenticateToken, async (req, res) => {
  try {
    const { data: calls, error } = await supabaseAdmin
      .from('call_records')
      .select(`
        *,
        contacts (
          name,
          number,
          address
        )
      `)
      .eq('user_id', req.user.id)
      .neq('status', 'completed')
      .neq('status', 'cancelled')
      .order('requested_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Format response
    const formattedCalls = calls.map(call => ({
      ...call,
      name: call.contacts.name,
      number: call.contacts.number,
      address: call.contacts.address,
      contacts: undefined
    }));

    res.json(formattedCalls);
  } catch (error) {
    console.error('Get my calls error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

// Get all call records (for admin view)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data: calls, error } = await supabaseAdmin
      .from('call_records')
      .select(`
        *,
        contacts (
          name,
          number,
          address
        ),
        users (
          username
        )
      `)
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Format response
    const formattedCalls = calls.map(call => ({
      ...call,
      name: call.contacts.name,
      number: call.contacts.number,
      address: call.contacts.address,
      username: call.users.username,
      contacts: undefined,
      users: undefined
    }));

    res.json(formattedCalls);
  } catch (error) {
    console.error('Get all calls error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

// Get follow-up calls by status
router.get('/follow-ups/by-status', authenticateToken, async (req, res) => {
  const { statuses } = req.query;
  
  if (!statuses) {
    return res.status(400).json({ error: 'Statuses parameter is required' });
  }
  
  const statusArray = statuses.split(',');
  
  try {
    const { data: calls, error } = await supabaseAdmin
      .from('call_records')
      .select(`
        *,
        contacts (
          name,
          number,
          address
        ),
        users (
          username
        )
      `)
      .in('status', statusArray)
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Format response
    const formattedCalls = calls.map(call => ({
      ...call,
      name: call.contacts.name,
      number: call.contacts.number,
      address: call.contacts.address,
      username: call.users.username,
      contacts: undefined,
      users: undefined
    }));

    res.json(formattedCalls);
  } catch (error) {
    console.error('Get follow-ups error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

// Update call status and comments, and contact name/address
router.put('/:id', authenticateToken, async (req, res) => {
  const { status, comments, userId, name, address } = req.body;
  const callId = req.params.id;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const validStatuses = ['pending', 'in-progress', 'completed', 'cancelled', 'no-answer', 'callback', 'rejected', 'undecided', 'confirmed', 'unreachable'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    // Check if call record exists and get contact_id
    const { data: record, error: recordError } = await supabaseAdmin
      .from('call_records')
      .select('*, contact_id')
      .eq('id', callId)
      .single();

    if (recordError || !record) {
      return res.status(404).json({ error: 'Call record not found' });
    }

    // Update contact name and address if provided
    if (name !== undefined || address !== undefined) {
      const contactUpdateData = {};
      if (name !== undefined) contactUpdateData.name = name;
      if (address !== undefined) contactUpdateData.address = address || null;

      const { error: contactUpdateError } = await supabaseAdmin
        .from('contacts')
        .update(contactUpdateData)
        .eq('id', record.contact_id);

      if (contactUpdateError) {
        console.error('Error updating contact:', contactUpdateError);
        return res.status(500).json({ error: 'Error updating contact details' });
      }
    }

    // Allow reassignment if userId is provided (for follow-ups)
    const targetUserId = userId || req.user.id;

    // Update the call record
    const updateData = {
      status,
      comments: comments || null,
      user_id: targetUserId,
      updated_at: new Date().toISOString()
    };

    const { data: updatedRecord, error: updateError } = await supabaseAdmin
      .from('call_records')
      .update(updateData)
      .eq('id', callId)
      .select(`
        *,
        contacts (
          name,
          number,
          address
        )
      `)
      .single();

    if (updateError) {
      throw updateError;
    }

    // Format response
    const response = {
      ...updatedRecord,
      name: updatedRecord.contacts.name,
      number: updatedRecord.contacts.number,
      address: updatedRecord.contacts.address,
      contacts: undefined
    };

    res.json(response);
  } catch (error) {
    console.error('Update call error:', error);
    return res.status(500).json({ error: 'Error updating call record' });
  }
});

// Get call record by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { data: record, error } = await supabaseAdmin
      .from('call_records')
      .select(`
        *,
        contacts (
          name,
          number,
          address
        ),
        users (
          username
        )
      `)
      .eq('id', req.params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Call record not found' });
      }
      throw error;
    }

    // Format response
    const response = {
      ...record,
      name: record.contacts.name,
      number: record.contacts.number,
      address: record.contacts.address,
      username: record.users.username,
      contacts: undefined,
      users: undefined
    };

    res.json(response);
  } catch (error) {
    console.error('Get call record error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;




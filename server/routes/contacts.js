const express = require('express');
const { getSupabaseClient, supabaseAdmin } = require('../database/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all contacts (available for assignment)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const supabase = getSupabaseClient(req.accessToken);
    // Get contacts with their call records
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select(`
        *,
        call_records!left (
          id,
          status,
          user_id
        )
      `)
      .order('uploaded_at', { ascending: false });

    if (contactsError) {
      throw contactsError;
    }

    // Filter contacts that are available or assigned to current user
    const filteredContacts = contacts
      .map(contact => {
        const activeCallRecord = contact.call_records?.find(
          cr => cr.status !== 'completed' && cr.status !== 'cancelled'
        );
        
        return {
          ...contact,
          call_record_id: activeCallRecord?.id || null,
          call_status: activeCallRecord?.status || null,
          assigned_to: activeCallRecord?.user_id || null,
          call_records: undefined // Remove nested array
        };
      })
      .filter(contact => 
        !contact.call_record_id || contact.assigned_to === req.user.id
      );

    res.json(filteredContacts);
  } catch (error) {
    console.error('Get contacts error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

// Get available contacts (not assigned to anyone)
router.get('/available', authenticateToken, async (req, res) => {
  try {
    const supabase = getSupabaseClient(req.accessToken);
    // Get all contacts
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select(`
        *,
        call_records!left (
          id,
          status
        )
      `)
      .order('uploaded_at', { ascending: false });

    if (contactsError) {
      throw contactsError;
    }

    // Filter contacts that don't have active call records
    const availableContacts = contacts
      .filter(contact => {
        const hasActiveCall = contact.call_records?.some(
          cr => cr.status !== 'completed' && cr.status !== 'cancelled'
        );
        return !hasActiveCall;
      })
      .map(contact => {
        const { call_records, ...contactData } = contact;
        return contactData;
      });

    res.json(availableContacts);
  } catch (error) {
    console.error('Get available contacts error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

// Upload single contact
router.post('/', authenticateToken, async (req, res) => {
  const { name, number, address } = req.body;

  if (!name || !number) {
    return res.status(400).json({ error: 'Name and number are required' });
  }

  try {
    // Ensure user profile exists (in case trigger didn't fire)
    const { data: existingUser, error: userCheckError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', req.user.id)
      .single();

    if (!existingUser && userCheckError?.code === 'PGRST116') {
      // User profile doesn't exist, create it
      // Get user info from auth
      const { data: authUserData, error: authError } = await supabaseAdmin.auth.admin.getUserById(req.user.id);
      
      if (authUserData?.user && !authError) {
        const username = authUserData.user.email?.split('@')[0] || 'user';
        const fullName = authUserData.user.user_metadata?.full_name || authUserData.user.user_metadata?.full_name || '';
        
        const { error: insertError } = await supabaseAdmin
          .from('users')
          .insert([
            {
              id: req.user.id,
              email: authUserData.user.email,
              full_name: fullName,
              username: username
            }
          ]);
        
        if (insertError && insertError.code !== '23505') {
          console.error('Error creating user profile:', insertError);
        }
      } else {
        // Fallback: create with minimal info
        const { error: insertError } = await supabaseAdmin
          .from('users')
          .insert([
            {
              id: req.user.id,
              email: req.user.email || 'unknown@example.com',
              full_name: '',
              username: req.user.email?.split('@')[0] || 'user'
            }
          ]);
        
        if (insertError && insertError.code !== '23505') {
          console.error('Error creating user profile (fallback):', insertError);
        }
      }
    }

    // Use admin client to bypass RLS for backend operations
    const { data: newContact, error } = await supabaseAdmin
      .from('contacts')
      .insert([
        {
          name,
          number,
          address: address || null,
          uploaded_by: req.user.id
        }
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      ...newContact,
      message: 'Contact uploaded successfully'
    });
  } catch (error) {
    console.error('Create contact error:', error);
    return res.status(500).json({ error: 'Error creating contact' });
  }
});

// Upload multiple contacts (bulk upload)
router.post('/bulk', authenticateToken, async (req, res) => {
  const { contacts } = req.body;

  if (!Array.isArray(contacts) || contacts.length === 0) {
    return res.status(400).json({ error: 'Contacts array is required' });
  }

  try {
    // Ensure user profile exists (in case trigger didn't fire)
    const { data: existingUser, error: userCheckError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', req.user.id)
      .single();

    if (!existingUser && userCheckError?.code === 'PGRST116') {
      // User profile doesn't exist, create it
      const { data: authUserData, error: authError } = await supabaseAdmin.auth.admin.getUserById(req.user.id);
      
      if (authUserData?.user && !authError) {
        const username = authUserData.user.email?.split('@')[0] || 'user';
        const fullName = authUserData.user.user_metadata?.full_name || '';
        
        await supabaseAdmin
          .from('users')
          .insert([
            {
              id: req.user.id,
              email: authUserData.user.email,
              full_name: fullName,
              username: username
            }
          ]);
      } else {
        // Fallback: create with minimal info
        await supabaseAdmin
          .from('users')
          .insert([
            {
              id: req.user.id,
              email: req.user.email || 'unknown@example.com',
              full_name: '',
              username: req.user.email?.split('@')[0] || 'user'
            }
          ]);
      }
    }

    // Filter and prepare contacts for insertion
    const contactsToInsert = contacts
      .filter(contact => contact.name && contact.number)
      .map(contact => ({
        name: contact.name.trim(),
        number: contact.number.trim(),
        address: contact.address ? contact.address.trim() : null,
        uploaded_by: req.user.id
      }));

    const invalidContacts = contacts.filter(
      contact => !contact.name || !contact.number
    );

    if (contactsToInsert.length === 0) {
      return res.status(400).json({ 
        error: 'No valid contacts to upload. Each contact must have a name and number.' 
      });
    }

    // Use admin client to bypass RLS for backend operations
    // Insert contacts in batches to handle large uploads
    const batchSize = 100; // Supabase can handle up to 1000, but 100 is safer
    const batches = [];
    
    for (let i = 0; i < contactsToInsert.length; i += batchSize) {
      batches.push(contactsToInsert.slice(i, i + batchSize));
    }

    let totalInserted = 0;
    const insertErrors = [];

    // Insert contacts in batches
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const { data: insertedContacts, error } = await supabaseAdmin
        .from('contacts')
        .insert(batch)
        .select();

      if (error) {
        console.error(`Error inserting batch ${i + 1}:`, error);
        insertErrors.push({
          batch: i + 1,
          error: error.message,
          contacts: batch.length
        });
      } else {
        totalInserted += insertedContacts?.length || 0;
      }
    }

    const successCount = totalInserted;
    const errorCount = invalidContacts.length + (contactsToInsert.length - totalInserted);
    
    const errors = [
      ...invalidContacts.map((contact, index) => ({
        index: contacts.indexOf(contact),
        error: 'Name and number are required'
      })),
      ...insertErrors.map(err => ({
        batch: err.batch,
        error: err.error,
        contactsAffected: err.contacts
      }))
    ];

    res.status(201).json({
      successCount,
      errorCount,
      totalProcessed: contacts.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully uploaded ${successCount} out of ${contacts.length} contact(s)`
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    return res.status(500).json({ 
      error: error.message || 'Error uploading contacts',
      details: error.details || null
    });
  }
});

// Get contact by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const supabase = getSupabaseClient(req.accessToken);
    const { data: contact, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Contact not found' });
      }
      throw error;
    }

    res.json(contact);
  } catch (error) {
    console.error('Get contact error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;




/**
 * Migration Script: SQLite to Supabase
 * 
 * This script helps migrate existing contacts from SQLite database to Supabase.
 * Run this once if you have existing data in SQLite that needs to be migrated.
 * 
 * Usage:
 *   node server/database/migrate_sqlite_to_supabase.js [userId]
 * 
 * Where userId is the UUID of the user who should own the migrated contacts.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { supabaseAdmin } = require('./supabase');

const DB_PATH = path.join(__dirname, 'callmanager.db');

async function migrateContacts(userId) {
  if (!userId) {
    console.error('Error: User ID is required');
    console.log('Usage: node migrate_sqlite_to_supabase.js <userId>');
    console.log('Get userId from Supabase Dashboard → Authentication → Users');
    process.exit(1);
  }

  // Verify user exists in Supabase
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, email')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    console.error('Error: User not found in Supabase');
    console.log('Make sure the user exists and has a profile in the users table');
    process.exit(1);
  }

  console.log(`Migrating contacts for user: ${user.email} (${userId})`);

  // Open SQLite database
  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Error opening SQLite database:', err);
      process.exit(1);
    }
  });

  // Read contacts from SQLite
  db.all('SELECT name, number, address, uploaded_at FROM contacts', async (err, rows) => {
    if (err) {
      console.error('Error reading contacts from SQLite:', err);
      db.close();
      process.exit(1);
    }

    if (rows.length === 0) {
      console.log('No contacts found in SQLite database');
      db.close();
      process.exit(0);
    }

    console.log(`Found ${rows.length} contacts in SQLite database`);

    // Prepare contacts for Supabase
    const contactsToInsert = rows.map(contact => ({
      name: contact.name,
      number: contact.number,
      address: contact.address || null,
      uploaded_by: userId,
      uploaded_at: contact.uploaded_at || new Date().toISOString()
    }));

    // Insert in batches
    const batchSize = 100;
    let totalInserted = 0;
    let totalErrors = 0;

    for (let i = 0; i < contactsToInsert.length; i += batchSize) {
      const batch = contactsToInsert.slice(i, i + batchSize);
      
      const { data: inserted, error } = await supabaseAdmin
        .from('contacts')
        .insert(batch)
        .select();

      if (error) {
        console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
        totalErrors += batch.length;
      } else {
        totalInserted += inserted?.length || 0;
        console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}: ${inserted?.length || 0} contacts`);
      }
    }

    console.log('\nMigration Summary:');
    console.log(`Total contacts: ${rows.length}`);
    console.log(`Successfully migrated: ${totalInserted}`);
    console.log(`Failed: ${totalErrors}`);

    db.close();
    process.exit(0);
  });
}

// Get userId from command line arguments
const userId = process.argv[2];
migrateContacts(userId);


const supabase = require('./supabase');

const createDefaultUser = async () => {
  const defaultEmail = 'admin@callhub.com';
  const defaultPassword = 'admin123';
  const defaultUsername = 'admin';

  try {
    // Check if admin user already exists in users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('username', defaultUsername)
      .single();

    if (existingUser) {
      console.log('✅ Default admin user already exists');
      return;
    }

    // Check if auth user exists
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const adminAuthUser = authUsers?.users?.find(u => u.email === defaultEmail);

    if (adminAuthUser) {
      // Auth user exists but profile doesn't - create profile
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: adminAuthUser.id,
            email: defaultEmail,
            username: defaultUsername
          }
        ]);

      if (profileError && profileError.code !== '23505') {
        console.error('Error creating admin profile:', profileError);
      } else {
        console.log('✅ Default admin profile created');
      }
      return;
    }

    // Create new auth user (requires service role key)
    // Note: This requires SUPABASE_SERVICE_ROLE_KEY in environment
    // For now, we'll just log instructions
    console.log('⚠️  Default admin user not found.');
    console.log('   Please create manually:');
    console.log(`   Email: ${defaultEmail}`);
    console.log(`   Password: ${defaultPassword}`);
    console.log(`   Username: ${defaultUsername}`);
    console.log('   Or sign up through the registration endpoint');
  } catch (error) {
    console.error('Error in createDefaultUser:', error);
    console.log('Note: Default user creation requires manual setup or service role key');
  }
};

// Run initialization
createDefaultUser();

module.exports = { createDefaultUser };


const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contacts');
const callRoutes = require('./routes/calls');
const adminRoutes = require('./routes/admin');
const supabase = require('./database/supabase');
const { createDefaultUser } = require('./database/initSupabase');

const app = express();
const PORT = process.env.PORT || 5001;
const isProduction = process.env.NODE_ENV === 'production';

// Security Middleware (Production)
if (isProduction) {
  app.use(helmet({
    contentSecurityPolicy: false, // Configure if needed
    crossOriginEmbedderPolicy: false
  }));
  app.use(compression()); // Gzip compression
}

// CORS Configuration
const corsOptions = {
  origin: isProduction 
    ? [process.env.FRONTEND_URL, 'https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Supabase connection and create default user
(async () => {
  try {
    // Test connection
    const { error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.error('❌ Supabase connection error:', error.message);
      console.log('⚠️  Make sure you have:');
      console.log('   1. Run the migration SQL in Supabase dashboard (see server/database/migrations.sql)');
      console.log('   2. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env file');
      return;
    }
    
    console.log('✅ Connected to Supabase database');
    
    // Create default admin user if it doesn't exist
    await createDefaultUser();
  } catch (error) {
    console.error('❌ Initialization error:', error.message);
  }
})();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    database: 'supabase',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Handle production static files (if serving from same server)
if (isProduction) {
  const clientBuildPath = path.join(__dirname, '../client/build');
  app.use(express.static(clientBuildPath));
  
  // Serve React app for any unknown routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});




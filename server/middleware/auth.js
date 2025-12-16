const supabaseModule = require('../database/supabase');
const supabase = supabaseModule;

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Verify token with Supabase Auth
    const { data, error } = await supabase.auth.getUser(token);
    const user = data?.user;

    if (error || !user) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = {
      id: user.id,
      email: user.email
    };
    req.accessToken = token;

    next();
  } catch (error) {
    const causeCode = error?.cause?.code || error?.code;
    const isNetworkish =
      causeCode === 'UND_ERR_SOCKET' ||
      causeCode === 'ECONNRESET' ||
      causeCode === 'ETIMEDOUT' ||
      causeCode === 'EAI_AGAIN' ||
      (typeof causeCode === 'string' && causeCode.startsWith('ERR_SSL_'));

    // Don't spam full stack traces for transient network issues.
    console.error(
      'Auth middleware error:',
      isNetworkish ? `${causeCode || 'NETWORK_ERROR'} (Supabase auth fetch failed)` : error
    );

    // If Supabase auth is temporarily unreachable, return a retryable status.
    if (isNetworkish) {
      return res.status(503).json({ error: 'Auth service unavailable. Please retry.' });
    }

    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { authenticateToken };

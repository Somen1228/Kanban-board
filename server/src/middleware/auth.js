import admin from '../config/firebase.js';
import User from '../models/User.js';

/**
 * Authentication middleware
 * Verifies Firebase ID token from Authorization header
 * Creates/updates user in the database on first login
 * Attaches user to req.user
 */
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Determine auth provider
    let authProvider = 'email';
    if (decodedToken.firebase?.sign_in_provider === 'google.com') {
      authProvider = 'google';
    } else if (decodedToken.firebase?.sign_in_provider === 'phone') {
      authProvider = 'phone';
    }

    // Upsert user in database
    const [user] = await User.findOrCreate({
      where: { firebase_uid: decodedToken.uid },
      defaults: {
        firebase_uid: decodedToken.uid,
        email: decodedToken.email || null,
        phone: decodedToken.phone_number || null,
        display_name: decodedToken.name || decodedToken.email || decodedToken.phone_number || 'User',
        photo_url: decodedToken.picture || null,
        auth_provider: authProvider,
      },
    });

    // Update user info if it has changed (e.g., profile picture update)
    await user.update({
      email: decodedToken.email || user.email,
      phone: decodedToken.phone_number || user.phone,
      display_name: decodedToken.name || user.display_name,
      photo_url: decodedToken.picture || user.photo_url,
    });

    req.user = user;
    req.firebaseUser = decodedToken;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export default authenticate;

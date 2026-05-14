import { Router } from 'express';
import authenticate from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/auth/login
 * Called after Firebase client-side auth succeeds
 * The authenticate middleware handles user creation/lookup
 */
router.post('/login', authenticate, (req, res) => {
  res.json({
    message: 'Login successful',
    user: {
      id: req.user.id,
      email: req.user.email,
      phone: req.user.phone,
      displayName: req.user.display_name,
      photoUrl: req.user.photo_url,
      authProvider: req.user.auth_provider,
    },
  });
});

/**
 * GET /api/auth/me
 * Returns the current authenticated user's profile
 */
router.get('/me', authenticate, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      phone: req.user.phone,
      displayName: req.user.display_name,
      photoUrl: req.user.photo_url,
      authProvider: req.user.auth_provider,
    },
  });
});

export default router;

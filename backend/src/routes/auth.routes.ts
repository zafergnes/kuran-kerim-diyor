import { Router } from 'express';
import { register, login, guestLogin, refresh, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();

const credentialLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false });
const guestLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false });

router.post('/register', credentialLimiter, register);
router.post('/login', credentialLimiter, login);
router.post('/guest', guestLimiter, guestLogin);
router.post('/refresh', credentialLimiter, refresh);
router.get('/me', authenticate, getMe);

export default router;

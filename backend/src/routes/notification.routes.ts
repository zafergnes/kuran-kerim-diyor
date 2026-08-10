import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import rateLimit from 'express-rate-limit';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/admin.middleware';

const router = Router();

const registrationLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false });
router.post('/register', registrationLimiter, optionalAuthenticate, NotificationController.register);
router.post('/register-web', registrationLimiter, optionalAuthenticate, NotificationController.registerWeb);
router.get('/test-push', authenticate, adminOnly, NotificationController.testPush);

export default router;

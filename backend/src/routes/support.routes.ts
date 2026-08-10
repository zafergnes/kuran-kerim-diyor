import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createSupportRequest, getSupportRequestStatus } from '../controllers/support.controller';

const router = Router();
router.post('/', rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false }), createSupportRequest);
router.get('/:id', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false }), getSupportRequestStatus);
export default router;

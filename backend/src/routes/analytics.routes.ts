import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { ingestEvents } from '../controllers/analytics.controller';
import { optionalAuthenticate } from '../middleware/auth';

const router = Router();
router.post('/', rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
}), optionalAuthenticate, ingestEvents);

export default router;

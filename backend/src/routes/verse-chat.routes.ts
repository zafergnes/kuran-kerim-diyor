import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { optionalAuthenticate, checkBanned } from '../middleware/auth';
import { discussVerse, reportVerseChat } from '../controllers/verse-chat.controller';

const router = Router();
const chatLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 12,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'AI_CHAT_RATE_LIMITED' },
});
const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

router.use(optionalAuthenticate, checkBanned);
router.post('/', chatLimiter, discussVerse);
router.post('/feedback', feedbackLimiter, reportVerseChat);

export default router;

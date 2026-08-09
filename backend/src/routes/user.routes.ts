import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getProfile, deleteAccount, getProgress, saveProgress } from '../controllers/user.controller';

const router = Router();

router.use(authenticate);

router.get('/profile', getProfile);
router.delete('/', deleteAccount);

router.get('/progress', getProgress);
router.post('/progress', saveProgress);

export default router;


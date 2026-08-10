import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getProfile, deleteAccount, getProgress, saveProgress, blockUser, unblockUser } from '../controllers/user.controller';

const router = Router();

router.use(authenticate);

router.get('/profile', getProfile);
router.delete('/', deleteAccount);
router.post('/blocks/:id', blockUser);
router.delete('/blocks/:id', unblockUser);

router.get('/progress', getProgress);
router.post('/progress', saveProgress);

export default router;

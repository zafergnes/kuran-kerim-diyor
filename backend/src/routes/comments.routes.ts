import { Router } from 'express';
import { authenticate, optionalAuthenticate, checkBanned } from '../middleware/auth';
import { getComments, addComment, deleteComment, getMyComments, toggleLike } from '../controllers/comments.controller';

const router = Router();

// Private routes (Giriş gerektirenler)
router.get('/my', authenticate, checkBanned, getMyComments);
router.post('/', authenticate, checkBanned, addComment);
router.post('/:commentId/like', authenticate, checkBanned, toggleLike);
router.delete('/:id', authenticate, checkBanned, deleteComment);

// Public routes (Herkese açık olanlar - En altta olmalı)
router.get('/:ayahId', optionalAuthenticate, getComments);

export default router;


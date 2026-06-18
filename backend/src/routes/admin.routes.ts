import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/admin.middleware';
import {
  getAdminStats,
  getReports,
  dismissReport,
  removeComment,
  banUser,
  getPendingDeletions,
  getUsers,
  getComments,
  approveComment
} from '../controllers/admin.controller';

const router = Router();

// Secure all admin routes with authentication and admin middleware
router.use(authenticate, adminOnly);

router.get('/stats', getAdminStats);
router.get('/reports', getReports);
router.get('/pending-deletions', getPendingDeletions);
router.get('/users', getUsers);
router.get('/comments', getComments);
router.post('/reports/:id/dismiss', dismissReport);
router.post('/comments/:id/remove', removeComment);
router.post('/comments/:id/approve', approveComment);
router.post('/users/:id/ban', banUser);

export default router;

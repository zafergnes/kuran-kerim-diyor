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
  approveComment,
  getProductAnalytics,
  getAiFeedback,
  getAdminAudit
} from '../controllers/admin.controller';
import { deleteAiSettings, getAiSettings, testAiSettings, updateAiSettings } from '../controllers/admin-settings.controller';
import { listSupportRequests, updateSupportRequest } from '../controllers/support.controller';

const router = Router();

// Secure all admin routes with authentication and admin middleware
router.use(authenticate, adminOnly);

router.get('/stats', getAdminStats);
router.get('/reports', getReports);
router.get('/pending-deletions', getPendingDeletions);
router.get('/users', getUsers);
router.get('/comments', getComments);
router.get('/analytics', getProductAnalytics);
router.get('/ai-feedback', getAiFeedback);
router.get('/audit', getAdminAudit);
router.get('/settings/ai', getAiSettings);
router.put('/settings/ai', updateAiSettings);
router.post('/settings/ai/test', testAiSettings);
router.delete('/settings/ai', deleteAiSettings);
router.get('/support-requests', listSupportRequests);
router.patch('/support-requests/:id', updateSupportRequest);
router.post('/reports/:id/dismiss', dismissReport);
router.post('/comments/:id/remove', removeComment);
router.post('/comments/:id/approve', approveComment);
router.post('/users/:id/ban', banUser);

export default router;

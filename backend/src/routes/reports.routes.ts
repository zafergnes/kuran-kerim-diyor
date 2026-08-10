import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/admin.middleware';
import { reportComment, markReportInvalid } from '../controllers/reports.controller';

const router = Router();

// Protect all report routes
router.use(authenticate); 

router.post('/', reportComment);

router.post('/mark-invalid/:id', adminOnly, markReportInvalid);

export default router;

import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';

const router = Router();

router.post('/register', NotificationController.register);
router.get('/test-push', NotificationController.testPush);

export default router;

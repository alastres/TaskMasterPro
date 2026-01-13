import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', notificationController.getMyNotifications);
router.patch('/:id/read', notificationController.markAsRead);
router.post('/respond-invite', notificationController.respondToInvitation);
router.delete('/:id', notificationController.deleteNotification);

export default router;

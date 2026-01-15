import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/admin.middleware';
import { getCronConfig, updateCronConfig, triggerCronJob, getAllUsers, updateUserRole, deleteUser } from '../controllers/admin.controller';

const router = Router();

// Apply authentication and admin check to all routes
router.use(protect);
router.use(requireAdmin);

router.get('/cron-config', getCronConfig);
router.put('/cron-config', updateCronConfig);
router.post('/cron-trigger', triggerCronJob);

// User Management
router.get('/users', getAllUsers);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

export default router;

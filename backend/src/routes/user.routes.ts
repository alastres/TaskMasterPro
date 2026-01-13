import express from 'express';
import { protect } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
    getMe,
    updateProfile,
    changePassword,
    updateProfileSchema,
    changePasswordSchema
} from '../controllers/user.controller';

const router = express.Router();

router.use(protect);

router.get('/me', getMe);
router.put('/profile', validate(updateProfileSchema), updateProfile);
router.put('/password', validate(changePasswordSchema), changePassword);

export default router;

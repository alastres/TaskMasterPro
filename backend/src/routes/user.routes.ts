import express from 'express';
import { protect } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
    getMe,
    updateProfile,
    changePassword,
    // updateProfileSchema, // Validation schema might need adjustment for FormData or manual validation inside controller
    changePasswordSchema
} from '../controllers/user.controller';
import { upload } from '../middlewares/upload.middleware';

const router = express.Router();

router.use(protect);

router.get('/me', getMe);
// Remove auto-validation middleware for profile update because FormData is tricky with Zod middleware 
// We will rely on manual validation or update the middleware to parse FormData first.
// For simplicity, we'll validate inside controller or rely on basic checks.
router.put('/profile', upload.single('avatar'), updateProfile);
router.put('/password', validate(changePasswordSchema), changePassword);

export default router;

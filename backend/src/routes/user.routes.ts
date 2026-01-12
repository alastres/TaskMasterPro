import express from 'express';
import { protect } from '../middlewares/auth.middleware';
import { getMe } from '../controllers/user.controller';

const router = express.Router();

router.use(protect);

router.get('/me', getMe);

export default router;

import express from 'express';
import { validate } from '../middlewares/validate.middleware';
import {
    register,
    login,
    registerSchema,
    loginSchema,
} from '../controllers/auth.controller';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

export default router;

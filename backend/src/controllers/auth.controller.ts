import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as authService from '../services/auth.service';

export const registerSchema = z.object({
    body: z.object({
        name: z.string().min(2, 'Name must be at least 2 characters'),
        nickname: z.string().max(20, 'Nickname must be at most 20 characters').optional(),
        email: z.string().email('Invalid email address'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
        password: z.string().min(1, 'Password is required'),
    }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];

export const register = async (
    req: Request<{}, {}, RegisterInput>,
    res: Response,
    next: NextFunction
) => {
    try {
        const { user, token } = await authService.registerUser(req.body);
        res.status(201).json({
            status: 'success',
            token,
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};

export const login = async (
    req: Request<{}, {}, LoginInput>,
    res: Response,
    next: NextFunction
) => {
    try {
        const { user, token } = await authService.loginUser(req.body);
        res.status(200).json({
            status: 'success',
            token,
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};

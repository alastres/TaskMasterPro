import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as userService from '../services/user.service';

export const updateProfileSchema = z.object({
    body: z.object({
        name: z.string().min(2).optional(),
        nickname: z.string().min(1).max(20, 'Nickname maximum 20 characters').optional(),
        avatarUrl: z.string().url().optional().or(z.literal('')),
    }),
});

export const changePasswordSchema = z.object({
    body: z.object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body'];

export const getMe = (req: AuthRequest, res: Response, next: NextFunction) => {
    res.status(200).json({
        status: 'success',
        data: {
            user: req.user,
        },
    });
};

export const updateProfile = async (
    req: AuthRequest<UpdateProfileInput>,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user!.id;
        const updatedUser = await userService.updateProfile(userId, req.body);
        res.status(200).json({
            status: 'success',
            data: { user: updatedUser },
        });
    } catch (error) {
        next(error);
    }
};

export const changePassword = async (
    req: AuthRequest<ChangePasswordInput>,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user!.id;
        const { currentPassword, newPassword } = req.body;
        await userService.changePassword(userId, currentPassword, newPassword);
        res.status(200).json({
            status: 'success',
            message: 'Password updated successfully',
        });
    } catch (error) {
        next(error);
    }
};

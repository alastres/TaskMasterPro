import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as userService from '../services/user.service';

export const updateProfileSchema = z.object({
    body: z.object({
        name: z.string().min(2).optional(),
        nickname: z.string().min(1).max(20, 'Nickname maximum 20 characters').optional(),
        avatarUrl: z.string().url().optional().or(z.literal('')),
        thresholdMedium: z.number().int().positive().optional(),
        thresholdHigh: z.number().int().positive().optional(),
        autoPriorityEnabled: z.union([z.boolean(), z.string().transform(val => val === 'true')]).optional(),
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
    // Parse body if it's sent as formdata (multer handles this generally, but we need to ensure types match)
    const { name, nickname, thresholdMedium, thresholdHigh, autoPriorityEnabled } = req.body;
    let dataToUpdate: any = {
        name,
        nickname,
        thresholdMedium: thresholdMedium ? Number(thresholdMedium) : undefined,
        thresholdHigh: thresholdHigh ? Number(thresholdHigh) : undefined,
        autoPriorityEnabled: autoPriorityEnabled === undefined ? undefined : (typeof autoPriorityEnabled === 'string' ? autoPriorityEnabled === 'true' : autoPriorityEnabled)
    };

    // If a file was uploaded, add the avatarUrl to the update data
    if (req.file) {
        // Multer-storage-cloudinary provides the secure_url or path in the file object
        dataToUpdate.avatarUrl = req.file.path;
    } else if (req.body.avatarUrl === '') {
        // Allow clearing avatar
        dataToUpdate.avatarUrl = null;
    }

    try {
        const userId = req.user!.id;
        const updatedUser = await userService.updateProfile(userId, dataToUpdate);
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

import prisma from '../config/db';
import bcrypt from 'bcryptjs';
import { AppError } from '../utils/AppError';
import { deleteOldAvatar } from '../utils/cleanupFiles';

export const updateProfile = async (
    userId: string,
    data: { name?: string; nickname?: string; avatarUrl?: string; thresholdMedium?: number; thresholdHigh?: number; autoPriorityEnabled?: boolean }
) => {
    // Check if nickname is taken by another user
    if (data.nickname) {
        const existingUser = await prisma.user.findFirst({
            where: {
                nickname: data.nickname,
                NOT: {
                    id: userId,
                },
            },
        });

        if (existingUser) {
            throw new AppError('Nickname is already taken', 400);
        }
    }

    // Get current user to check if they have an old avatar
    const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { avatarUrl: true },
    });

    // If updating avatarUrl and user has an old one, delete the old file
    if (data.avatarUrl && currentUser?.avatarUrl && currentUser.avatarUrl !== data.avatarUrl) {
        await deleteOldAvatar(currentUser.avatarUrl);
    }

    // Filter out undefined values to avoid overwriting with undefined
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.nickname !== undefined) updateData.nickname = data.nickname;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
    if (data.thresholdMedium !== undefined) updateData.thresholdMedium = data.thresholdMedium;
    if (data.thresholdHigh !== undefined) updateData.thresholdHigh = data.thresholdHigh;
    if (data.autoPriorityEnabled !== undefined) updateData.autoPriorityEnabled = data.autoPriorityEnabled;

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
};

export const changePassword = async (userId: string, currentPass: string, newPass: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    const isMatch = await bcrypt.compare(currentPass, user.password);
    if (!isMatch) throw new AppError('Incorrect current password', 401);

    const hashedNewPass = await bcrypt.hash(newPass, 12);

    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPass },
    });

    return true;
};

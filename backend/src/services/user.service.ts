import prisma from '../config/db';
import bcrypt from 'bcryptjs';
import { AppError } from '../utils/AppError';

export const updateProfile = async (
    userId: string,
    data: { name?: string; nickname?: string; avatarUrl?: string }
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

    const { nickname, ...rest } = data;
    // Ensure nickname constraint is respected just in case logic slips through valiation
    if (nickname && nickname.length > 20) {
        throw new AppError('Nickname cannot exceed 20 characters', 400);
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            ...rest,
            nickname: nickname,
        },
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

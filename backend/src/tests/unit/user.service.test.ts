import { describe, it, expect, beforeEach } from '@jest/globals';
import prisma from '../../config/db';
import bcrypt from 'bcryptjs';
import { updateProfile, changePassword } from '../../services/user.service';
import { deleteOldAvatar } from '../../utils/cleanupFiles';
import { AppError } from '../../utils/AppError';

// Mock dependencies
jest.mock('../../config/db', () => ({
    user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
    },
}));

jest.mock('bcryptjs', () => ({
    compare: jest.fn(),
    hash: jest.fn(),
}));

jest.mock('../../utils/cleanupFiles', () => ({
    deleteOldAvatar: jest.fn(),
}));

describe('User Service Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('updateProfile', () => {
        it('should update profile successfully', async () => {
            const userId = 'user-1';
            const data = { name: 'New Name' };

            // Mock nickname check (not provided)

            // Mock current user
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: userId, avatarUrl: 'old.jpg' });

            // Mock update
            (prisma.user.update as jest.Mock).mockResolvedValue({ id: userId, name: 'New Name', password: 'hash' });

            const result = await updateProfile(userId, data);

            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: userId },
                data: { name: 'New Name' },
            });
            expect(result).not.toHaveProperty('password');
            expect(result.name).toBe('New Name');
        });

        it('should throw error if nickname is taken', async () => {
            const userId = 'user-1';
            const data = { nickname: 'taken_nick' };

            (prisma.user.findFirst as jest.Mock).mockResolvedValue({ id: 'other-user' });

            await expect(updateProfile(userId, data)).rejects.toThrow(AppError);
            await expect(updateProfile(userId, data)).rejects.toThrow('Nickname is already taken');
        });

        it('should delete old avatar if new one provided', async () => {
            const userId = 'user-1';
            const data = { avatarUrl: 'new.jpg' };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: userId, avatarUrl: 'old.jpg' });
            (prisma.user.update as jest.Mock).mockResolvedValue({ id: userId });

            await updateProfile(userId, data);

            expect(deleteOldAvatar).toHaveBeenCalledWith('old.jpg');
        });
    });

    describe('changePassword', () => {
        it('should change password successfully', async () => {
            const userId = 'user-1';

            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: userId, password: 'hashed_old' });
            (bcrypt.compare as jest.Mock).mockResolvedValue(true as never);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_new' as never);

            await changePassword(userId, 'old', 'new');

            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: userId },
                data: { password: 'hashed_new' },
            });
        });

        it('should throw error if user not found', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
            await expect(changePassword('u1', 'old', 'new')).rejects.toThrow('User not found');
        });

        it('should throw error if current password incorrect', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', password: 'hash' });
            (bcrypt.compare as jest.Mock).mockResolvedValue(false as never);
            await expect(changePassword('u1', 'old', 'new')).rejects.toThrow('Incorrect current password');
        });
    });
});

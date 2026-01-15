import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../config/db';
import { AppError } from '../utils/AppError';
import * as cronService from '../services/cron.service';

export const getCronConfig = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const config = await prisma.systemConfig.findUnique({
            where: { key: 'CRON_CONFIG' }
        });

        // Default config if not set
        const defaultConfig = {
            schedule: '0 0 * * *', // Daily at midnight
            enabled: true,
            lastRun: null
        };

        res.status(200).json({
            status: 'success',
            data: config?.value || defaultConfig
        });
    } catch (error) {
        next(error);
    }
};

export const updateCronConfig = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { schedule, enabled } = req.body;

        if (!schedule) {
            return next(new AppError('Schedule (cron expression) is required', 400));
        }

        const config = await prisma.systemConfig.upsert({
            where: { key: 'CRON_CONFIG' },
            update: {
                value: { schedule, enabled, updatedAt: new Date() }
            },
            create: {
                key: 'CRON_CONFIG',
                value: { schedule, enabled, updatedAt: new Date() }
            }
        });

        // Reload cron jobs with new config
        cronService.reloadCronJobs();

        res.status(200).json({
            status: 'success',
            data: config.value
        });
    } catch (error) {
        next(error);
    }
};

export const triggerCronJob = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        console.log(`[Admin] Manually triggering cron jobs by user ${req.user!.id}...`);

        await cronService.runCleanupTasks();

        res.status(200).json({
            status: 'success',
            message: 'Cron job manual execution started'
        });
    } catch (error) {
        next(error);
    }
};

// User Management
export const getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                nickname: true,
                role: true,
                avatarUrl: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.status(200).json({
            status: 'success',
            data: users
        });
    } catch (error) {
        next(error);
    }
};

export const updateUserRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['USER', 'ADMIN'].includes(role)) {
            return next(new AppError('Invalid role. Must be USER or ADMIN', 400));
        }

        // Prevent changing own role
        if (id === req.user!.id) {
            return next(new AppError('Cannot change your own role', 403));
        }

        const user = await prisma.user.update({
            where: { id },
            data: { role },
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        });

        res.status(200).json({
            status: 'success',
            data: user
        });
    } catch (error) {
        next(error);
    }
};

export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        // Prevent self-deletion
        if (id === req.user!.id) {
            return next(new AppError('Cannot delete your own account', 403));
        }

        await prisma.user.delete({
            where: { id }
        });

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        next(error);
    }
};

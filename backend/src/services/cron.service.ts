import cron, { ScheduledTask } from 'node-cron';
import prisma from '../config/db';
import { InvitationStatus } from '@prisma/client';
import { cleanOrphanedAvatars } from '../utils/cleanupFiles';

let currentTask: ScheduledTask | null = null;

export const initCronJobs = async () => {
    console.log('Initializing Cron Jobs...');
    await reloadCronJobs();
};

export const reloadCronJobs = async () => {
    try {
        // Stop existing task if any
        if (currentTask) {
            currentTask.stop();
            currentTask = null;
        }

        // Fetch config
        const config = await prisma.systemConfig.findUnique({
            where: { key: 'CRON_CONFIG' }
        });

        const schedule = (config?.value as any)?.schedule || '0 0 * * *';
        const enabled = (config?.value as any)?.enabled !== false; // Default true

        if (enabled) {
            console.log(`[Cron] Scheduling jobs with pattern: ${schedule}`);
            currentTask = cron.schedule(schedule, async () => {
                console.log('Running scheduled optimization and cleanup...');
                await runCleanupTasks();
            });
        } else {
            console.log('[Cron] Jobs are currently disabled in configuration.');
        }

    } catch (error) {
        console.error('[Cron] Error loading configuration:', error);
        // Fallback default
        console.log('[Cron] Falling back to default schedule: 0 0 * * *');
        currentTask = cron.schedule('0 0 * * *', async () => {
            await runCleanupTasks();
        });
    }
};

export const runCleanupTasks = async () => {
    console.log('[Cron] Starting cleanup tasks...');
    await cleanupExpiredInvitations();
    await cleanupOldNotifications();
    await cleanOrphanedAvatars();
    console.log('[Cron] Cleanup tasks completed.');
};

const cleanupExpiredInvitations = async () => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const result = await prisma.invitation.deleteMany({
            where: {
                status: InvitationStatus.PENDING,
                createdAt: {
                    lt: sevenDaysAgo
                }
            }
        });

        if (result.count > 0) {
            console.log(`[Cron] Deleted ${result.count} expired invitations.`);
        }
    } catch (error) {
        console.error('[Cron] Error cleaning up invitations:', error);
    }
};

const cleanupOldNotifications = async () => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const result = await prisma.notification.deleteMany({
            where: {
                createdAt: {
                    lt: thirtyDaysAgo
                },
                isRead: true // Only delete read notifications? Or all? Let's delete all old ones.
            }
        });

        if (result.count > 0) {
            console.log(`[Cron] Deleted ${result.count} old notifications.`);
        }
    } catch (error) {
        console.error('[Cron] Error cleaning up notifications:', error);
    }
};

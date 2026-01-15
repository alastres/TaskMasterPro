import cron from 'node-cron';
import prisma from '../config/db';
import { InvitationStatus } from '@prisma/client';
import { cleanOrphanedAvatars } from '../utils/cleanupFiles';

export const initCronJobs = () => {
    console.log('Initializing Cron Jobs...');

    // Run every day at midnight: '0 0 * * *'
    // For testing/demo purposes, we can run it every hour: '0 * * * *'
    cron.schedule('0 0 * * *', async () => {
        console.log('Running daily optimization and cleanup...');
        await cleanupExpiredInvitations();
        await cleanupOldNotifications();
        await cleanOrphanedAvatars();
    });
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

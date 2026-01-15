import { createNotification, deleteNotification, deleteAllNotifications, getNotifications } from '../services/notification.service';
import prisma from '../config/db';
import { NotificationType } from '@prisma/client';

describe('Notification Service', () => {
    let testUser: any;

    beforeAll(async () => {
        // Create a test user
        testUser = await prisma.user.create({
            data: {
                email: 'notiftest@example.com',
                password: 'password123',
                name: 'Notif Test User',
                nickname: 'notiftest'
            }
        });
    });

    afterAll(async () => {
        await prisma.notification.deleteMany({ where: { userId: testUser.id } });
        await prisma.user.delete({ where: { id: testUser.id } });
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        await prisma.notification.deleteMany({ where: { userId: testUser.id } });
    });

    it('should delete all notifications for a user', async () => {
        // 1. Create multiple notifications
        await createNotification({
            userId: testUser.id,
            type: NotificationType.TEAM_JOINED,
            title: 'Notif 1',
            message: 'Message 1'
        });
        await createNotification({
            userId: testUser.id,
            type: NotificationType.TEAM_JOINED,
            title: 'Notif 2',
            message: 'Message 2'
        });

        // Verify creation
        let notifications = await getNotifications(testUser.id);
        expect(notifications).toHaveLength(2);

        // 2. Delete all
        await deleteAllNotifications(testUser.id);

        // 3. Verify deletion
        notifications = await getNotifications(testUser.id);
        expect(notifications).toHaveLength(0);
    });
});

// Standard Jest globals are available via @types/jest
import cron from 'node-cron';
import prisma from '../../config/db';
import { initCronJobs, reloadCronJobs, runCleanupTasks } from '../../services/cron.service';
import { cleanOrphanedAvatars } from '../../utils/cleanupFiles';

// Mock dependencies
jest.mock('node-cron', () => ({
    schedule: jest.fn().mockReturnValue({ stop: jest.fn() }),
}));

jest.mock('../../config/db', () => ({
    systemConfig: {
        findUnique: jest.fn(),
    },
    invitation: {
        deleteMany: jest.fn(),
    },
    notification: {
        deleteMany: jest.fn(),
    },
}));

jest.mock('../../utils/cleanupFiles', () => ({
    cleanOrphanedAvatars: jest.fn(),
}));

describe('Cron Service Utils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('initCronJobs', () => {
        it('should initialize cron jobs', async () => {
            // Mock prisma response for config
            (prisma.systemConfig.findUnique as jest.Mock).mockResolvedValue({
                id: '1',
                key: 'CRON_CONFIG',
                value: { schedule: '0 0 * * *', enabled: true },
            });

            await initCronJobs();

            expect(prisma.systemConfig.findUnique).toHaveBeenCalledWith({ where: { key: 'CRON_CONFIG' } });
            expect(cron.schedule).toHaveBeenCalledWith('0 0 * * *', expect.any(Function));
        });
    });

    describe('reloadCronJobs', () => {
        it('should schedule jobs with default config if no config found', async () => {
            (prisma.systemConfig.findUnique as jest.Mock).mockResolvedValue(null);

            await reloadCronJobs();

            expect(cron.schedule).toHaveBeenCalledWith('0 0 * * *', expect.any(Function));
        });

        it('should schedule jobs with custom config', async () => {
            (prisma.systemConfig.findUnique as jest.Mock).mockResolvedValue({
                id: '1',
                key: 'CRON_CONFIG',
                value: { schedule: '*/30 * * * *', enabled: true },
            });

            await reloadCronJobs();

            expect(cron.schedule).toHaveBeenCalledWith('*/30 * * * *', expect.any(Function));
        });

        it('should not schedule jobs if disabled', async () => {
            (prisma.systemConfig.findUnique as jest.Mock).mockResolvedValue({
                id: '1',
                key: 'CRON_CONFIG',
                value: { schedule: '0 0 * * *', enabled: false },
            });

            await reloadCronJobs();

            expect(cron.schedule).not.toHaveBeenCalled();
        });

        it('should handle errors and fallback to default', async () => {
            (prisma.systemConfig.findUnique as jest.Mock).mockRejectedValue(new Error('DB Error'));

            await reloadCronJobs();

            expect(cron.schedule).toHaveBeenCalledWith('0 0 * * *', expect.any(Function));
        });
    });

    describe('runCleanupTasks', () => {
        it('should run all cleanup functions', async () => {
            (prisma.invitation.deleteMany as jest.Mock).mockResolvedValue({ count: 5 });
            (prisma.notification.deleteMany as jest.Mock).mockResolvedValue({ count: 10 });
            (cleanOrphanedAvatars as jest.Mock).mockResolvedValue(undefined);

            await runCleanupTasks();

            expect(prisma.invitation.deleteMany).toHaveBeenCalled();
            expect(prisma.notification.deleteMany).toHaveBeenCalled();
            expect(cleanOrphanedAvatars).toHaveBeenCalled();
        });

        it('should handle errors gracefully during cleanup', async () => {
            (prisma.invitation.deleteMany as jest.Mock).mockRejectedValue(new Error('Cleanup Error'));

            // Should not throw
            await expect(runCleanupTasks()).resolves.not.toThrow();
        });
    });
});

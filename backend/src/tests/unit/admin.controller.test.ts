import { describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import prisma from '../../config/db';
import * as adminController from '../../controllers/admin.controller';
import * as cronService from '../../services/cron.service';
import { AppError } from '../../utils/AppError';

// Mock DB and Services
jest.mock('../../config/db', () => ({
    systemConfig: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
    },
    user: {
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    }
}));

jest.mock('../../services/cron.service', () => ({
    reloadCronJobs: jest.fn(),
    runCleanupTasks: jest.fn(),
}));

// Mock Express
const mockRequest = (body = {}, params = {}, user = { id: 'admin-id' }) => ({
    body,
    params,
    user
}) as unknown as Request;

const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

const mockNext = jest.fn();

describe('Admin Controller Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getCronConfig', () => {
        it('should return default config if none exists', async () => {
            (prisma.systemConfig.findUnique as jest.Mock).mockResolvedValue(null);
            const req = mockRequest();
            const res = mockResponse();

            await adminController.getCronConfig(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ schedule: '0 0 * * *' })
            }));
        });

        it('should return stored config', async () => {
            (prisma.systemConfig.findUnique as jest.Mock).mockResolvedValue({
                value: { schedule: 'custom', enabled: false }
            });
            const req = mockRequest();
            const res = mockResponse();

            await adminController.getCronConfig(req, res, mockNext);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                data: { schedule: 'custom', enabled: false }
            }));
        });
    });

    describe('updateCronConfig', () => {
        it('should update config and reload jobs', async () => {
            (prisma.systemConfig.upsert as jest.Mock).mockResolvedValue({
                value: { schedule: 'new', enabled: true }
            });
            const req = mockRequest({ schedule: 'new', enabled: true });
            const res = mockResponse();

            await adminController.updateCronConfig(req, res, mockNext);

            expect(prisma.systemConfig.upsert).toHaveBeenCalled();
            expect(cronService.reloadCronJobs).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                data: { schedule: 'new', enabled: true }
            }));
        });

        it('should fail if schedule validation fails', async () => {
            const req = mockRequest({});
            const res = mockResponse();

            await adminController.updateCronConfig(req, res, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        });
    });

    describe('triggerCronJob', () => {
        it('should trigger cleanup tasks', async () => {
            const req = mockRequest();
            const res = mockResponse();

            await adminController.triggerCronJob(req, res, mockNext);

            expect(cronService.runCleanupTasks).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('getAllUsers', () => {
        it('should return all users', async () => {
            (prisma.user.findMany as jest.Mock).mockResolvedValue([{ id: 'u1' }]);
            const req = mockRequest();
            const res = mockResponse();

            await adminController.getAllUsers(req, res, mockNext);

            expect(prisma.user.findMany).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                data: [{ id: 'u1' }]
            }));
        });
    });

    describe('updateUserRole', () => {
        it('should update user role', async () => {
            (prisma.user.update as jest.Mock).mockResolvedValue({ id: 'u2', role: 'ADMIN' });
            const req = mockRequest({ role: 'ADMIN' }, { id: 'u2' });
            const res = mockResponse();

            await adminController.updateUserRole(req, res, mockNext);

            expect(prisma.user.update).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ role: 'ADMIN' })
            }));
        });

        it('should fail validation for invalid role', async () => {
            const req = mockRequest({ role: 'INVALID' }, { id: 'u2' });
            const res = mockResponse();

            await adminController.updateUserRole(req, res, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        });

        it('should prevent changing own role', async () => {
            const req = mockRequest({ role: 'ADMIN' }, { id: 'admin-id' });
            const res = mockResponse();

            await adminController.updateUserRole(req, res, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ message: 'Cannot change your own role' }));
        });
    });

    describe('deleteUser', () => {
        it('should delete user', async () => {
            const req = mockRequest({}, { id: 'u2' });
            const res = mockResponse();

            await adminController.deleteUser(req, res, mockNext);

            expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u2' } });
            expect(res.status).toHaveBeenCalledWith(204);
        });

        it('should prevent self-deletion', async () => {
            const req = mockRequest({}, { id: 'admin-id' });
            const res = mockResponse();

            await adminController.deleteUser(req, res, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ message: 'Cannot delete your own account' }));
        });
    });
});

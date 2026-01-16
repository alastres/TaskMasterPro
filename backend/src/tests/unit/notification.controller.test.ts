import { describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import * as notificationController from '../../controllers/notification.controller';
import * as notificationService from '../../services/notification.service';
import * as teamService from '../../services/team.service';
import { AppError } from '../../utils/AppError';

// Mock Services
jest.mock('../../services/notification.service', () => ({
    getNotifications: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    deleteNotification: jest.fn(),
    deleteAllNotifications: jest.fn(),
}));

jest.mock('../../services/team.service', () => ({
    respondToInvitation: jest.fn(),
}));

// Mock Express
const mockRequest = (body = {}, params = {}, user = { id: 'u1' }) => ({
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

describe('Notification Controller Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getMyNotifications', () => {
        it('should return notifications', async () => {
            (notificationService.getNotifications as jest.Mock).mockResolvedValue([{ id: 'n1' }]);
            const req = mockRequest();
            const res = mockResponse();

            await notificationController.getMyNotifications(req, res, mockNext);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                data: [{ id: 'n1' }]
            }));
        });
    });

    describe('markAsRead', () => {
        it('should mark notification as read', async () => {
            (notificationService.markAsRead as jest.Mock).mockResolvedValue({ id: 'n1', isRead: true });
            const req = mockRequest({}, { id: 'n1' });
            const res = mockResponse();

            await notificationController.markAsRead(req, res, mockNext);

            expect(notificationService.markAsRead).toHaveBeenCalledWith('n1', 'u1');
            expect(res.json).toHaveBeenCalled();
        });
    });

    describe('markAllAsRead', () => {
        it('should mark all as read', async () => {
            const req = mockRequest();
            const res = mockResponse();

            await notificationController.markAllAsRead(req, res, mockNext);

            expect(notificationService.markAllAsRead).toHaveBeenCalledWith('u1');
            expect(res.json).toHaveBeenCalled();
        });
    });

    describe('respondToInvitation', () => {
        it('should respond to invitation (accept)', async () => {
            const req = mockRequest({ invitationId: '00000000-0000-0000-0000-000000000001', accept: true });
            const res = mockResponse();
            (teamService.respondToInvitation as jest.Mock).mockResolvedValue({ message: 'Accepted' });

            await notificationController.respondToInvitation(req, res, mockNext);

            expect(teamService.respondToInvitation).toHaveBeenCalledWith('00000000-0000-0000-0000-000000000001', 'u1', true);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Accepted'
            }));
        });

        it('should handle validation errors', async () => {
            const req = mockRequest({ invitationId: 'invalid-uuid', accept: true });
            const res = mockResponse();

            await notificationController.respondToInvitation(req, res, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        });
    });

    describe('deleteNotification', () => {
        it('should delete notification', async () => {
            const req = mockRequest({}, { id: 'n1' });
            const res = mockResponse();

            await notificationController.deleteNotification(req, res, mockNext);

            expect(notificationService.deleteNotification).toHaveBeenCalledWith('n1', 'u1');
            expect(res.status).toHaveBeenCalledWith(204);
        });
    });

    describe('deleteAllNotifications', () => {
        it('should delete all notifications', async () => {
            const req = mockRequest({}, {});
            const res = mockResponse();

            await notificationController.deleteAllNotifications(req, res, mockNext);

            expect(notificationService.deleteAllNotifications).toHaveBeenCalledWith('u1');
            expect(res.status).toHaveBeenCalledWith(204);
        });
    });
});

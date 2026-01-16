import { describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import * as userController from '../../controllers/user.controller';
import * as userService from '../../services/user.service';

// Mock Service
jest.mock('../../services/user.service', () => ({
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
}));

// Mock Express
const mockRequest = (body: any = {}, user = { id: 'u1' }, file?: any) => ({
    body,
    user,
    file,
    get: jest.fn().mockReturnValue('localhost:3000'),
    protocol: 'http',
}) as unknown as Request;

const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

const mockNext = jest.fn();

describe('User Controller Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getMe', () => {
        it('should return current user', () => {
            const req = mockRequest();
            const res = mockResponse();

            userController.getMe(req, res, mockNext);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                data: { user: { id: 'u1' } }
            }));
        });
    });

    describe('updateProfile', () => {
        it('should update basic info', async () => {
            (userService.updateProfile as jest.Mock).mockResolvedValue({ id: 'u1', name: 'New' });
            const req = mockRequest({ name: 'New' });
            const res = mockResponse();

            await userController.updateProfile(req, res, mockNext);

            expect(userService.updateProfile).toHaveBeenCalledWith('u1', expect.objectContaining({ name: 'New' }));
            expect(res.json).toHaveBeenCalled();
        });

        it('should handle avatar upload', async () => {
            const file = { filename: 'avatar.jpg' };
            const req = mockRequest({}, { id: 'u1' }, file);
            const res = mockResponse();

            await userController.updateProfile(req, res, mockNext);

            expect(userService.updateProfile).toHaveBeenCalledWith('u1', expect.objectContaining({
                avatarUrl: 'http://localhost:3000/uploads/avatars/avatar.jpg'
            }));
        });

        it('should handle avatar removal', async () => {
            const req = mockRequest({ avatarUrl: '' });
            const res = mockResponse();

            await userController.updateProfile(req, res, mockNext);

            expect(userService.updateProfile).toHaveBeenCalledWith('u1', expect.objectContaining({
                avatarUrl: null
            }));
        });

        it('should convert numerical thresholds', async () => {
            const req = mockRequest({ thresholdMedium: '5', thresholdHigh: '10' });
            const res = mockResponse();

            await userController.updateProfile(req, res, mockNext);

            expect(userService.updateProfile).toHaveBeenCalledWith('u1', expect.objectContaining({
                thresholdMedium: 5,
                thresholdHigh: 10
            }));
        });

        it('should handle autoPriorityEnabled string conversion', async () => {
            const req = mockRequest({ autoPriorityEnabled: 'true' });
            const res = mockResponse();

            await userController.updateProfile(req, res, mockNext);

            expect(userService.updateProfile).toHaveBeenCalledWith('u1', expect.objectContaining({
                autoPriorityEnabled: true
            }));
        });
    });

    describe('changePassword', () => {
        it('should change password', async () => {
            const req = mockRequest({ currentPassword: 'old', newPassword: 'new' });
            const res = mockResponse();

            await userController.changePassword(req, res, mockNext);

            expect(userService.changePassword).toHaveBeenCalledWith('u1', 'old', 'new');
            expect(res.json).toHaveBeenCalled();
        });
    });
});

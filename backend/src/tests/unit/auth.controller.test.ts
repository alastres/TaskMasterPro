import { describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import * as authController from '../../controllers/auth.controller';
import * as authService from '../../services/auth.service';

// Mock Service
jest.mock('../../services/auth.service', () => ({
    registerUser: jest.fn(),
    loginUser: jest.fn(),
}));

// Mock Express
const mockRequest = (body: any = {}) => ({
    body,
}) as unknown as Request;

const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

const mockNext = jest.fn();

describe('Auth Controller Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should register user and return token', async () => {
            const body = { name: 'Test', email: 'test@test.com', password: 'pw' };
            const req = mockRequest(body);
            const res = mockResponse();

            (authService.registerUser as jest.Mock).mockResolvedValue({
                user: { id: 'u1', email: 'test@test.com' },
                token: 'jwt-token'
            });

            await authController.register(req as any, res, mockNext);

            expect(authService.registerUser).toHaveBeenCalledWith(body);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                status: 'success',
                token: 'jwt-token',
                data: { user: expect.any(Object) }
            });
        });

        it('should call next on error', async () => {
            const req = mockRequest({});
            const res = mockResponse();
            (authService.registerUser as jest.Mock).mockRejectedValue(new Error('Fail'));

            await authController.register(req as any, res, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    describe('login', () => {
        it('should login user and return token', async () => {
            const body = { email: 'test@test.com', password: 'pw' };
            const req = mockRequest(body);
            const res = mockResponse();

            (authService.loginUser as jest.Mock).mockResolvedValue({
                user: { id: 'u1' },
                token: 'jwt-token'
            });

            await authController.login(req as any, res, mockNext);

            expect(authService.loginUser).toHaveBeenCalledWith(body);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                token: 'jwt-token'
            }));
        });

        it('should call next on error', async () => {
            const req = mockRequest({});
            const res = mockResponse();
            (authService.loginUser as jest.Mock).mockRejectedValue(new Error('Fail'));

            await authController.login(req as any, res, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
        });
    });
});

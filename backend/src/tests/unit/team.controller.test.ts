import { describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import * as teamController from '../../controllers/team.controller';
import * as teamService from '../../services/team.service';
import { AppError } from '../../utils/AppError';

// Mock Services
jest.mock('../../services/team.service', () => ({
    getOrCreateUserTeam: jest.fn(),
    inviteMember: jest.fn(),
    removeMemberFromProject: jest.fn(),
    getUserMemberships: jest.fn(),
    cancelInvitation: jest.fn(),
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

describe('Team Controller Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getMyTeam', () => {
        it('should return user team', async () => {
            (teamService.getOrCreateUserTeam as jest.Mock).mockResolvedValue({ id: 't1' });
            const req = mockRequest();
            const res = mockResponse();

            await teamController.getMyTeam(req, res, mockNext);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                data: { id: 't1' }
            }));
        });
    });

    describe('inviteMember', () => {
        it('should invite member successfully', async () => {
            const body = {
                email: 'test@example.com',
                teamId: '00000000-0000-0000-0000-000000000001',
                projectId: '00000000-0000-0000-0000-000000000002'
            };
            const req = mockRequest(body);
            const res = mockResponse();

            (teamService.inviteMember as jest.Mock).mockResolvedValue({ id: 'inv1' });

            await teamController.inviteMember(req, res, mockNext);

            expect(teamService.inviteMember).toHaveBeenCalledWith(
                body.teamId,
                body.email,
                'u1',
                body.projectId
            );
            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('should handle validation errors', async () => {
            const req = mockRequest({ email: 'invalid-email' });
            const res = mockResponse();

            await teamController.inviteMember(req, res, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        });
    });

    describe('removeMemberFromProject', () => {
        it('should remove member', async () => {
            const req = mockRequest({}, { projectId: 'p1', userId: 'u2' });
            const res = mockResponse();

            await teamController.removeMemberFromProject(req, res, mockNext);

            expect(teamService.removeMemberFromProject).toHaveBeenCalledWith('p1', 'u2', 'u1');
            expect(res.status).toHaveBeenCalledWith(204);
        });
    });

    describe('getMemberships', () => {
        it('should return memberships', async () => {
            (teamService.getUserMemberships as jest.Mock).mockResolvedValue([]);
            const req = mockRequest();
            const res = mockResponse();

            await teamController.getMemberships(req, res, mockNext);

            expect(teamService.getUserMemberships).toHaveBeenCalledWith('u1');
            expect(res.json).toHaveBeenCalled();
        });
    });

    describe('cancelInvitation', () => {
        it('should cancel invitation', async () => {
            const req = mockRequest({}, { id: 'inv1' });
            const res = mockResponse();

            await teamController.cancelInvitation(req, res, mockNext);

            expect(teamService.cancelInvitation).toHaveBeenCalledWith('inv1', 'u1');
            expect(res.status).toHaveBeenCalledWith(204);
        });
    });
});

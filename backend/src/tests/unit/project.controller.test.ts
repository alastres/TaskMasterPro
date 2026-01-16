import { describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import prisma from '../../config/db';
import { createProject, getProjects, getProjectById, updateProject, deleteProject } from '../../controllers/project.controller';
import { AppError } from '../../utils/AppError';

// Mock DB
jest.mock('../../config/db', () => ({
    team: { findUnique: jest.fn() },
    project: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    invitation: {
        findMany: jest.fn(),
        deleteMany: jest.fn(),
    },
    notification: { deleteMany: jest.fn() },
    task: { deleteMany: jest.fn() },
}));

// Mock express objects
const mockRequest = (body = {}, params = {}, user = { id: 'user-1' }) => ({
    body,
    params,
    user,
}) as unknown as Request;

const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

const mockNext = jest.fn();

describe('Project Controller Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createProject', () => {
        it('should create project with unique slug', async () => {
            const req = mockRequest({ name: 'My Project' });
            const res = mockResponse();

            // Mock team check
            (prisma.team.findUnique as jest.Mock).mockResolvedValue(null);

            // Mock slug uniqueness check: first 'my-project' exists, then 'my-project-1' is free
            (prisma.project.findUnique as jest.Mock)
                .mockResolvedValueOnce({ id: 'existing' }) // First check collision
                .mockResolvedValueOnce(null); // Second check free

            (prisma.project.create as jest.Mock).mockResolvedValue({ id: 'p1', name: 'My Project', slug: 'my-project-1' });

            await createProject(req, res, mockNext);

            expect(prisma.project.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    slug: 'my-project-1'
                })
            }));
            expect(res.status).toHaveBeenCalledWith(201);
        });
    });

    describe('getProjects', () => {
        it('should return projects with ownership flag', async () => {
            const req = mockRequest({}, {}, { id: 'u1' });
            const res = mockResponse();

            const projects = [
                { id: 'p1', userId: 'u1' }, // Owned
                { id: 'p2', userId: 'u2' }  // Member
            ];

            (prisma.project.findMany as jest.Mock).mockResolvedValue(projects);

            await getProjects(req, res, mockNext);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                data: {
                    projects: [
                        { id: 'p1', userId: 'u1', isOwner: true },
                        { id: 'p2', userId: 'u2', isOwner: false }
                    ]
                }
            }));
        });
    });

    describe('getProjectById', () => {
        it('should return 404 if project not found', async () => {
            const req = mockRequest({}, { id: 'missing' });
            const res = mockResponse();
            (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

            await getProjectById(req, res, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        });

        it('should return 403 if user not authorized', async () => {
            const req = mockRequest({}, { id: 'p1' }, { id: 'u1' });
            const res = mockResponse();

            (prisma.project.findUnique as jest.Mock).mockResolvedValue({
                id: 'p1',
                userId: 'u2', // Different owner
                members: []    // Not a member
            });

            await getProjectById(req, res, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        });
    });

    describe('deleteProject', () => {
        it('should cascade delete resources', async () => {
            const req = mockRequest({}, { id: 'p1' }, { id: 'u1' });
            const res = mockResponse();

            (prisma.project.findUnique as jest.Mock).mockResolvedValue({
                id: 'p1',
                userId: 'u1'
            });

            (prisma.invitation.findMany as jest.Mock).mockResolvedValue([{ id: 'inv1' }]);

            await deleteProject(req, res, mockNext);

            // Should delete notifications for invitations
            expect(prisma.notification.deleteMany).toHaveBeenCalled();
            // Should delete invitations
            expect(prisma.invitation.deleteMany).toHaveBeenCalled();
            // Should delete tasks
            expect(prisma.task.deleteMany).toHaveBeenCalled();
            // Should delete project
            expect(prisma.project.delete).toHaveBeenCalled();

            expect(res.status).toHaveBeenCalledWith(204);
        });
    });
});

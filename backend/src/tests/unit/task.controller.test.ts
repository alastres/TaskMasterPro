import { describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import * as taskController from '../../controllers/task.controller';
import * as taskService from '../../services/task.service';
import prisma from '../../config/db';
import { AppError } from '../../utils/AppError';

// Mock Services and DB
jest.mock('../../services/task.service', () => ({
    getTasks: jest.fn(),
    getTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
}));

jest.mock('../../config/db', () => ({
    project: { findUnique: jest.fn() },
    task: { create: jest.fn() },
}));

// Mock Express
const mockRequest = (body: any = {}, params = {}, query = {}, user = { id: 'u1' }) => ({
    body,
    params,
    query,
    user
}) as unknown as Request;

const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

const mockNext = jest.fn();

describe('Task Controller Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createTask', () => {
        it('should create task successfully', async () => {
            const body = { title: 'New Task' };
            const req = mockRequest(body);
            const res = mockResponse();

            (prisma.task.create as jest.Mock).mockResolvedValue({ id: 't1', ...body });

            await taskController.createTask(req, res, mockNext);

            expect(prisma.task.create).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                data: { task: expect.objectContaining({ title: 'New Task' }) }
            }));
        });

        it('should create task with project (owner)', async () => {
            const body = { title: 'Project Task', projectId: 'p1' };
            const req = mockRequest(body);
            const res = mockResponse();

            (prisma.project.findUnique as jest.Mock).mockResolvedValue({ id: 'p1', userId: 'u1' });
            (prisma.task.create as jest.Mock).mockResolvedValue({ id: 't1', ...body });

            await taskController.createTask(req, res, mockNext);

            expect(prisma.project.findUnique).toHaveBeenCalledWith({ where: { id: 'p1' } });
            expect(prisma.task.create).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('should fail creation if project not found or access denied', async () => {
            const body = { title: 'Fail Task', projectId: 'p1' };
            const req = mockRequest(body);
            const res = mockResponse();

            (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

            await taskController.createTask(req, res, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ message: 'Project not found or access denied' }));
        });
    });

    describe('getAllTasks', () => {
        it('should return tasks', async () => {
            (taskService.getTasks as jest.Mock).mockResolvedValue([{ id: 't1' }]);
            const req = mockRequest();
            const res = mockResponse();

            await taskController.getAllTasks(req, res, mockNext);

            expect(taskService.getTasks).toHaveBeenCalledWith('u1', expect.anything());
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                data: { tasks: [{ id: 't1' }] }
            }));
        });
    });

    describe('getTask', () => {
        it('should return task', async () => {
            (taskService.getTask as jest.Mock).mockResolvedValue({ id: 't1' });
            const req = mockRequest({}, { id: 't1' });
            const res = mockResponse();

            await taskController.getTask(req, res, mockNext);

            expect(taskService.getTask).toHaveBeenCalledWith('u1', 't1');
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                data: { task: { id: 't1' } }
            }));
        });
    });

    describe('updateTask', () => {
        it('should update task', async () => {
            (taskService.updateTask as jest.Mock).mockResolvedValue({ id: 't1', title: 'Updated' });
            const req = mockRequest({ title: 'Updated' }, { id: 't1' });
            const res = mockResponse();

            await taskController.updateTask(req, res, mockNext);

            expect(taskService.updateTask).toHaveBeenCalledWith('u1', 't1', { title: 'Updated' });
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                data: { task: expect.objectContaining({ title: 'Updated' }) }
            }));
        });
    });

    describe('deleteTask', () => {
        it('should delete task', async () => {
            const req = mockRequest({}, { id: 't1' });
            const res = mockResponse();

            await taskController.deleteTask(req, res, mockNext);

            expect(taskService.deleteTask).toHaveBeenCalledWith('u1', 't1');
            expect(res.status).toHaveBeenCalledWith(204);
        });
    });
});

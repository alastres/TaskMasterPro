import { describe, it, expect, beforeEach } from '@jest/globals';
import prisma from '../../config/db';
import { calculateEffectivePriority, createTask, getTasks, getTask, updateTask, deleteTask } from '../../services/task.service';
import { AppError } from '../../utils/AppError';
import { TaskStatus, Priority } from '@prisma/client';

// Mock DB
jest.mock('../../config/db', () => ({
    task: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    project: {
        findUnique: jest.fn(),
    }
}));

describe('Task Service Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('calculateEffectivePriority', () => {
        it('should return task priority if no due date', () => {
            const task: any = { priority: Priority.LOW, dueDate: null };
            expect(calculateEffectivePriority(task)).toBe(Priority.LOW);
        });

        it('should return task priority if task completed', () => {
            const task: any = { priority: Priority.LOW, dueDate: new Date(), status: TaskStatus.COMPLETED };
            expect(calculateEffectivePriority(task)).toBe(Priority.LOW);
        });

        it('should return High priority if close to due date', () => {
            const now = new Date();
            const due = new Date(now.getTime() + 1000 * 60 * 60 * 10); // 10 hours from now
            const task: any = {
                priority: Priority.LOW,
                dueDate: due,
                status: TaskStatus.PENDING,
                user: { thresholdHigh: 24, thresholdMedium: 48, autoPriorityEnabled: true }
            };
            expect(calculateEffectivePriority(task)).toBe(Priority.HIGH);
        });

        it('should return Medium priority if moderately close', () => {
            const now = new Date();
            const due = new Date(now.getTime() + 1000 * 60 * 60 * 30); // 30 hours from now
            const task: any = {
                priority: Priority.LOW,
                dueDate: due,
                status: TaskStatus.PENDING,
                user: { thresholdHigh: 24, thresholdMedium: 48, autoPriorityEnabled: true }
            };
            expect(calculateEffectivePriority(task)).toBe(Priority.MEDIUM);
        });

        it('should return Low priority if far from due date', () => {
            const now = new Date();
            const due = new Date(now.getTime() + 1000 * 60 * 60 * 100); // 100 hours from now
            const task: any = {
                priority: Priority.HIGH,
                dueDate: due,
                status: TaskStatus.PENDING,
                user: { thresholdHigh: 24, thresholdMedium: 48, autoPriorityEnabled: true }
            };
            // Note: Currently logic forces LOW if outside medium threshold, ignoring original high?
            // "return Priority.LOW;" is the code.
            expect(calculateEffectivePriority(task)).toBe(Priority.LOW);
        });

        it('should respect autoPriorityEnabled = false', () => {
            const now = new Date();
            const due = new Date(now.getTime() + 1000 * 60 * 60 * 10); // 10 hours from now
            const task: any = {
                priority: Priority.LOW,
                dueDate: due,
                status: TaskStatus.PENDING,
                user: { thresholdHigh: 24, thresholdMedium: 48, autoPriorityEnabled: false }
            };
            expect(calculateEffectivePriority(task)).toBe(Priority.LOW);
        });
    });

    describe('createTask', () => {
        it('should create task', async () => {
            (prisma.task.create as jest.Mock).mockResolvedValue({ id: 't1' });
            await createTask('u1', { title: 'T' });
            expect(prisma.task.create).toHaveBeenCalled();
        });

        it('should throw if project not found', async () => {
            (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);
            await expect(createTask('u1', { title: 'T', projectId: 'p1' })).rejects.toThrow(AppError);
        });

        it('should throw if user not project owner', async () => {
            (prisma.project.findUnique as jest.Mock).mockResolvedValue({ userId: 'u2' });
            await expect(createTask('u1', { title: 'T', projectId: 'p1' })).rejects.toThrow('Solo el dueño del proyecto puede añadir tareas');
        });
    });

    describe('getTask', () => {
        it('should allow owner', async () => {
            (prisma.task.findUnique as jest.Mock).mockResolvedValue({ id: 't1', userId: 'u1', priority: 'LOW' });
            await getTask('u1', 't1');
            expect(prisma.task.findUnique).toHaveBeenCalled();
        });

        it('should allow project owner', async () => {
            (prisma.task.findUnique as jest.Mock).mockResolvedValue({
                id: 't1', userId: 'u2', priority: 'LOW',
                project: { userId: 'u1' }
            });
            await getTask('u1', 't1');
        });

        it('should allow team member', async () => {
            (prisma.task.findUnique as jest.Mock).mockResolvedValue({
                id: 't1', userId: 'u2', priority: 'LOW',
                project: {
                    userId: 'u2',
                    team: { members: [{ userId: 'u1' }] }
                }
            });
            await getTask('u1', 't1');
        });

        it('should allow project member', async () => {
            (prisma.task.findUnique as jest.Mock).mockResolvedValue({
                id: 't1', userId: 'u2', priority: 'LOW',
                project: {
                    userId: 'u2',
                    members: [{ userId: 'u1' }]
                }
            });
            await getTask('u1', 't1');
        });

        it('should deny unauthorized', async () => {
            (prisma.task.findUnique as jest.Mock).mockResolvedValue({
                id: 't1', userId: 'u2', priority: 'LOW',
                project: {
                    userId: 'u2',
                    members: [],
                    team: { members: [] }
                }
            });
            await expect(getTask('u1', 't1')).rejects.toThrow('No tienes permiso');
        });
    });

    describe('updateTask', () => {
        it('should allow owner to update anything', async () => {
            (prisma.task.findUnique as jest.Mock).mockResolvedValue({ id: 't1', userId: 'u1' });
            await updateTask('u1', 't1', { title: 'New' });
            expect(prisma.task.update).toHaveBeenCalled();
        });
    });
});

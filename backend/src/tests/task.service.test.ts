import { createTask, getTasks, updateTask, getTask } from '../services/task.service';
import prisma from '../config/db';
import { AppError } from '../utils/AppError';
import { TaskStatus, Priority } from '@prisma/client';

describe('Task Service', () => {
    let userA: any;
    let projectA: any;

    beforeAll(async () => {
        // Create userA
        userA = await prisma.user.create({
            data: {
                email: 'taskSvcUserA@test.com',
                password: 'password123',
                name: 'User A',
                nickname: 'usera',
            }
        });

        // Create projectA
        projectA = await prisma.project.create({
            data: {
                name: 'Project A',
                userId: userA.id,
            }
        });
    });

    beforeEach(async () => {
        await prisma.task.deleteMany({ where: { userId: userA.id } });
    });

    afterAll(async () => {
        await prisma.task.deleteMany({ where: { userId: userA.id } });
        await prisma.project.delete({ where: { id: projectA.id } });
        await prisma.user.delete({ where: { id: userA.id } });
    });

    describe('createTask', () => {
        it('should create a task successfully', async () => {
            const input = {
                title: 'New Task',
                description: 'Description',
                priority: 'MEDIUM' as any,
            };

            const task = await createTask(userA.id, input);
            expect(task).toHaveProperty('id');
            expect(task.title).toBe(input.title);
            expect(task.userId).toBe(userA.id);
        });

        it('should create a task in a project', async () => {
            const input = {
                title: 'Project Task',
                projectId: projectA.id,
            };
            const task = await createTask(userA.id, input);
            expect(task.projectId).toBe(projectA.id);
        });
    });

    describe('getTasks', () => {
        it('should return tasks filtering by status', async () => {
            await createTask(userA.id, { title: 'Pending Task', status: 'PENDING' as any });
            await createTask(userA.id, { title: 'Completed Task', status: 'COMPLETED' as any });

            const pendingTasks = await getTasks(userA.id, { status: 'PENDING' });
            expect(pendingTasks).toHaveLength(1);
            expect(pendingTasks[0].title).toBe('Pending Task');
        });
    });

    describe('updateTask', () => {
        it('should update task status', async () => {
            const task = await createTask(userA.id, { title: 'To Update' });
            const updated = await updateTask(userA.id, task.id, { status: 'IN_PROGRESS' as any });
            expect(updated.status).toBe('IN_PROGRESS');
        });

        it('should throw error if user does not have permission', async () => {
            const task = await createTask(userA.id, { title: 'To Fail Update' });
            const otherUserId = 'some-other-uuid'; // Assuming this UUID doesn't exist or is different
            // We need to mock a real UUID format usually, but let's rely on service check
            // AppError checks owner.
            // Wait, if user doesn't exist, service might throw earlier?
            // Actually service.updateTask checks task.userId === userId.

            // We need to pass a valid UUID format if we want to avoid db errors before service logic
            // But 'some-other-uuid' is not valid UUID. let's use a fake valid one.
            const fakeId = '00000000-0000-0000-0000-000000000000';

            await expect(updateTask(fakeId, task.id, { title: 'Hacked' })).rejects.toThrow(AppError);
        });
    });
});

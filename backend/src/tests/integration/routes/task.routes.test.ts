import request from 'supertest';
import app from '../../../app';
import prisma from '../../../config/db';
import { cleanDatabase } from '../../fixtures/seed';
import bcrypt from 'bcryptjs';
import { signToken } from '../../../utils/jwt';
import { TaskStatus, Priority } from '@prisma/client';

describe('Task Routes Integration Tests', () => {
    let authToken: string;
    let userId: string;
    let projectId: string;
    let taskId: string;

    beforeAll(async () => {
        await cleanDatabase();
    });

    afterAll(async () => {
        await cleanDatabase();
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        await cleanDatabase();

        // Create test user
        const user = await prisma.user.create({
            data: {
                name: 'Test User',
                nickname: 'TestUser',
                email: 'user@example.com',
                password: await bcrypt.hash('password123', 12),
            },
        });

        userId = user.id;
        authToken = signToken(userId);

        // Create test project
        const project = await prisma.project.create({
            data: {
                name: 'Test Project',
                userId,
            },
        });

        projectId = project.id;

        // Create test task
        const task = await prisma.task.create({
            data: {
                title: 'Test Task',
                description: 'Test description',
                status: TaskStatus.PENDING,
                priority: Priority.MEDIUM,
                userId,
                projectId,
            },
        });

        taskId = task.id;
    });

    describe('POST /api/tasks', () => {
        it('should create a task successfully', async () => {
            const taskData = {
                title: 'New Task',
                description: 'New task description',
                status: TaskStatus.PENDING,
                priority: Priority.HIGH,
            };

            const response = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${authToken}`)
                .send(taskData)
                .expect(201);

            expect(response.body.status).toBe('success');
            expect(response.body.data.task).toBeDefined();
            expect(response.body.data.task.title).toBe(taskData.title);
            expect(response.body.data.task.userId).toBe(userId);
        });

        it('should create a task with project if user owns project', async () => {
            const taskData = {
                title: 'Project Task',
                projectId,
            };

            const response = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${authToken}`)
                .send(taskData)
                .expect(201);

            expect(response.body.data.task.projectId).toBe(projectId);
        });

        it('should return 401 if not authenticated', async () => {
            const taskData = {
                title: 'New Task',
            };

            await request(app)
                .post('/api/tasks')
                .send(taskData)
                .expect(401);
        });
    });

    describe('GET /api/tasks', () => {
        it('should get user tasks', async () => {
            const response = await request(app)
                .get('/api/tasks')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.tasks).toBeDefined();
            expect(response.body.data.tasks.length).toBeGreaterThan(0);
        });

        it('should filter tasks by status', async () => {
            const response = await request(app)
                .get('/api/tasks?status=PENDING')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.data.tasks.every((t: any) => t.status === TaskStatus.PENDING)).toBe(true);
        });

        it('should filter tasks by project', async () => {
            const response = await request(app)
                .get(`/api/tasks?projectId=${projectId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.data.tasks.every((t: any) => t.projectId === projectId)).toBe(true);
        });
    });

    describe('GET /api/tasks/:id', () => {
        it('should get task by id if user is owner', async () => {
            const response = await request(app)
                .get(`/api/tasks/${taskId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.task.id).toBe(taskId);
        });

        it('should return 404 if task does not exist', async () => {
            await request(app)
                .get('/api/tasks/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });
    });

    describe('PATCH /api/tasks/:id', () => {
        it('should update task if user is owner', async () => {
            const updateData = {
                title: 'Updated Task',
                status: TaskStatus.IN_PROGRESS,
            };

            const response = await request(app)
                .patch(`/api/tasks/${taskId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.data.task.title).toBe(updateData.title);
            expect(response.body.data.task.status).toBe(updateData.status);
        });

        it('should return 404 if task does not exist', async () => {
            const updateData = {
                title: 'Updated Task',
            };

            await request(app)
                .patch('/api/tasks/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(404);
        });
    });

    describe('DELETE /api/tasks/:id', () => {
        it('should delete task if user is owner', async () => {
            await request(app)
                .delete(`/api/tasks/${taskId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(204);

            // Verify task was deleted
            const task = await prisma.task.findUnique({
                where: { id: taskId },
            });
            expect(task).toBeNull();
        });

        it('should return 404 if task does not exist', async () => {
            await request(app)
                .delete('/api/tasks/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });
    });
});


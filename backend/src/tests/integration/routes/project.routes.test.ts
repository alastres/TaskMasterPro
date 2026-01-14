import request from 'supertest';
import app from '../../../app';
import prisma from '../../../config/db';
import { cleanDatabase } from '../../fixtures/seed';
import bcrypt from 'bcryptjs';
import { signToken } from '../../../utils/jwt';

describe('Project Routes Integration Tests', () => {
    let authToken: string;
    let userId: string;
    let otherUserToken: string;
    let otherUserId: string;

    beforeAll(async () => {
        await cleanDatabase();
    });

    afterAll(async () => {
        await cleanDatabase();
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        await cleanDatabase();

        // Create test users
        const user1 = await prisma.user.create({
            data: {
                name: 'Test User 1',
                nickname: 'TestUser1',
                email: 'user1@example.com',
                password: await bcrypt.hash('password123', 12),
            },
        });

        const user2 = await prisma.user.create({
            data: {
                name: 'Test User 2',
                nickname: 'TestUser2',
                email: 'user2@example.com',
                password: await bcrypt.hash('password123', 12),
            },
        });

        userId = user1.id;
        otherUserId = user2.id;
        authToken = signToken(userId);
        otherUserToken = signToken(otherUserId);
    });

    describe('POST /api/projects', () => {
        it('should create a project successfully', async () => {
            const projectData = {
                name: 'New Project',
                description: 'Project description',
            };

            const response = await request(app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${authToken}`)
                .send(projectData)
                .expect(201);

            expect(response.body.status).toBe('success');
            expect(response.body.data.project).toBeDefined();
            expect(response.body.data.project.name).toBe(projectData.name);
            expect(response.body.data.project.description).toBe(projectData.description);
            expect(response.body.data.project.userId).toBe(userId);

            // Verify project was created in database
            const project = await prisma.project.findUnique({
                where: { id: response.body.data.project.id },
            });
            expect(project).toBeDefined();
            expect(project?.name).toBe(projectData.name);
        });

        it('should link project to user team if team exists', async () => {
            // Create team for user
            const team = await prisma.team.create({
                data: {
                    name: 'Test Team',
                    ownerId: userId,
                },
            });

            const projectData = {
                name: 'Team Project',
            };

            const response = await request(app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${authToken}`)
                .send(projectData)
                .expect(201);

            expect(response.body.data.project.teamId).toBe(team.id);
        });

        it('should return 401 if not authenticated', async () => {
            const projectData = {
                name: 'New Project',
            };

            const response = await request(app)
                .post('/api/projects')
                .send(projectData)
                .expect(401);

            expect(response.body.status).toBe('fail');
        });

        it('should return 400 if validation fails - missing name', async () => {
            const projectData = {
                description: 'Project description',
            };

            const response = await request(app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${authToken}`)
                .send(projectData)
                .expect(400);

            expect(response.body.status).toBe('fail');
        });
    });

    describe('GET /api/projects', () => {
        it('should get user projects', async () => {
            // Create projects for user
            await prisma.project.create({
                data: {
                    name: 'Project 1',
                    userId,
                },
            });

            await prisma.project.create({
                data: {
                    name: 'Project 2',
                    userId,
                },
            });

            const response = await request(app)
                .get('/api/projects')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.results).toBe(2);
            expect(response.body.data.projects).toHaveLength(2);
        });

        it('should return empty array if user has no projects', async () => {
            const response = await request(app)
                .get('/api/projects')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.results).toBe(0);
            expect(response.body.data.projects).toHaveLength(0);
        });

        it('should return 401 if not authenticated', async () => {
            const response = await request(app)
                .get('/api/projects')
                .expect(401);

            expect(response.body.status).toBe('fail');
        });
    });

    describe('GET /api/projects/:id', () => {
        it('should get project by id if user is owner', async () => {
            const project = await prisma.project.create({
                data: {
                    name: 'Test Project',
                    description: 'Test description',
                    userId,
                },
            });

            const response = await request(app)
                .get(`/api/projects/${project.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.project.id).toBe(project.id);
            expect(response.body.data.project.name).toBe(project.name);
            expect(response.body.data.project.isOwner).toBe(true);
        });

        it('should return 404 if project does not exist', async () => {
            const response = await request(app)
                .get('/api/projects/nonexistent-id')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);

            expect(response.body.status).toBe('fail');
            expect(response.body.message).toContain('not found');
        });

        it('should return 403 if user is not owner or member', async () => {
            const project = await prisma.project.create({
                data: {
                    name: 'Other Project',
                    userId: otherUserId,
                },
            });

            const response = await request(app)
                .get(`/api/projects/${project.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(403);

            expect(response.body.status).toBe('fail');
        });
    });

    describe('PUT /api/projects/:id', () => {
        it('should update project if user is owner', async () => {
            const project = await prisma.project.create({
                data: {
                    name: 'Original Project',
                    userId,
                },
            });

            const updateData = {
                name: 'Updated Project',
                description: 'Updated description',
            };

            const response = await request(app)
                .put(`/api/projects/${project.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.project.name).toBe(updateData.name);
            expect(response.body.data.project.description).toBe(updateData.description);
        });

        it('should return 404 if project does not exist', async () => {
            const updateData = {
                name: 'Updated Project',
            };

            const response = await request(app)
                .put('/api/projects/nonexistent-id')
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(404);

            expect(response.body.status).toBe('fail');
        });

        it('should return 403 if user is not owner', async () => {
            const project = await prisma.project.create({
                data: {
                    name: 'Other Project',
                    userId: otherUserId,
                },
            });

            const updateData = {
                name: 'Updated Project',
            };

            const response = await request(app)
                .put(`/api/projects/${project.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(403);

            expect(response.body.status).toBe('fail');
            expect(response.body.message).toContain('Only the project owner');
        });
    });

    describe('DELETE /api/projects/:id', () => {
        it('should delete project if user is owner', async () => {
            const project = await prisma.project.create({
                data: {
                    name: 'Project to Delete',
                    userId,
                },
            });

            // Create a task for the project
            await prisma.task.create({
                data: {
                    title: 'Task in project',
                    userId,
                    projectId: project.id,
                },
            });

            const response = await request(app)
                .delete(`/api/projects/${project.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(204);

            // Verify project was deleted
            const deletedProject = await prisma.project.findUnique({
                where: { id: project.id },
            });
            expect(deletedProject).toBeNull();

            // Verify tasks were also deleted (cascade)
            const tasks = await prisma.task.findMany({
                where: { projectId: project.id },
            });
            expect(tasks).toHaveLength(0);
        });

        it('should return 404 if project does not exist', async () => {
            const response = await request(app)
                .delete('/api/projects/nonexistent-id')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);

            expect(response.body.status).toBe('fail');
        });

        it('should return 403 if user is not owner', async () => {
            const project = await prisma.project.create({
                data: {
                    name: 'Other Project',
                    userId: otherUserId,
                },
            });

            const response = await request(app)
                .delete(`/api/projects/${project.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(403);

            expect(response.body.status).toBe('fail');
            expect(response.body.message).toContain('Only the project owner');
        });
    });
});


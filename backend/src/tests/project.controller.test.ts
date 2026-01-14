import request from 'supertest';
import app from '../app';
import prisma from '../config/db';
import { signToken } from '../utils/jwt';

describe('Project Controller', () => {
    let user: any;
    let token: string;

    beforeAll(async () => {
        // Cleanup
        await prisma.task.deleteMany();
        await prisma.projectMember.deleteMany();
        await prisma.project.deleteMany();
        await prisma.user.deleteMany();

        user = await prisma.user.create({
            data: {
                email: 'projectControllerUser@test.com',
                password: 'password123',
                name: 'Project User',
                nickname: 'projuser',
            }
        });
        token = signToken(user.id);
    });

    describe('POST /api/projects', () => {
        it('should create a project', async () => {
            const res = await request(app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'New Project',
                    description: 'Test Description'
                });

            expect(res.status).toBe(201);
            expect(res.body.data.project.name).toBe('New Project');
        });
    });

    describe('GET /api/projects', () => {
        it('should return a list of projects', async () => {
            const res = await request(app)
                .get('/api/projects')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data.projects)).toBe(true);
            expect(res.body.data.projects.length).toBeGreaterThan(0);
        });
    });

    describe('GET /api/projects/:id', () => {
        it('should return project details', async () => {
            // First create a project to get ID
            const createRes = await request(app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Detail Project' });

            const projectId = createRes.body.data.project.id;

            const res = await request(app)
                .get(`/api/projects/${projectId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data.project.id).toBe(projectId);
        });

        it('should return 404 for non-existent project', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';
            const res = await request(app)
                .get(`/api/projects/${fakeId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(404);
        });
    });
});

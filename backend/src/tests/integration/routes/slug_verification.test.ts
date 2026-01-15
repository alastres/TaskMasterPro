
import request from 'supertest';
import app from '../../../app';
import prisma from '../../../config/db';
import { cleanDatabase } from '../../fixtures/seed';
import { signToken } from '../../../utils/jwt';
import bcrypt from 'bcryptjs';

describe('Project Slugs Integration Tests', () => {
    let authToken: string;
    let userId: string;

    beforeAll(async () => {
        await cleanDatabase();
    });

    afterAll(async () => {
        await cleanDatabase();
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        await cleanDatabase();

        const user = await prisma.user.create({
            data: {
                name: 'Slug Test User',
                nickname: 'sluguser',
                email: 'slug@example.com',
                password: await bcrypt.hash('password123', 12),
            },
        });

        userId = user.id;
        authToken = signToken(userId);
    });

    it('should generate a slug when creating a project', async () => {
        const projectData = {
            name: 'My Cool Project',
            description: 'Testing slugs',
        };

        const response = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${authToken}`)
            .send(projectData)
            .expect(201);

        expect(response.body.status).toBe('success');
        expect(response.body.data.project.slug).toBeDefined();
        // slug should be "my-cool-project" or similar
        expect(response.body.data.project.slug).toMatch(/^my-cool-project/);
    });

    it('should retrieve a project by its slug', async () => {
        // Create project first
        const createRes = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ name: 'Retrieve Me' });

        const slug = createRes.body.data.project.slug;
        const id = createRes.body.data.project.id;

        // Get by Slug
        const response = await request(app)
            .get(`/api/projects/${slug}`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(response.body.data.project.id).toBe(id);
        expect(response.body.data.project.slug).toBe(slug);
    });

    it('should handle duplicate names by unique slugs', async () => {
        // Create first project
        await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ name: 'Duplicate Name' })
            .expect(201);

        // Create second project with same name
        const response = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ name: 'Duplicate Name' })
            .expect(201);

        const slug2 = response.body.data.project.slug;
        expect(slug2).not.toBe('duplicate-name'); // Should have suffix
        expect(slug2).toMatch(/^duplicate-name-/);
    });
});

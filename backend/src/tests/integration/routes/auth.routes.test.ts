import request from 'supertest';
import app from '../../../app';
import prisma from '../../../config/db';
import { cleanDatabase, seedDatabase } from '../../fixtures/seed';
import bcrypt from 'bcryptjs';

describe('Auth Routes Integration Tests', () => {
    beforeAll(async () => {
        await cleanDatabase();
    });

    afterAll(async () => {
        await cleanDatabase();
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        await cleanDatabase();
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const userData = {
                name: 'New User',
                nickname: 'NewUser',
                email: 'newuser@example.com',
                password: 'password123',
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            expect(response.body.status).toBe('success');
            expect(response.body.token).toBeDefined();
            expect(response.body.data.user).toBeDefined();
            expect(response.body.data.user.email).toBe(userData.email);
            expect(response.body.data.user.name).toBe(userData.name);
            expect(response.body.data.user).not.toHaveProperty('password');

            // Verify user was created in database
            const user = await prisma.user.findUnique({
                where: { email: userData.email },
            });
            expect(user).toBeDefined();
            expect(user?.name).toBe(userData.name);
            expect(user?.password).not.toBe(userData.password); // Should be hashed
        });

        it('should return 400 if email already exists', async () => {
            const userData = {
                name: 'Test User',
                email: 'existing@example.com',
                password: 'password123',
            };

            // Create user first
            await prisma.user.create({
                data: {
                    ...userData,
                    password: await bcrypt.hash(userData.password, 12),
                    nickname: 'TestUser',
                },
            });

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body.status).toBe('fail');
            expect(response.body.message).toContain('Email already in use');
        });

        it('should return 400 if validation fails - invalid email', async () => {
            const userData = {
                name: 'Test User',
                email: 'invalid-email',
                password: 'password123',
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body.status).toBe('fail');
        });

        it('should return 400 if validation fails - short password', async () => {
            const userData = {
                name: 'Test User',
                email: 'test@example.com',
                password: '123',
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body.status).toBe('fail');
        });

        it('should return 400 if validation fails - short name', async () => {
            const userData = {
                name: 'A',
                email: 'test@example.com',
                password: 'password123',
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body.status).toBe('fail');
        });

        it('should use default nickname if not provided', async () => {
            const userData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            expect(response.body.data.user.nickname).toBe('User');
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            // Create a test user for login tests
            await prisma.user.create({
                data: {
                    name: 'Test User',
                    nickname: 'TestUser',
                    email: 'login@example.com',
                    password: await bcrypt.hash('password123', 12),
                },
            });
        });

        it('should login user with correct credentials', async () => {
            const loginData = {
                email: 'login@example.com',
                password: 'password123',
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.token).toBeDefined();
            expect(response.body.data.user).toBeDefined();
            expect(response.body.data.user.email).toBe(loginData.email);
            expect(response.body.data.user).not.toHaveProperty('password');
        });

        it('should return 401 if email does not exist', async () => {
            const loginData = {
                email: 'nonexistent@example.com',
                password: 'password123',
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(401);

            expect(response.body.status).toBe('fail');
            expect(response.body.message).toContain('Incorrect email or password');
        });

        it('should return 401 if password is incorrect', async () => {
            const loginData = {
                email: 'login@example.com',
                password: 'wrongpassword',
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(401);

            expect(response.body.status).toBe('fail');
            expect(response.body.message).toContain('Incorrect email or password');
        });

        it('should return 400 if validation fails - invalid email', async () => {
            const loginData = {
                email: 'invalid-email',
                password: 'password123',
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(400);

            expect(response.body.status).toBe('fail');
        });

        it('should return 400 if password is missing', async () => {
            const loginData = {
                email: 'login@example.com',
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(400);

            expect(response.body.status).toBe('fail');
        });
    });
});


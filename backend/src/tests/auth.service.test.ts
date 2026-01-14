import { registerUser, loginUser } from '../services/auth.service';
import prisma from '../config/db';
import bcrypt from 'bcryptjs';
import { AppError } from '../utils/AppError';

describe('Auth Service', () => {
    beforeEach(async () => {
        await prisma.task.deleteMany();
        await prisma.projectMember.deleteMany();
        await prisma.project.deleteMany();
        await prisma.user.deleteMany();
    });

    describe('registerUser', () => {
        it('should register a new user successfully', async () => {
            const input = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                nickname: 'tester',
            };

            const result = await registerUser(input);

            expect(result).toHaveProperty('token');
            expect(result.user).toHaveProperty('id');
            expect(result.user.email).toBe(input.email);
            expect(result.user).not.toHaveProperty('password');

            const dbUser = await prisma.user.findUnique({ where: { email: input.email } });
            expect(dbUser).toBeDefined();
            expect(await bcrypt.compare(input.password, dbUser!.password)).toBe(true);
        });

        it('should throw an error if email is already in use', async () => {
            const input = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
            };

            await registerUser(input);

            await expect(registerUser(input)).rejects.toThrow(AppError);
            await expect(registerUser(input)).rejects.toThrow('Email already in use');
        });
    });

    describe('loginUser', () => {
        it('should login a user successfully', async () => {
            const input = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
            };

            await registerUser(input);

            const result = await loginUser({ email: input.email, password: input.password });

            expect(result).toHaveProperty('token');
            expect(result.user.email).toBe(input.email);
        });

        it('should throw an error for incorrect password', async () => {
            const input = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
            };

            await registerUser(input);

            await expect(loginUser({ email: input.email, password: 'wrongpassword' })).rejects.toThrow(AppError);
            await expect(loginUser({ email: input.email, password: 'wrongpassword' })).rejects.toThrow('Incorrect email or password');
        });

        it('should throw an error for non-existent user', async () => {
            await expect(loginUser({ email: 'nonexistent@example.com', password: 'password123' })).rejects.toThrow(AppError);
        });
    });
});

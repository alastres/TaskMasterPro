import request from 'supertest';
import app from '../app';
import prisma from '../config/db';
import { signToken } from '../utils/jwt';

console.log('DEBUG: Security test file execution started');

describe('Security Vulnerability Tests', () => {
  let userA: any;
  let userB: any;
  let tokenA: string;
  let tokenB: string;
  let projectA: any;
  let taskA: any;

  beforeAll(async () => {
    console.log('Starting beforeAll cleanup...');
    try {
      await prisma.task.deleteMany();
      await prisma.projectMember.deleteMany();
      await prisma.invitation.deleteMany();
      await prisma.project.deleteMany();
      await prisma.user.deleteMany();
      console.log('Cleanup completed');

      userA = await prisma.user.create({
        data: {
          email: 'userA@test.com',
          password: 'password123',
          name: 'User A',
          nickname: 'usera',
        },
      });

      userB = await prisma.user.create({
        data: {
          email: 'userB@test.com',
          password: 'password123',
          name: 'User B',
          nickname: 'userb',
        },
      });

      tokenA = signToken(userA.id);
      tokenB = signToken(userB.id);

      projectA = await prisma.project.create({
        data: {
          name: 'Project A',
          userId: userA.id,
        },
      });

      taskA = await prisma.task.create({
        data: {
          title: 'Task A',
          userId: userA.id,
          projectId: projectA.id,
        },
      });
    } catch (e) {
      console.error('Setup failed:', e);
      throw e;
    }
  });

  describe('Authentication', () => {
    it('should return 401 if no token is provided', async () => {
      const res = await request(app).get('/api/tasks');
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/not logged in/i);
    });

    it('should return 401 for an invalid token', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/invalid token/i);
    });
  });

  describe('Authorization (IDOR)', () => {
    it('User B should not be able to access User A\'s project', async () => {
      const res = await request(app)
        .get(`/api/projects/${projectA.id}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/not authorized/i);
    });

    it('User B should not be able to update User A\'s task', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${taskA.id}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ title: 'Hacked Title' });
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/no tienes permiso/i);
    });

    it('User B should not be able to delete User A\'s project', async () => {
      const res = await request(app)
        .delete(`/api/projects/${projectA.id}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/only the project owner can delete/i);
    });
  });

  describe('Input Validation', () => {
    it('should return 400 for invalid task priority', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'New Task',
          priority: 'INVALID_PRIORITY',
        });
      expect(res.status).toBe(400);
    });

    it('should return 400 for missing required fields on task creation', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ description: 'No title here' });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/(Required|title is required)/i);
    });
  });

  describe('Security Headers', () => {
    it('should have security headers from Helmet', async () => {
      const res = await request(app).get('/');
      expect(res.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(res.headers).toHaveProperty('content-security-policy');
    });
  });
});

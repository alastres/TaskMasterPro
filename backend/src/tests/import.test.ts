import request from 'supertest';
import app from '../app';
import prisma from '../config/db';
import { signToken } from '../utils/jwt';

console.log('Imports successful');

describe('Import Test', () => {
    it('should have app defined', () => {
        expect(app).toBeDefined();
    });
    it('should have prisma defined', () => {
        expect(prisma).toBeDefined();
    });
});

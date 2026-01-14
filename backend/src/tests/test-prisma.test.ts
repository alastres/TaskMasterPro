import prisma from '../config/db';

describe('Prisma Import', () => {
    it('should import prisma', () => {
        expect(prisma).toBeDefined();
    });
});

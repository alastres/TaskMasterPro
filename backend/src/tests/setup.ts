import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load test environment variables
// Try .env.test first, fallback to .env if it doesn't exist
const testEnvPath = path.resolve(__dirname, '../../.env.test');
const defaultEnvPath = path.resolve(__dirname, '../../.env');

if (fs.existsSync(testEnvPath)) {
    dotenv.config({ path: testEnvPath });
} else {
    // Fallback to default .env if .env.test doesn't exist
    dotenv.config({ path: defaultEnvPath });
    console.warn('⚠️  .env.test not found, using .env instead. Consider creating a separate test database.');
}

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9)),
}));

import prisma from '../config/db';

// Set test timeout
jest.setTimeout(10000);

beforeAll(async () => {
    // Connect to the database before tests
    await prisma.$connect();
});

afterAll(async () => {
    // Disconnect after all tests are done
    await prisma.$disconnect();
});

// Clean database between tests (for integration tests)
beforeEach(async () => {
    // Only clean if we're in integration test mode
    // This can be controlled via environment variable or test file location
    if (process.env.CLEAN_DB_BETWEEN_TESTS === 'true') {
        await prisma.notification.deleteMany();
        await prisma.task.deleteMany();
        await prisma.projectMember.deleteMany();
        await prisma.invitation.deleteMany();
        await prisma.project.deleteMany();
        await prisma.teamMember.deleteMany();
        await prisma.team.deleteMany();
        await prisma.user.deleteMany();
    }
});

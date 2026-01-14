import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createTestUser(overrides: Partial<{ email: string; password: string; name: string; nickname: string }> = {}) {
    const count = await prisma.user.count();

    const user = await prisma.user.create({
        data: {
            email: overrides.email ?? `user${count + 1}@test.com`,
            password: overrides.password ?? 'Password123!',
            name: overrides.name ?? `Test User ${count + 1}`,
            nickname: overrides.nickname ?? `user${count + 1}`,
        },
    });

    return user;
}

export async function createTestProject(userId: string, overrides: Partial<{ name: string }> = {}) {
    const count = await prisma.project.count();

    const project = await prisma.project.create({
        data: {
            name: overrides.name ?? `Project ${count + 1}`,
            userId,
        },
    });

    return project;
}

export async function createTestTask(
    userId: string,
    projectId: string,
    overrides: Partial<{ title: string; description: string }> = {},
) {
    const count = await prisma.task.count();

    const task = await prisma.task.create({
        data: {
            title: overrides.title ?? `Task ${count + 1}`,
            description: overrides.description ?? 'Test task description',
            userId,
            projectId,
        },
    });

    return task;
}

import { User, Project, Task, Team, TeamMember, Notification, Priority, TaskStatus, NotificationType } from '@prisma/client';

export const createUserData = (overrides?: Partial<User>) => ({
    email: `user${Date.now()}@test.com`,
    password: 'password123',
    name: 'Test User',
    nickname: 'TestUser',
    thresholdMedium: 72,
    thresholdHigh: 24,
    ...overrides,
});

export const createProjectData = (userId: string, overrides?: Partial<Project>) => ({
    name: `Test Project ${Date.now()}`,
    description: 'Test project description',
    userId,
    ...overrides,
});

export const createTaskData = (userId: string, overrides?: Partial<Task>) => ({
    title: `Test Task ${Date.now()}`,
    description: 'Test task description',
    status: TaskStatus.PENDING,
    priority: Priority.MEDIUM,
    userId,
    tags: [],
    ...overrides,
});

export const createTeamData = (ownerId: string, overrides?: Partial<Team>) => ({
    name: `Test Team ${Date.now()}`,
    ownerId,
    ...overrides,
});

export const createTeamMemberData = (teamId: string, userId: string, overrides?: Partial<TeamMember>) => ({
    teamId,
    userId,
    ...overrides,
});

export const createNotificationData = (userId: string, overrides?: Partial<Notification>) => ({
    userId,
    type: NotificationType.INVITATION,
    title: 'Test Notification',
    message: 'This is a test notification',
    isRead: false,
    ...overrides,
});

// Invalid data factories for negative testing
export const createInvalidUserData = () => ({
    email: 'invalid-email',
    password: '123', // Too short
    name: 'A', // Too short
});

export const createInvalidTaskData = () => ({
    title: '', // Empty
    status: 'INVALID_STATUS' as TaskStatus,
    priority: 'INVALID_PRIORITY' as Priority,
});


import prisma from '../../config/db';
import { createUserData, createProjectData, createTaskData, createTeamData } from './factories';

export const seedDatabase = async () => {
    // Clean database
    await prisma.notification.deleteMany();
    await prisma.task.deleteMany();
    await prisma.projectMember.deleteMany();
    await prisma.invitation.deleteMany();
    await prisma.project.deleteMany();
    await prisma.teamMember.deleteMany();
    await prisma.team.deleteMany();
    await prisma.user.deleteMany();

    // Create test users
    const user1 = await prisma.user.create({
        data: createUserData({
            email: 'test1@example.com',
            name: 'Test User 1',
            nickname: 'TestUser1',
        }),
    });

    const user2 = await prisma.user.create({
        data: createUserData({
            email: 'test2@example.com',
            name: 'Test User 2',
            nickname: 'TestUser2',
        }),
    });

    // Create team for user1
    const team = await prisma.team.create({
        data: createTeamData(user1.id, { name: 'Test Team' }),
    });

    // Create project for user1
    const project = await prisma.project.create({
        data: createProjectData(user1.id, {
            name: 'Test Project',
            description: 'Test project description',
            teamId: team.id,
        }),
    });

    // Create task for user1
    const task = await prisma.task.create({
        data: createTaskData(user1.id, {
            title: 'Test Task',
            description: 'Test task description',
            projectId: project.id,
        }),
    });

    return {
        user1,
        user2,
        team,
        project,
        task,
    };
};

export const cleanDatabase = async () => {
    await prisma.notification.deleteMany();
    await prisma.task.deleteMany();
    await prisma.projectMember.deleteMany();
    await prisma.invitation.deleteMany();
    await prisma.project.deleteMany();
    await prisma.teamMember.deleteMany();
    await prisma.team.deleteMany();
    await prisma.user.deleteMany();
};


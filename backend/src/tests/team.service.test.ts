import { getOrCreateUserTeam } from '../services/team.service';
import prisma from '../config/db';

describe('Team Service', () => {
    let testUser: any;

    beforeAll(async () => {
        // Create a test user
        testUser = await prisma.user.create({
            data: {
                email: 'teamtest@example.com',
                password: 'password123',
                name: 'Team Test User',
                nickname: 'teamtest'
            }
        });
    });

    afterAll(async () => {
        await prisma.task.deleteMany({});
        await prisma.project.deleteMany({ where: { userId: testUser.id } });
        await prisma.team.deleteMany({ where: { ownerId: testUser.id } });
        await prisma.user.delete({ where: { id: testUser.id } });
        await prisma.$disconnect();
    });

    it('should link orphaned projects to the user team on fetch', async () => {
        // 1. Create a project without a team (orphaned)
        const project = await prisma.project.create({
            data: {
                name: 'Orphaned Project',
                userId: testUser.id,
                teamId: null
            }
        });

        expect(project.teamId).toBeNull();

        // 2. Call getOrCreateUserTeam
        const team = await getOrCreateUserTeam(testUser.id);

        expect(team).toBeDefined();
        if (!team) return;

        // 3. Verify the project is now linked to the team
        const updatedProject = await prisma.project.findUnique({
            where: { id: project.id }
        });

        expect(updatedProject?.teamId).toBe(team.id);

        // 4. Verify the team object returns the project
        const teamProjects = (team as any).projects;
        expect(teamProjects).toBeDefined();
        expect(teamProjects.length).toBeGreaterThanOrEqual(1);
        expect(teamProjects[0].id).toBe(project.id);
    });
});

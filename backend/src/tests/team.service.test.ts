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

    it('should prevent sending duplicate pending invitations', async () => {
        // 1. Create a user to invite with unique email
        const uniqueEmail = `invitee_${Date.now()}@test.com`;
        const invitee = await prisma.user.create({
            data: { email: uniqueEmail, password: 'pw', name: 'Invitee', nickname: 'inv' }
        });

        // 2. Create a team for testUser (if not exists from previous test, but we cleared it, so create again or use getOrCreate)
        // Actually getOrCreateUserTeam in previous test created it. But we should check if we can reuse or need new.
        // It's safer to create a fresh team or rely on getOrCreate.
        const team = await getOrCreateUserTeam(testUser.id);
        if (!team) throw new Error('Team setup failed');

        // 3. Send first invitation
        const { inviteMember } = require('../services/team.service'); // Dynamically Import to ensure we get latest
        await inviteMember(team.id, invitee.email, testUser.id);

        // 4. Try sending again -> should fail
        await expect(inviteMember(team.id, invitee.email, testUser.id))
            .rejects
            .toThrow('Ya existe una invitación pendiente para este usuario');

        // Cleanup
        await prisma.invitation.deleteMany({ where: { email: invitee.email } });
        await prisma.notification.deleteMany({ where: { userId: invitee.id } });
        await prisma.user.delete({ where: { id: invitee.id } });
    });
});

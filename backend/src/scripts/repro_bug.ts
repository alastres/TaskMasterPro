
import { PrismaClient, NotificationType, InvitationStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Starting Reproduction Script ---');

    // 1. Create Users
    const email1 = `inviter_${Date.now()}@test.com`;
    const email2 = `invitee_${Date.now()}@test.com`;

    const inviter = await prisma.user.create({
        data: {
            email: email1,
            password: 'password123',
            name: 'Inviter User'
        }
    });

    const invitee = await prisma.user.create({
        data: {
            email: email2,
            password: 'password123',
            name: 'Invitee User'
        }
    });

    // 2. Create Team for Inviter (needed for project)
    const team = await prisma.team.create({
        data: {
            name: `Team ${inviter.name}`,
            ownerId: inviter.id
        }
    });

    // 3. Create Project
    const project = await prisma.project.create({
        data: {
            name: 'Project to Delete',
            description: 'Testing deletion bug',
            userId: inviter.id,
            teamId: team.id
        }
    });

    console.log(`Created Project: ${project.id}`);

    // 4. Create Invitation
    const token = uuidv4();
    const invitation = await prisma.invitation.create({
        data: {
            email: invitee.email,
            teamId: team.id,
            projectId: project.id,
            inviterId: inviter.id,
            token,
            status: InvitationStatus.PENDING
        }
    });

    // 5. Create Notification (simulating the service logic)
    const notification = await prisma.notification.create({
        data: {
            userId: invitee.id,
            type: NotificationType.INVITATION,
            title: `Invitación a proyecto: ${project.name}`,
            message: `Te invitaron a colaborar`,
            link: '/notifications',
            data: { invitationId: invitation.id, teamId: team.id, projectId: project.id }
        }
    });

    console.log(`Created Invitation: ${invitation.id} with ProjectId: ${invitation.projectId}`);
    console.log(`Created Notification: ${notification.id}`);

    // 6. Delete Project (Simulating the NEW controller logic)
    console.log('Deleting Project with Fix...');

    // Find invitations first
    const invitations = await prisma.invitation.findMany({
        where: { projectId: project.id }
    });
    const invitationIds = invitations.map(inv => inv.id);

    // Delete associated notifications
    for (const invId of invitationIds) {
        await prisma.notification.deleteMany({
            where: {
                data: {
                    path: ['invitationId'],
                    equals: invId
                }
            }
        });
    }

    // Delete invitations
    await prisma.invitation.deleteMany({
        where: { projectId: project.id }
    });

    // Delete tasks and project
    await prisma.task.deleteMany({ where: { projectId: project.id } });
    await prisma.project.delete({ where: { id: project.id } });
    console.log('Project Deleted.');

    // 7. Verify State
    const deletedProject = await prisma.project.findUnique({ where: { id: project.id } });

    const foundInvitation = await prisma.invitation.findUnique({ where: { id: invitation.id } });

    const foundNotification = await prisma.notification.findUnique({ where: { id: notification.id } });

    const result = {
        projectDeleted: !deletedProject,
        invitationExists: !!foundInvitation,
        invitationProjectId: foundInvitation?.projectId,
        notificationExists: !!foundNotification
    };

    console.log(JSON.stringify(result, null, 2));

    const fs = require('fs');
    fs.writeFileSync('repro_result.json', JSON.stringify(result, null, 2));

    // Cleanup
    if (foundInvitation) await prisma.invitation.delete({ where: { id: invitation.id } });
    if (foundNotification) await prisma.notification.delete({ where: { id: notification.id } });
    await prisma.team.delete({ where: { id: team.id } });
    await prisma.user.delete({ where: { id: inviter.id } });
    await prisma.user.delete({ where: { id: invitee.id } });

    await prisma.$disconnect();
}

main().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});

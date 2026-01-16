
import { PrismaClient } from '@prisma/client';
import { inviteMember } from './src/services/team.service';

const prisma = new PrismaClient();

async function verifySelfInvitation() {
    console.log('Verifying Self-Invitation Prevention...');

    try {
        // 1. Get a user
        const user = await prisma.user.findFirst();
        if (!user) {
            console.error('No user found');
            return;
        }

        // 2. Get a team owned by this user (or create one)
        let team = await prisma.team.findFirst({
            where: { ownerId: user.id }
        });

        if (!team) {
            console.log('Creating temp team...');
            team = await prisma.team.create({
                data: {
                    name: 'Temp Verification Team',
                    ownerId: user.id
                }
            });
        }

        // 3. Try to invite THEMSELVES
        console.log(`Attempting to invite owner ${user.email} to team ${team.id}...`);
        try {
            await inviteMember(team.id, user.email, user.id);
            console.error('FAILED: Invitation erroneously succeeded!');
        } catch (error: any) {
            if (error.message === 'No puedes invitarte a ti mismo') {
                console.log('PASSED: Caught expected error: "No puedes invitarte a ti mismo"');
            } else {
                console.error('FAILED: Caught unexpected error:', error.message);
            }
        }

    } catch (e) {
        console.error('Script error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

verifySelfInvitation();


import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Connecting to DB...');
    try {
        await prisma.$connect();
        console.log('Connected.');

        console.log('Deleting projects...');
        await prisma.project.deleteMany();

        console.log('Creating user...');
        const user = await prisma.user.create({
            data: {
                email: 'testscripte@example.com',
                password: 'password',
                name: 'Test Script',
                nickname: 'testscript'
            }
        });
        console.log('User created:', user.id);

        console.log('Creating project with slug...');
        const project = await prisma.project.create({
            data: {
                name: 'Test Project',
                slug: 'test-project-12345',
                userId: user.id
            }
        });
        console.log('Project created:', project);

        console.log('Cleaning up...');
        await prisma.project.delete({ where: { id: project.id } });
        await prisma.user.delete({ where: { id: user.id } });
        console.log('Done.');

    } catch (e) {
        console.error('ERROR:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();

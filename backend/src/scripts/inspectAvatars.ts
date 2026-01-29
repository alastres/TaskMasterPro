import prisma from '../config/db';
import fs from 'fs';

async function main() {
    try {
        const users = await prisma.user.findMany({
            where: {
                avatarUrl: {
                    not: null
                }
            },
            select: {
                id: true,
                avatarUrl: true
            }
        });

        const results = users.map(u => {
            const url = u.avatarUrl || '';
            const filename = url.split('/').pop();
            return {
                id: u.id,
                url,
                extractedFilename: filename,
                hasQuery: url.includes('?'),
                hasBackslash: url.includes('\\')
            };
        });

        fs.writeFileSync('inspect_result.json', JSON.stringify(results, null, 2));
        console.log('Results written to inspect_result.json');

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();

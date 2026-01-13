import { cleanOrphanedAvatars } from '../utils/cleanupFiles';

/**
 * Script to manually clean orphaned avatar files
 * Run with: npx ts-node src/scripts/cleanupOrphanedFiles.ts
 */
async function main() {
    console.log('Starting orphaned files cleanup...\n');

    try {
        const result = await cleanOrphanedAvatars();

        console.log('\n=== Cleanup Complete ===');
        console.log(`Total files removed: ${result.removed}`);
        console.log(`Total files kept: ${result.kept}`);

        if (result.errors.length > 0) {
            console.log('\nErrors encountered:');
            result.errors.forEach(err => console.log(`  - ${err}`));
        }

        process.exit(0);
    } catch (error) {
        console.error('Fatal error during cleanup:', error);
        process.exit(1);
    }
}

main();

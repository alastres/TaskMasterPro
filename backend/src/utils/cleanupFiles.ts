import fs from 'fs';
import path from 'path';
import prisma from '../config/db';

/**
 * Clean orphaned avatar files
 * Removes avatar files from the uploads/avatars directory that are not referenced in the database
 */
export async function cleanOrphanedAvatars(): Promise<{ removed: number; kept: number; errors: string[] }> {
    const avatarsDir = path.join(__dirname, '../../uploads/avatars');
    const errors: string[] = [];
    let removed = 0;
    let kept = 0;

    try {
        // Get all users with avatarUrl from database
        const users = await prisma.user.findMany({
            select: {
                avatarUrl: true,
            },
        });


        console.log(`Found ${users.length} users with defined avatarUrl in database`);

        if (users.length === 0) {
            console.log('No users with avatars found in DB. Aborting cleanup for safety to prevent accidental total deletion.');
            return { removed: 0, kept: 0, errors: [] };
        }

        // Extract filenames from avatarUrls
        const usedFilenames = new Set<string>();
        users.forEach(user => {
            if (user.avatarUrl) {
                try {
                    // Try to parse as URL first to handle query params and hashes correctly
                    // We handle both absolute URLs and relative paths
                    let filename: string | undefined;

                    // Normalize backslashes to forward slashes just in case
                    const normalizedUrl = user.avatarUrl.replace(/\\/g, '/');

                    if (normalizedUrl.startsWith('http') || normalizedUrl.startsWith('/')) {
                        // Remove query strings and hash
                        const cleanUrl = normalizedUrl.split(/[?#]/)[0];
                        filename = cleanUrl.split('/').pop();
                    } else {
                        // Fallback for just filenames
                        filename = normalizedUrl;
                    }

                    if (filename) {
                        usedFilenames.add(filename);
                        // Also add decoded version (e.g., 'foo%20bar.png' -> 'foo bar.png')
                        usedFilenames.add(decodeURIComponent(filename));
                    }
                } catch (e) {
                    console.warn(`Failed to parse avatar URL: ${user.avatarUrl}`);
                }
            }
        });

        console.log(`Identified ${usedFilenames.size} unique avatar filenames from database`);

        // Check if avatars directory exists
        if (!fs.existsSync(avatarsDir)) {
            console.log('Avatars directory does not exist. Nothing to clean.');
            return { removed: 0, kept: 0, errors: [] };
        }

        // Read all files in avatars directory
        const files = fs.readdirSync(avatarsDir);
        console.log(`Found ${files.length} file(s) in uploads/avatars directory`);

        // Check each file
        for (const file of files) {
            const filePath = path.join(avatarsDir, file);

            // Skip if not a file
            if (!fs.statSync(filePath).isFile()) {
                continue;
            }

            // Check if file is referenced in database
            if (usedFilenames.has(file)) {
                kept++;
                console.log(`✓ Keeping: ${file} (in use)`);
            } else {
                // File is orphaned, remove it
                try {
                    fs.unlinkSync(filePath);
                    removed++;
                    console.log(`✗ Removed: ${file} (orphaned)`);
                } catch (error) {
                    const errorMsg = `Failed to remove ${file}: ${error}`;
                    errors.push(errorMsg);
                    console.error(errorMsg);
                }
            }
        }

        console.log('\n--- Cleanup Summary ---');
        console.log(`Files kept: ${kept}`);
        console.log(`Files removed: ${removed}`);
        console.log(`Errors: ${errors.length}`);

        return { removed, kept, errors };
    } catch (error) {
        console.error('Error during cleanup:', error);
        throw error;
    }
}

/**
 * Delete a specific avatar file when user updates their avatar
 * @param avatarUrl - The full avatar URL to delete
 */
export async function deleteOldAvatar(avatarUrl: string | null): Promise<void> {
    if (!avatarUrl) return;

    try {
        // Extract filename from URL
        const filename = avatarUrl.split('/').pop();
        if (!filename) return;

        const filePath = path.join(__dirname, '../../uploads/avatars', filename);

        // Check if file exists and delete it
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Deleted old avatar: ${filename}`);
        }
    } catch (error) {
        console.error('Error deleting old avatar:', error);
        // Don't throw - this is a cleanup operation, shouldn't break the main flow
    }
}

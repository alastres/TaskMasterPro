import prisma from '../config/db';
import cloudinary from '../config/cloudinary';

/**
 * Clean orphaned avatar files
 * Checks Cloudinary assets in 'taskmaster-pro/avatars' folder and removes those not referenced in DB
 * Note: Cloudinary Admin API rate limits apply.
 */
export async function cleanOrphanedAvatars(): Promise<{ removed: number; kept: number; errors: string[] }> {
    const errors: string[] = [];
    let removed = 0;
    let kept = 0;

    try {
        console.log('[Cleanup] Starting Cloudinary audit...');

        // 1. Get all avatar URLs from DB
        const users = await prisma.user.findMany({
            where: { avatarUrl: { not: null } },
            select: { avatarUrl: true },
        });

        const activePublicIds = new Set<string>();
        users.forEach(user => {
            if (user.avatarUrl) {
                // Cloudinary URLs look like: .../upload/v1234/folder/public_id.jpg
                // We need to extract 'folder/public_id' (without extension)
                try {
                    const urlParts = user.avatarUrl.split('/');
                    const versionIndex = urlParts.findIndex(part => part.startsWith('v') && !isNaN(Number(part.substring(1))));

                    if (versionIndex !== -1) {
                        // Extract everything after version until extension
                        const pathWithExt = urlParts.slice(versionIndex + 1).join('/');
                        const publicId = pathWithExt.substring(0, pathWithExt.lastIndexOf('.'));
                        if (publicId) activePublicIds.add(publicId);
                    }
                } catch (e) {
                    console.warn(`[Cleanup] Failed to parse URL: ${user.avatarUrl}`);
                }
            }
        });

        console.log(`[Cleanup] Found ${activePublicIds.size} active avatars in DB.`);

        // 2. List assets in Cloudinary folder
        // Note: max_results default is 10, max is 500. For production, needs pagination (next_cursor).
        // Implementation here is simplified for < 500 avatars.
        const result = await cloudinary.api.resources({
            type: 'upload',
            prefix: 'taskmaster-pro/avatars',
            max_results: 500
        });

        const assets = result.resources;
        console.log(`[Cleanup] Found ${assets.length} assets in Cloudinary.`);

        for (const asset of assets) {
            if (activePublicIds.has(asset.public_id)) {
                kept++;
            } else {
                // Orphaned
                console.log(`[Cleanup] Deleting orphaned asset: ${asset.public_id}`);
                try {
                    await cloudinary.uploader.destroy(asset.public_id);
                    removed++;
                } catch (err: any) {
                    const msg = `Failed to delete ${asset.public_id}: ${err.message}`;
                    console.error(msg);
                    errors.push(msg);
                }
            }
        }

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

    // Only attempt to delete if it looks like a Cloudinary URL from our folder
    if (!avatarUrl.includes('cloudinary') || !avatarUrl.includes('taskmaster-pro/avatars')) {
        return;
    }

    try {
        const urlParts = avatarUrl.split('/');
        const versionIndex = urlParts.findIndex(part => part.startsWith('v') && !isNaN(Number(part.substring(1))));
        if (versionIndex !== -1) {
            const pathWithExt = urlParts.slice(versionIndex + 1).join('/');
            const publicId = pathWithExt.substring(0, pathWithExt.lastIndexOf('.'));

            if (publicId) {
                await cloudinary.uploader.destroy(publicId);
                console.log(`[Cleanup] Deleted old avatar: ${publicId}`);
            }
        }
    } catch (error) {
        console.error('[Cleanup] Error deleting old avatar:', error);
    }
}

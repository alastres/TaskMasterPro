import { Request, Response } from 'express';
import { runCleanupTasks } from '../services/cron.service';

export const runCleanup = async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        const expectedSecret = `Bearer ${process.env.CRON_SECRET}`;

        if (!process.env.CRON_SECRET) {
            console.error('CRON_SECRET is not defined in environment variables');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        if (authHeader !== expectedSecret) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        console.log('[Cron] Manual/HTTP trigger received');
        await runCleanupTasks();

        return res.status(200).json({ success: true, message: 'Cleanup tasks executed successfully' });
    } catch (error) {
        console.error('[Cron] Error executing cleanup:', error);
        return res.status(500).json({ error: 'Internal server error during cleanup' });
    }
};

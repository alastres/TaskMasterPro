import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import prisma from './config/db';
import { initCronJobs } from './services/cron.service';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await prisma.$connect();
        console.log('✅ Database connected successfully');

        if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
            initCronJobs();
        } else {
            console.log('Skipping local cron initialization (Serverless/Production mode)');
        }

        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Error starting server:', error);
        process.exit(1);
    }
};

startServer();

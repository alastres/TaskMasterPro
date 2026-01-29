import express from 'express';
import * as cronController from '../controllers/cron.controller';

const router = express.Router();

router.post('/cleanup', cronController.runCleanup);

export default router;

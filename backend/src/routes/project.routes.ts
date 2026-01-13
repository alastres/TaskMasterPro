import express from 'express';
import { protect } from '../middlewares/auth.middleware';
import {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject
} from '../controllers/project.controller';
import { validate } from '../middlewares/validate.middleware';
import { z } from 'zod';

const router = express.Router();

export const createProjectSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required'),
        description: z.string().optional(),
    }),
});

export const updateProjectSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required').optional(),
        description: z.string().optional(),
    }),
});

router.use(protect);

router.post('/', validate(createProjectSchema), createProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.put('/:id', validate(updateProjectSchema), updateProject);
router.delete('/:id', deleteProject);

export default router;

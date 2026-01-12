import express from 'express';
import { validate } from '../middlewares/validate.middleware';
import { protect } from '../middlewares/auth.middleware';
import {
    createTask,
    getAllTasks,
    getTask,
    updateTask,
    deleteTask,
    createTaskSchema,
    updateTaskSchema,
} from '../controllers/task.controller';

const router = express.Router();

router.use(protect); // Protect all routes

router
    .route('/')
    .get(getAllTasks)
    .post(validate(createTaskSchema), createTask);

router
    .route('/:id')
    .get(getTask)
    .patch(validate(updateTaskSchema), updateTask)
    .delete(deleteTask);

export default router;

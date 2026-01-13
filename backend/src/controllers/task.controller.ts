import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as taskService from '../services/task.service';
import { AuthRequest } from '../middlewares/auth.middleware';

// Esquemas de validación
export const createTaskSchema = z.object({
    body: z.object({
        title: z.string().min(1, 'Title is required'),
        description: z.string().optional(),
        status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
        tags: z.array(z.string()).optional(),
    }),
});

export const updateTaskSchema = z.object({
    body: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
        tags: z.array(z.string()).optional(),
    }),
    params: z.object({
        id: z.string().uuid(),
    }),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>['body'];
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>['body'];

export interface TaskQuery {
    status?: string;
    priority?: string;
    search?: string;
    sort?: 'newest' | 'oldest';
}

export const createTask = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const task = await taskService.createTask(req.user!.id, req.body as CreateTaskInput);
        res.status(201).json({
            status: 'success',
            data: { task },
        });
    } catch (error) {
        next(error);
    }
};

export const getAllTasks = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const tasks = await taskService.getTasks(req.user!.id, req.query as unknown as TaskQuery);
        res.status(200).json({
            status: 'success',
            results: tasks.length,
            data: { tasks },
        });
    } catch (error) {
        next(error);
    }
};

export const getTask = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const task = await taskService.getTask(req.user!.id, req.params.id as string);
        res.status(200).json({
            status: 'success',
            data: { task },
        });
    } catch (error) {
        next(error);
    }
};

export const updateTask = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const task = await taskService.updateTask(
            req.user!.id,
            req.params.id as string,
            req.body as UpdateTaskInput
        );
        res.status(200).json({
            status: 'success',
            data: { task },
        });
    } catch (error) {
        next(error);
    }
};

export const deleteTask = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        await taskService.deleteTask(req.user!.id, req.params.id as string);
        res.status(204).json({
            status: 'success',
            data: null,
        });
    } catch (error) {
        next(error);
    }
};

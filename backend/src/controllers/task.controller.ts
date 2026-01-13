import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as taskService from '../services/task.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../config/db';
import { AppError } from '../utils/AppError';

// Define enums for Zod validation (assuming these are defined elsewhere or will be added)
// For the purpose of this change, we'll assume they are available or will be imported.
// If not, you might need to define them or import them from your Prisma schema or a types file.
enum Priority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
}

enum TaskStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
}

// Esquemas de validación
export const createTaskSchema = z.object({
    body: z.object({
        title: z.string().min(1, 'Title is required'),
        description: z.string().optional(),
        status: z.nativeEnum(TaskStatus).optional(), // Changed to nativeEnum
        priority: z.nativeEnum(Priority).optional(), // Changed to nativeEnum
        tags: z.array(z.string()).optional(),
        projectId: z.string().uuid().optional().nullable(), // Added projectId
        dueDate: z.string().datetime().optional().nullable(),
    }),
});

export const updateTaskSchema = z.object({
    body: z.object({
        title: z.string().min(1).optional(), // Added min(1)
        description: z.string().optional(),
        status: z.nativeEnum(TaskStatus).optional(), // Changed to nativeEnum
        priority: z.nativeEnum(Priority).optional(), // Changed to nativeEnum
        tags: z.array(z.string()).optional(),
        projectId: z.string().uuid().optional().nullable(), // Added projectId
        dueDate: z.string().datetime().optional().nullable(),
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
    projectId?: string | 'null'; // 'null' string for filtering unassigned tasks
}

export const createTask = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { title, description, status, priority, tags, projectId, dueDate } = req.body;
        const userId = req.user!.id;

        // Verify project ownership if projectId is provided
        if (projectId) {
            const project = await prisma.project.findUnique({ where: { id: projectId } });
            if (!project || project.userId !== userId) {
                return next(new AppError('Project not found or access denied', 400));
            }
        }

        const task = await prisma.task.create({
            data: {
                title,
                description,
                status, // Include status
                priority,
                tags,
                userId,
                projectId,
                dueDate: dueDate ? new Date(dueDate) : null
            },
        });
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

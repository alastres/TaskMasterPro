import prisma from '../config/db';
import { CreateTaskInput, UpdateTaskInput, TaskQuery } from '../controllers/task.controller';
import { AppError } from '../utils/AppError';
import { Task, TaskStatus, Priority } from '@prisma/client';

/**
 * Calculates the dynamic priority of a task based on its due date and user thresholds.
 */
const calculateEffectivePriority = (task: Task & { user?: { thresholdMedium: number; thresholdHigh: number } }, userThresholds?: { thresholdMedium: number; thresholdHigh: number }): Priority => {
    if (!task.dueDate || task.status === TaskStatus.COMPLETED) {
        return task.priority;
    }

    const thresholds = userThresholds || task.user;
    if (!thresholds) return task.priority;

    const now = new Date();
    const due = new Date(task.dueDate);
    const diffInHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffInHours <= thresholds.thresholdHigh) {
        return Priority.HIGH;
    }
    if (diffInHours <= thresholds.thresholdMedium) {
        // Only upgrade to MEDIUM if it's currently LOW
        return task.priority === Priority.LOW ? Priority.MEDIUM : task.priority;
    }

    return task.priority;
};

export const createTask = async (userId: string, input: CreateTaskInput) => {
    const { dueDate, ...rest } = input;
    return await prisma.task.create({
        data: {
            ...rest,
            dueDate: dueDate ? new Date(dueDate) : null,
            userId,
        },
    });
};

export const getTasks = async (userId: string, query: TaskQuery) => {
    const { status, priority, search, sort, projectId } = query;

    const where: any = {
        userId,
    };

    if (status) {
        where.status = status as TaskStatus;
    }

    if (priority) {
        where.priority = priority as Priority;
    }

    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
        ];
    }

    if (projectId) {
        if (projectId === 'null') {
            where.projectId = null;
        } else {
            where.projectId = projectId;
        }
    }

    const tasks = await prisma.task.findMany({
        where,
        include: {
            user: {
                select: {
                    thresholdMedium: true,
                    thresholdHigh: true,
                }
            }
        },
        orderBy: {
            createdAt: sort === 'oldest' ? 'asc' : 'desc',
        },
    });

    // Map tasks to include dynamic priority
    return tasks.map(task => ({
        ...task,
        priority: calculateEffectivePriority(task)
    }));
};

export const getTask = async (userId: string, taskId: string) => {
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
            user: {
                select: {
                    thresholdMedium: true,
                    thresholdHigh: true,
                }
            }
        }
    });

    if (!task || task.userId !== userId) {
        throw new AppError('Task not found', 404);
    }

    return {
        ...task,
        priority: calculateEffectivePriority(task)
    };
};

export const updateTask = async (
    userId: string,
    taskId: string,
    input: UpdateTaskInput
) => {
    await getTask(userId, taskId); // verifies ownership

    const { dueDate, ...rest } = input;

    return await prisma.task.update({
        where: { id: taskId },
        data: {
            ...rest,
            dueDate: dueDate ? new Date(dueDate) : (dueDate === null ? null : undefined),
        },
    });
};

export const deleteTask = async (userId: string, taskId: string) => {
    await getTask(userId, taskId); // verifies ownership

    await prisma.task.delete({
        where: { id: taskId },
    });
};

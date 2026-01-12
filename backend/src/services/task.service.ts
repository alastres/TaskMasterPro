import prisma from '../config/db';
import { CreateTaskInput, UpdateTaskInput, TaskQuery } from '../controllers/task.controller';
import { AppError } from '../utils/AppError';
import { Task, TaskStatus, Priority } from '@prisma/client';

export const createTask = async (userId: string, input: CreateTaskInput) => {
    return await prisma.task.create({
        data: {
            ...input,
            userId,
        },
    });
};

export const getTasks = async (userId: string, query: TaskQuery) => {
    const { status, priority, search, sort } = query;

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

    const tasks = await prisma.task.findMany({
        where,
        orderBy: {
            createdAt: sort === 'oldest' ? 'asc' : 'desc',
        },
    });

    return tasks;
};

export const getTask = async (userId: string, taskId: string) => {
    const task = await prisma.task.findUnique({
        where: { id: taskId },
    });

    if (!task || task.userId !== userId) {
        throw new AppError('Task not found', 404);
    }

    return task;
};

export const updateTask = async (
    userId: string,
    taskId: string,
    input: UpdateTaskInput
) => {
    const task = await getTask(userId, taskId); // verifies ownership

    return await prisma.task.update({
        where: { id: taskId },
        data: input,
    });
};

export const deleteTask = async (userId: string, taskId: string) => {
    const task = await getTask(userId, taskId); // verifies ownership

    await prisma.task.delete({
        where: { id: taskId },
    });
};

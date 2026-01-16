import prisma from '../config/db';
import { CreateTaskInput, UpdateTaskInput, TaskQuery } from '../controllers/task.controller';
import { AppError } from '../utils/AppError';
import { Task, TaskStatus, Priority } from '@prisma/client';

/**
 * Calculates the dynamic priority of a task based on its due date and user thresholds.
 */
export const calculateEffectivePriority = (task: Task & { user?: { thresholdMedium: number; thresholdHigh: number; autoPriorityEnabled?: boolean } }, userThresholds?: { thresholdMedium: number; thresholdHigh: number }): Priority => {
    if (!task.dueDate || task.status === TaskStatus.COMPLETED) {
        return task.priority;
    }

    const thresholds = userThresholds || task.user;
    if (!thresholds) return task.priority;

    // If auto priority updates are disabled, return manual priority
    if (task.user?.autoPriorityEnabled === false) {
        return task.priority;
    }

    const now = new Date();
    const due = new Date(task.dueDate);
    const diffInHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffInHours <= thresholds.thresholdHigh) {
        return Priority.HIGH;
    }
    if (diffInHours <= thresholds.thresholdMedium) {
        return Priority.MEDIUM;
    }

    // Explicitly return LOW if we are outside the medium threshold
    return Priority.LOW;
};

export const createTask = async (userId: string, input: CreateTaskInput) => {
    const { dueDate, projectId, ...rest } = input;

    // Verify project ownership if project is specified
    if (projectId) {
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) throw new AppError('Proyecto no encontrado', 404);
        if (project.userId !== userId) {
            throw new AppError('Solo el dueño del proyecto puede añadir tareas', 403);
        }
    }

    return await prisma.task.create({
        data: {
            ...rest,
            dueDate: dueDate ? new Date(dueDate) : null,
            userId,
            projectId: projectId || null,
        },
    });
};

export const getTasks = async (userId: string, query: TaskQuery) => {
    const { status, priority, search, sort, projectId } = query;

    // Inclusion criteria: User owns the task OR user is member of the team the task belongs to OR user is a project member
    const where: any = {
        OR: [
            { userId }, // Owner of task
            {
                project: {
                    team: {
                        members: {
                            some: { userId }
                        }
                    }
                }
            }, // Member of team
            {
                project: {
                    members: {
                        some: { userId }
                    }
                }
            } // Member of project
        ]
    };

    if (status) {
        where.status = status as TaskStatus;
    }

    if (priority) {
        where.priority = priority as Priority;
    }

    if (search) {
        where.AND = [
            {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ]
            }
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
                    autoPriorityEnabled: true,
                }
            },
            project: true
        },
        orderBy: {
            createdAt: sort === 'oldest' ? 'asc' : 'desc',
        },
    });

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
                    autoPriorityEnabled: true,
                }
            },
            project: {
                include: {
                    team: {
                        include: {
                            members: {
                                where: { userId }
                            }
                        }
                    },
                    members: {
                        where: { userId }
                    }
                }
            }
        }
    });

    if (!task) {
        throw new AppError('Tarea no encontrada', 404);
    }

    const isOwner = task.userId === userId;
    const isProjectOwner = (task as any).project?.userId === userId;
    const isTeamMember = (task as any).project?.team?.members?.length! > 0;
    const isProjectMember = (task as any).project?.members?.length! > 0;
    const isMember = isTeamMember || isProjectMember;

    if (!isOwner && !isProjectOwner && !isMember) {
        throw new AppError('No tienes permiso para ver esta tarea', 403);
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
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
            project: {
                include: {
                    team: {
                        include: {
                            members: { where: { userId } }
                        }
                    },
                    members: { where: { userId } }
                }
            }
        }
    });

    if (!task) throw new AppError('Tarea no encontrada', 404);

    const isOwner = task.userId === userId;
    const isTeamMember = (task as any).project?.team?.members?.length! > 0;
    const isProjectMember = (task as any).project?.members?.length! > 0;
    const isMember = isTeamMember || isProjectMember;

    if (!isOwner && !isMember) {
        throw new AppError('No tienes permiso para editar esta tarea', 403);
    }

    const { dueDate, ...rest } = input;

    // If member but NOT owner, only 'status' can be updated
    if (!isOwner && isMember) {
        const allowedKeys = ['status'];
        const requestedKeys = Object.keys(rest).filter(k => rest[k as keyof typeof rest] !== undefined);

        // Check if any restricted keys are being updated (even if values are same, we block intent to be safe, 
        // or strictly checking if keys exist in input is better for partials)
        const hasRestrictedUpdates = requestedKeys.some(k => !allowedKeys.includes(k)) || dueDate !== undefined;

        if (hasRestrictedUpdates) {
            throw new AppError('Los miembros del equipo solo pueden actualizar el estado de la tarea', 403);
        }

        return await prisma.task.update({
            where: { id: taskId },
            data: { status: rest.status as TaskStatus },
        });
    }

    // Owner flow
    return await prisma.task.update({
        where: { id: taskId },
        data: {
            ...rest,
            dueDate: dueDate ? new Date(dueDate) : (dueDate === null ? null : undefined),
        },
    });
};

export const deleteTask = async (userId: string, taskId: string) => {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new AppError('Tarea no encontrada', 404);

    // Only task owner or project owner can delete
    const project = task.projectId ? await prisma.project.findUnique({ where: { id: task.projectId } }) : null;

    if (task.userId !== userId && project?.userId !== userId) {
        throw new AppError('Solo el dueño puede eliminar la tarea', 403);
    }

    await prisma.task.delete({
        where: { id: taskId },
    });
};

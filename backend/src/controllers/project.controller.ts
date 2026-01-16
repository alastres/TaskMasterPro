import { Prisma } from '@prisma/client';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../config/db';
import { AppError } from '../utils/AppError';
import { calculateEffectivePriority } from '../services/task.service';

// Helper to generate slug
const generateSlug = (name: string) => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
};

// Crear Proyecto
export const createProject = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { name, description } = req.body;
        const userId = req.user!.id;

        // Automatically link to user's owned team if it exists
        const ownedTeam = await prisma.team.findUnique({ where: { ownerId: userId } });

        // Generate unique slug
        let slug = generateSlug(name);
        let suffix = 0;
        let isUnique = false;

        while (!isUnique) {
            const existing = await prisma.project.findUnique({ where: { slug: suffix > 0 ? `${slug}-${suffix}` : slug } });
            if (!existing) {
                if (suffix > 0) slug = `${slug}-${suffix}`;
                isUnique = true;
            } else {
                suffix++;
            }
        }

        const project = await prisma.project.create({
            data: {
                name,
                description,
                userId,
                teamId: ownedTeam?.id || null,
                slug
            },
        });

        res.status(201).json({
            status: 'success',
            data: { project },
        });
    } catch (error) {
        next(error);
    }
};

// Obtener Proyectos (Propios y de Equipos a los que pertenezco)
export const getProjects = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user!.id;

        const projects = await prisma.project.findMany({
            where: {
                OR: [
                    { userId }, // Proyectos que el usuario creó (Dueño)
                    {
                        members: {
                            some: { userId }
                        }
                    } // Proyectos donde el usuario es colaborador explícito
                ]
            },
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { name: true, avatarUrl: true }
                },
                _count: {
                    select: { tasks: true }
                }
            }
        });

        const projectsWithOwnership = projects.map(project => ({
            ...project,
            isOwner: project.userId === userId
        }));

        res.status(200).json({
            status: 'success',
            results: projects.length,
            data: { projects: projectsWithOwnership },
        });
    } catch (error) {
        next(error);
    }
};

// Obtener Proyecto por ID o Slug
export const getProjectById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;

        const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
        const where: Prisma.ProjectWhereUniqueInput = isUuid ? { id } : { slug: id };

        const project = await prisma.project.findUnique({
            where,
            include: {
                user: {
                    select: { id: true, name: true, avatarUrl: true }
                },
                members: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, avatarUrl: true }
                        }
                    }
                },
                invitations: {
                    where: { status: 'PENDING' },
                    include: {
                        inviter: { select: { name: true } }
                    }
                },
                tasks: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    include: {
                        user: {
                            select: {
                                thresholdMedium: true,
                                thresholdHigh: true,
                                autoPriorityEnabled: true
                            }
                        }
                    }
                }
            }
        });

        if (!project) {
            return next(new AppError('Project not found', 404));
        }

        // Check if user is owner or explicit member
        const isOwner = project.userId === userId;
        const isMember = (project as any).members.some((m: any) => m.userId === userId);

        if (!isOwner && !isMember) {
            return next(new AppError('Not authorized to view this project', 403));
        }

        res.status(200).json({
            status: 'success',
            data: {
                project: {
                    ...project,
                    tasks: (project as any).tasks.map((task: any) => ({
                        ...task,
                        priority: calculateEffectivePriority(task) // Use shared logic
                    })),
                    isOwner // Add flag for frontend
                }
            },
        });
    } catch (error) {
        next(error);
    }
};

// Actualizar Proyecto (Solo Dueño)
export const updateProject = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;
        const { name, description } = req.body;

        const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
        const where: Prisma.ProjectWhereUniqueInput = isUuid ? { id } : { slug: id };

        const project = await prisma.project.findUnique({ where });

        if (!project) {
            return next(new AppError('Project not found', 404));
        }

        if (project.userId !== userId) {
            return next(new AppError('Only the project owner can update it', 403));
        }

        const updatedProject = await prisma.project.update({
            where: { id: project.id }, // Use the resolved project.id
            data: { name, description },
        });

        res.status(200).json({
            status: 'success',
            data: { project: updatedProject },
        });
    } catch (error) {
        next(error);
    }
};

// Eliminar Proyecto (Solo Dueño)
export const deleteProject = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;

        const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
        const where: Prisma.ProjectWhereUniqueInput = isUuid ? { id } : { slug: id };

        const project = await prisma.project.findUnique({ where });

        if (!project) {
            return next(new AppError('Project not found', 404));
        }

        if (project.userId !== userId) {
            return next(new AppError('Only the project owner can delete it', 403));
        }

        // Find Pending Invitations for this project
        const invitations = await prisma.invitation.findMany({
            where: { projectId: project.id }
        });

        const invitationIds = invitations.map(inv => inv.id);

        // Delete Notifications associated with these invitations
        for (const invId of invitationIds) {
            await prisma.notification.deleteMany({
                where: {
                    data: {
                        path: ['invitationId'],
                        equals: invId
                    }
                }
            });
        }

        // Delete the Invitations
        await prisma.invitation.deleteMany({
            where: { projectId: project.id }
        });

        // Cascade delete tasks
        await prisma.task.deleteMany({
            where: { projectId: project.id },
        });

        await prisma.project.delete({
            where: { id: project.id },
        });

        res.status(204).json({
            status: 'success',
            data: null,
        });
    } catch (error) {
        next(error);
    }
};

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../config/db';
import { AppError } from '../utils/AppError';

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

        const project = await prisma.project.create({
            data: {
                name,
                description,
                userId,
                teamId: ownedTeam?.id || null
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

// Obtener Proyecto por ID
export const getProjectById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;

        const project = await prisma.project.findUnique({
            where: { id },
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
                    }
                }
            }
        });

        if (!project) {
            return next(new AppError('Project not found', 404));
        }

        // Check if user is owner or explicit member
        const isOwner = project.userId === userId;
        const isMember = project.members.some((m: any) => m.userId === userId);

        if (!isOwner && !isMember) {
            return next(new AppError('Not authorized to view this project', 403));
        }

        res.status(200).json({
            status: 'success',
            data: {
                project: {
                    ...project,
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

        const project = await prisma.project.findUnique({ where: { id } });

        if (!project) {
            return next(new AppError('Project not found', 404));
        }

        if (project.userId !== userId) {
            return next(new AppError('Only the project owner can update it', 403));
        }

        const updatedProject = await prisma.project.update({
            where: { id },
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

        const project = await prisma.project.findUnique({ where: { id } });

        if (!project) {
            return next(new AppError('Project not found', 404));
        }

        if (project.userId !== userId) {
            return next(new AppError('Only the project owner can delete it', 403));
        }

        // Find Pending Invitations for this project
        const invitations = await prisma.invitation.findMany({
            where: { projectId: id }
        });

        const invitationIds = invitations.map(inv => inv.id);

        // Delete Notifications associated with these invitations
        // Prisma JSON filtering is DB specific, typically strict string matching or path selectors
        // For simplicity and safety, we might need raw query or just rely on a simpler 'contains' if supported,
        // but robust JSON searching varies. However, our Notification.data is Jason?.
        // A simpler approach for now: Find notifications for the relevant users and filter in memory or minimal filter.
        // BETTER: Use deleteMany with filtering if PG supports it well via Prisma.
        // Prisma: data: { path: ['invitationId'], equals: ... }

        // Since we can't easily do "give me all notifications where data.invitationId IN [...ids]",
        // we will iterate and delete. Or if list is small.
        // Actually, let's try to be efficient. 
        // We really want to delete notifications where `data->>'invitationId'` matches any of our IDs.

        // Let's implement a loop for now as it's safer than complex raw SQL in this context without testing env specifics.
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
            where: { projectId: id }
        });

        // Cascade delete tasks
        await prisma.task.deleteMany({
            where: { projectId: id },
        });

        await prisma.project.delete({
            where: { id },
        });

        res.status(204).json({
            status: 'success',
            data: null,
        });
    } catch (error) {
        next(error);
    }
};

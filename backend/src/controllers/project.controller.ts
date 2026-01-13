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

        const project = await prisma.project.create({
            data: {
                name,
                description,
                userId,
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

// Obtener Proyectos del Usuario
export const getProjects = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user!.id;

        const projects = await prisma.project.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { tasks: true }
                }
            }
        });

        res.status(200).json({
            status: 'success',
            results: projects.length,
            data: { projects },
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

        if (project.userId !== userId) {
            return next(new AppError('Not authorized to view this project', 403));
        }

        res.status(200).json({
            status: 'success',
            data: { project },
        });
    } catch (error) {
        next(error);
    }
};

// Actualizar Proyecto
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
            return next(new AppError('Not authorized to update this project', 403));
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

// Eliminar Proyecto
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
            return next(new AppError('Not authorized to delete this project', 403));
        }

        // Cascade delete tasks associated with the project
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

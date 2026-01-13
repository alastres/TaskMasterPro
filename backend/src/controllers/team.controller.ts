import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as teamService from '../services/team.service';
import { z } from 'zod';
import { AppError } from '../utils/AppError';

export const inviteMemberSchema = z.object({
    email: z.string().email('Email no válido'),
    teamId: z.string().uuid('ID de equipo no válido'),
    projectId: z.string().uuid('ID de proyecto no válido').optional()
});

export const getMyTeam = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const team = await teamService.getOrCreateUserTeam(req.user!.id);
        res.status(200).json({
            status: 'success',
            data: team
        });
    } catch (error) {
        next(error);
    }
};

export const inviteMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { email, teamId, projectId } = inviteMemberSchema.parse(req.body);
        const invitation = await teamService.inviteMember(teamId, email, req.user!.id, projectId);
        res.status(201).json({
            status: 'success',
            data: invitation
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return next(new AppError(error.errors[0].message, 400));
        }
        next(error);
    }
};

export const removeMemberFromProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { projectId, userId } = req.params;
        await teamService.removeMemberFromProject(projectId, userId, req.user!.id);
        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        next(error);
    }
};

export const getMemberships = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const memberships = await teamService.getUserMemberships(req.user!.id);
        res.status(200).json({
            status: 'success',
            data: memberships
        });
    } catch (error) {
        next(error);
    }
};

export const cancelInvitation = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        await teamService.cancelInvitation(id, req.user!.id);
        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        next(error);
    }
};

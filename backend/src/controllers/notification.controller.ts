import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as notificationService from '../services/notification.service';
import * as teamService from '../services/team.service';
import { z } from 'zod';
import { AppError } from '../utils/AppError';

export const respondInvitationSchema = z.object({
    invitationId: z.string().uuid('ID de invitación no válido'),
    accept: z.boolean()
});

export const getMyNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const notifications = await notificationService.getNotifications(req.user!.id);
        res.status(200).json({
            status: 'success',
            data: notifications
        });
    } catch (error) {
        next(error);
    }
};

export const markAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const notification = await notificationService.markAsRead(id, req.user!.id);
        res.status(200).json({
            status: 'success',
            data: notification
        });
    } catch (error) {
        next(error);
    }
};

export const markAllAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        await notificationService.markAllAsRead(req.user!.id);
        res.status(200).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        next(error);
    }
};

export const respondToInvitation = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { invitationId, accept } = respondInvitationSchema.parse(req.body);
        const result = await teamService.respondToInvitation(invitationId, req.user!.id, accept);
        res.status(200).json({
            status: 'success',
            ...result
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return next(new AppError(error.errors[0].message, 400));
        }
        next(error);
    }
};

export const deleteNotification = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        await notificationService.deleteNotification(id, req.user!.id);
        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        next(error);
    }
};

export const deleteAllNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        await notificationService.deleteAllNotifications(req.user!.id);
        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        next(error);
    }
};

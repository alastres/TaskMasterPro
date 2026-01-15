import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { AppError } from '../utils/AppError';

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return next(new AppError('No autenticado', 401));
        }

        // Check if user has ADMIN role. 
        // Note: req.user should be populated by authMiddleware.
        // We assume req.user includes the 'role' field. 
        // If authMiddleware fetches user from DB, ensure it selects 'role'.
        if ((req.user as any).role !== 'ADMIN') {
            return next(new AppError('Acceso denegado: Requiere privilegios de administrador', 403));
        }

        next();
    } catch (error) {
        next(error);
    }
};

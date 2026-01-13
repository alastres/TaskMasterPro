import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import prisma from '../config/db';
import { AppError } from '../utils/AppError';

export interface AuthRequest<T = any> extends Request<any, any, T> {
    user?: {
        id: string;
        email: string;
        name: string;
        nickname: string;
        avatarUrl?: string | null;
    };
    file?: Express.Multer.File;
}

export const protect = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    try {
        const decoded = verifyToken(token);

        const currentUser = await prisma.user.findUnique({
            where: { id: decoded.id },
        });

        if (!currentUser) {
            return next(
                new AppError('The user belonging to this token does no longer exist.', 401)
            );
        }

        req.user = {
            id: currentUser.id,
            email: currentUser.email,
            name: currentUser.name,
            nickname: currentUser.nickname,
            avatarUrl: currentUser.avatarUrl,
        };
        next();
    } catch (error) {
        return next(new AppError('Invalid token', 401));
    }
};

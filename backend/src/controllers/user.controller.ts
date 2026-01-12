import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getMe = (req: AuthRequest, res: Response, next: NextFunction) => {
    res.status(200).json({
        status: 'success',
        data: {
            user: req.user,
        },
    });
};

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { ZodError } from 'zod';

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let statusCode = 500;
    let message = 'Something went wrong';

    if (err instanceof AppError || (err as any).statusCode) {
        statusCode = (err as any).statusCode || 500;
        message = err.message;
        if (statusCode >= 500) console.error('ERROR 💥', err);
    } else if (err instanceof ZodError || (err as any).errors) {
        statusCode = 400;
        message = 'Validation Error';
        if ((err as any).errors) {
            message = (err as any).errors.map((e: any) => e.message).join(', ');
        }
        // Do not log ZodError to avoid Jest console issues
    } else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token. Please log in again.';
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Your token has expired. Please log in again.';
    } else {
        // Log unknown errors
        if (process.env.NODE_ENV !== 'test') {
            console.error('ERROR 💥', err);
        }
    }

    res.status(statusCode).json({
        status: statusCode === 500 ? 'error' : 'fail',
        message,
    });
};

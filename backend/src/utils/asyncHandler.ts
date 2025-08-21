import { Request, Response, NextFunction } from 'express';

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;

export const asyncHandler = (func: AsyncRequestHandler) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await func(req, res, next);
        } catch (err: any) {
            const statusCode = err.statusCode || 500;
            res.status(statusCode).json({
                success: false,
                message: err.message || "Internal Server Error",
            });
        }
    };
};
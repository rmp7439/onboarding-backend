import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Prisma Unique Constraint Error Handling
  if (err.code === 'P2002') {
    statusCode = 409;
    message = `Duplicate entry detected for field: ${err.meta?.target?.join(', ')}`;
  }

  if (statusCode === 500) {
    logger.error('Unhandled Exception:', err);
  } else {
    logger.warn(`Operational Error: ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
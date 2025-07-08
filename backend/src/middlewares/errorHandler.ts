import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodIssue } from 'zod';
import winston from 'winston';

export interface ApiError extends Error {
  statusCode?: number;
  details?: ZodIssue[] | Record<string, unknown>;
}

export const errorHandler = (
  err: ApiError | Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.errors,
    });
    return;
  }

  // Handle Prisma errors
  if (err.message.includes('P2002')) {
    res.status(409).json({
      success: false,
      error: 'Resource already exists',
    });
    return;
  }

  if (err.message.includes('P2025')) {
    res.status(404).json({
      success: false,
      error: 'Resource not found',
    });
    return;
  }

  // Default error
  const apiError = err as ApiError;
  const statusCode = apiError.statusCode || 500;
  const message = apiError.message || 'Internal server error';

  const logger = winston.createLogger({
    format: winston.format.simple(),
    transports: [
      new winston.transports.Console()
    ]
  });

  if (process.env.NODE_ENV !== 'test') {
    logger.error('Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
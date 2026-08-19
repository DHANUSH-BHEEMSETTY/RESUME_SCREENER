import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// ---- Custom error classes -----------------------------------

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: string) {
    super(400, message, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, message);
    this.name = 'NotFoundError';
  }
}

export class LLMError extends AppError {
  constructor(message: string, details?: string) {
    super(503, message, details);
    this.name = 'LLMError';
  }
}

export class PDFExtractionError extends AppError {
  constructor(message: string) {
    super(422, message);
    this.name = 'PDFExtractionError';
  }
}

// ---- Global error handler middleware -----------------------

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Known operational errors
  if (err instanceof AppError) {
    logger.warn(`[${err.name}] ${err.message}`, {
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
    });

    res.status(err.statusCode).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  // Multer errors
  if (err.name === 'MulterError') {
    logger.warn(`[MulterError] ${err.message}`);
    res.status(400).json({ error: err.message });
    return;
  }

  // Unexpected errors — do not expose internal details
  logger.error(`[UnhandledError] ${err.message}`, {
    name: err.name,
    stack: err.stack,
    path: req.path,
  });

  res.status(500).json({
    error: 'Internal server error',
  });
}

// ---- 404 handler -------------------------------------------

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.path}`,
  });
}

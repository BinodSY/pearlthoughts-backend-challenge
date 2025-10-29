import { Request, Response } from 'express';

export function sendErrorResponse(
  res: Response,
  req: Request,
  statusCode: number,
  message: string
) {
  return res.status(statusCode).json({
    error: message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  });
}

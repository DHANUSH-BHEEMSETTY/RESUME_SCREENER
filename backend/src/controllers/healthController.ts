import { Request, Response } from 'express';
import { config } from '../config/env';
import { HealthResponse } from '../types';

export function healthCheck(req: Request, res: Response): void {
  const response: HealthResponse = {
    status: 'ok',
    llm: config.geminiApiKey ? 'connected' : 'not_configured',
    model: config.llmModel,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  };

  res.status(200).json(response);
}

import { Router } from 'express';
import { healthCheck } from '../controllers/healthController';

const router = Router();

/**
 * GET /api/health
 * Returns server health status, LLM config, and uptime.
 */
router.get('/', healthCheck);

export default router;

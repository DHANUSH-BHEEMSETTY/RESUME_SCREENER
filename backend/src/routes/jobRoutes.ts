import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /api/jobs
 * Stub — placeholder route for Phase 1 structure.
 * Future use: retrieve analyzed job descriptions.
 */
router.get('/', (_req: Request, res: Response) => {
  res.status(501).json({
    error: 'Not implemented.',
    message: 'Job listing is not part of the current scope.',
  });
});

export default router;

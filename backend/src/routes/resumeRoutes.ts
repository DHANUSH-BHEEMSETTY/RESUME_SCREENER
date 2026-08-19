import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /api/resumes
 * Stub — placeholder route for Phase 1 structure.
 * Future use: list recently screened resume sessions (if persistence is added).
 */
router.get('/', (_req: Request, res: Response) => {
  res.status(501).json({
    error: 'Not implemented.',
    message: 'Resume listing is not part of the current scope.',
  });
});

export default router;

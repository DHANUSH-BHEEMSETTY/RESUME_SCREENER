import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../middleware/errorHandler';

/**
 * POST /api/screen
 *
 * Stub — Phase 1 foundation only.
 * Full implementation in Phase 5 (matching engine).
 * Returns 501 Not Implemented until pipeline is built.
 */
export function screenResumes(req: Request, res: Response, next: NextFunction): void {
  try {
    // Basic request validation (full validation in Phase 5)
    const files = req.files as Express.Multer.File[] | undefined;
    const jobDescription = req.body.jobDescription as string | undefined;

    if (!files || files.length === 0) {
      throw new ValidationError('At least one resume PDF is required.', 'Field: resumes');
    }

    if (!jobDescription || jobDescription.trim().length === 0) {
      throw new ValidationError('Job description is required.', 'Field: jobDescription');
    }

    if (jobDescription.trim().length < 50) {
      throw new ValidationError(
        'Job description is too short. Please provide at least 50 characters.',
        'Field: jobDescription'
      );
    }

    // Placeholder response — pipeline not yet implemented
    res.status(501).json({
      error: 'Screening pipeline not yet implemented.',
      message: 'Phase 1 validation only. Full screening will be available in Phase 5.',
      receivedFiles: files.map((f) => ({
        name: f.originalname,
        sizeBytes: f.size,
        mimeType: f.mimetype,
      })),
      jobDescriptionLength: jobDescription.trim().length,
    });
  } catch (err) {
    next(err);
  }
}

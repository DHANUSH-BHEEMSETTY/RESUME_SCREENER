import { Router } from 'express';
import { uploadMiddleware } from '../middleware/upload';
import { screenResumes } from '../controllers/screeningController';

const router = Router();

/**
 * POST /api/screen
 * Accepts multipart/form-data with PDF resumes and a job description.
 * Runs the full screening pipeline and returns ranked candidates.
 *
 * Fields:
 *   resumes        File[]  — one or more PDF files
 *   jobDescription string  — plain text job description
 *   options        string  — optional JSON: { shortlistThreshold?: number }
 */
router.post('/', uploadMiddleware.array('resumes', 20), screenResumes);

export default router;

import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../middleware/errorHandler';
import { runScreeningPipeline, ResumeUpload } from '../services/screeningPipeline.service';
import { ScreeningOptions } from '../types';

/**
 * POST /api/screen
 *
 * Accepts multipart/form-data with PDF resumes and a job description.
 * Runs the full screening pipeline and returns ranked candidates.
 */
export async function screenResumes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    const jobDescription = req.body.jobDescription as string | undefined;
    
    // Parse options if provided
    let options: ScreeningOptions | undefined;
    if (req.body.options) {
      try {
        options = JSON.parse(req.body.options);
      } catch (err) {
        throw new ValidationError('Invalid JSON in options field', 'Field: options');
      }
    }

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

    // Map Express.Multer.File to our ResumeUpload interface
    const resumes: ResumeUpload[] = files.map(file => ({
      fileName: file.originalname,
      buffer: file.buffer
    }));

    // Run the pipeline!
    const response = await runScreeningPipeline(jobDescription, resumes, options);

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}


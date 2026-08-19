import multer from 'multer';
import { config } from '../config/env';
import { ValidationError } from './errorHandler';
import { Request } from 'express';

const MAX_SIZE_BYTES = config.maxPdfSizeMb * 1024 * 1024;
const MAX_FILES = 20;

// Memory storage — resumes are never written to disk
const storage = multer.memoryStorage();

function pdfFilter(
  _req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
): void {
  if (file.mimetype === 'application/pdf') {
    callback(null, true);
  } else {
    callback(
      new ValidationError(
        `File "${file.originalname}" is not a PDF. Only PDF files are accepted.`
      )
    );
  }
}

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: MAX_SIZE_BYTES,
    files: MAX_FILES,
  },
  fileFilter: pdfFilter,
});

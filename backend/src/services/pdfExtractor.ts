import pdfParse from 'pdf-parse';
import { PDFExtractionError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const MIN_TEXT_LENGTH = 50;

/**
 * Extracts raw text from a PDF buffer.
 * Throws PDFExtractionError if text cannot be extracted or is too short.
 *
 * @param buffer  The PDF file as a Node.js Buffer (from multer memory storage)
 * @param fileName  Original filename — used only in error messages, not logged
 */
export async function extractTextFromPdf(
  buffer: Buffer,
  fileName: string
): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    const text = (data.text ?? '').trim();

    if (text.length < MIN_TEXT_LENGTH) {
      throw new PDFExtractionError(
        `Could not extract readable text from "${fileName}". ` +
          `The file may be a scanned image PDF or contain no embedded text.`
      );
    }

    // Log only metadata — never the content
    logger.debug('PDF extracted', {
      fileName,
      pages: data.numpages,
      textLength: text.length,
    });

    return text;
  } catch (err) {
    if (err instanceof PDFExtractionError) throw err;

    throw new PDFExtractionError(
      `Failed to parse "${fileName}": ${(err instanceof Error ? err.message : 'unknown error')}`
    );
  }
}

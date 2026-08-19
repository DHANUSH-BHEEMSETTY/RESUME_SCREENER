import { analyzeJobDescription } from './jobAnalysis.service';
import { extractTextFromPdf } from './pdfExtractor';
import { extractResumeData } from './resumeExtraction.service';
import { analyzeMatch } from './matchingEngine.service';
import { calculateOverallScore } from './scoreCalculator';
import {
  AnalyzedJob,
  ScoredCandidate,
  ScreeningOptions,
  ScreeningResponse,
  ScreeningError,
} from '../types';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

// ---- Constants ---------------------------------------------

const DEFAULT_SHORTLIST_THRESHOLD = Number(process.env.SHORTLIST_THRESHOLD) || 75;

// ---- Interfaces --------------------------------------------

export interface ResumeUpload {
  fileName: string;
  buffer: Buffer;
}

// ---- Main Pipeline -----------------------------------------

/**
 * Runs the full screening pipeline for a batch of resumes against a job description.
 * 1. Analyzes the job description.
 * 2. Processes all resumes in parallel (PDF -> Text -> JSON -> Match -> Score).
 * 3. Ranks candidates and determines shortlist status.
 * 4. Gathers individual failures without crashing the batch.
 *
 * @param jobDescriptionText  Raw text of the job description
 * @param resumes             Array of uploaded PDF resumes
 * @param options             Optional configuration (e.g. threshold)
 * @returns                   Full screening report
 */
export async function runScreeningPipeline(
  jobDescriptionText: string,
  resumes: ResumeUpload[],
  options?: ScreeningOptions
): Promise<ScreeningResponse> {
  const startTime = Date.now();
  const threshold = options?.shortlistThreshold ?? DEFAULT_SHORTLIST_THRESHOLD;

  logger.info('Starting batch screening pipeline', {
    resumeCount: resumes.length,
    threshold,
  });

  // Step 1: Analyze Job Description
  let job: AnalyzedJob;
  try {
    job = await analyzeJobDescription(jobDescriptionText);
  } catch (err) {
    logger.error('Pipeline failed: Job description analysis error', {
      error: (err as Error).message,
    });
    throw err;
  }

  // Step 2: Process Resumes in Parallel
  // Using allSettled to ensure one bad PDF doesn't fail the entire batch.
  const candidatePromises = resumes.map(async (upload) => {
    try {
      // a. Extract text from PDF
      const text = await extractTextFromPdf(upload.buffer, upload.fileName);
      
      // b. Extract structured resume data
      const parsedResume = await extractResumeData(text, upload.fileName);
      
      // c. Perform LLM match analysis
      const analysis = await analyzeMatch(parsedResume, job);
      
      // d. Calculate deterministic score
      const overall = calculateOverallScore(analysis);

      // e. Assemble unranked candidate
      const candidate: Omit<ScoredCandidate, 'rank' | 'shortlisted'> = {
        resume: parsedResume,
        analysis,
        scores: {
          skills: analysis.skillsScore,
          experience: analysis.experienceScore,
          education: analysis.educationScore,
          certification: analysis.certificationScore,
          semanticFit: analysis.semanticScore,
          overall,
        },
      };

      return candidate;
    } catch (err) {
      // Re-throw so allSettled catches it as a rejection
      const errorMessage = err instanceof AppError ? err.message : (err as Error).message;
      throw new Error(`[${upload.fileName}] ${errorMessage}`);
    }
  });

  const results = await Promise.allSettled(candidatePromises);

  // Step 3: Separate Successes and Failures
  const successful: Omit<ScoredCandidate, 'rank' | 'shortlisted'>[] = [];
  const failed: ScreeningError[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successful.push(result.value);
    } else {
      failed.push({
        fileName: resumes[index].fileName,
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
      logger.warn('Candidate processing failed', {
        fileName: resumes[index].fileName,
        error: result.reason,
      });
    }
  });

  // Step 4: Rank and Shortlist
  // Sort descending by overall score
  successful.sort((a, b) => b.scores.overall - a.scores.overall);

  let shortlistedCount = 0;
  const scoredCandidates: ScoredCandidate[] = successful.map((c, index) => {
    const isShortlisted = c.scores.overall >= threshold;
    if (isShortlisted) shortlistedCount++;

    return {
      ...c,
      rank: index + 1, // 1-based ranking
      shortlisted: isShortlisted,
    };
  });

  const processingTimeMs = Date.now() - startTime;

  logger.info('Batch screening pipeline complete', {
    total: resumes.length,
    screened: scoredCandidates.length,
    failed: failed.length,
    shortlisted: shortlistedCount,
    processingTimeMs,
  });

  return {
    job,
    candidates: scoredCandidates,
    failed,
    summary: {
      total: resumes.length,
      screened: scoredCandidates.length,
      shortlisted: shortlistedCount,
      failed: failed.length,
      processingTimeMs,
    },
  };
}

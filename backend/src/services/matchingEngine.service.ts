import { llmClient } from '../llm/llmClient';
import {
  MATCHING_SYSTEM_PROMPT,
  buildMatchingPrompt,
} from '../prompts/matching.prompt';
import { MatchSchema } from '../validation/matchSchema';
import { ParsedResume, AnalyzedJob, MatchResult } from '../types';
import { LLMError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

// ---- Constants ---------------------------------------------

const SERVICE_NAME = 'MatchingEngineService';

// ---- Helpers -----------------------------------------------

function safeJsonParse(raw: string): unknown | null {
  let cleaned = raw.trim();
  const codeFenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeFenceMatch) {
    cleaned = codeFenceMatch[1].trim();
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

// ---- Main service function ---------------------------------

/**
 * Evaluates a candidate's resume against a job description using the LLM.
 * Returns component scores (0–100) and detailed written analysis.
 *
 * NOTE: The returned MatchResult contains component scores only.
 * The final overall score is computed separately by scoreCalculator.ts
 * using a deterministic weighted formula — the LLM does NOT decide it.
 *
 * @param resume  Validated ParsedResume
 * @param job     Validated AnalyzedJob (shared across all candidates in a batch)
 * @returns       Validated MatchResult with component scores and analysis
 */
export async function analyzeMatch(
  resume: ParsedResume,
  job: AnalyzedJob
): Promise<MatchResult> {
  logger.debug(`${SERVICE_NAME}: starting match analysis`, {
    fileName: resume.fileName,
    candidateName: resume.candidateName ?? '(unnamed)',
    role: job.roleTitle,
  });

  // Build prompts — serialize resume and job as JSON for the LLM
  // Resume raw text is NOT included here (only structured data)
  const resumeJson = JSON.stringify(resume, null, 2);
  const jobJson = JSON.stringify(job, null, 2);
  const userPrompt = buildMatchingPrompt(resumeJson, jobJson);

  // Step 1: Call LLM
  let rawResponse: string;
  try {
    rawResponse = await llmClient.complete(MATCHING_SYSTEM_PROMPT, userPrompt);
  } catch (err) {
    logger.error(`${SERVICE_NAME}: LLM call failed`, {
      fileName: resume.fileName,
      error: (err as Error).message,
    });
    throw err;
  }

  // Step 2: Parse JSON
  const parsed = safeJsonParse(rawResponse);
  if (parsed === null) {
    logger.error(`${SERVICE_NAME}: malformed JSON from LLM`, {
      fileName: resume.fileName,
    });
    throw new LLMError(
      'LLM returned malformed JSON for matching analysis',
      `Candidate: ${resume.candidateName ?? resume.fileName}`
    );
  }

  // Step 3: Validate against Zod schema
  const validationResult = MatchSchema.safeParse(parsed);
  if (!validationResult.success) {
    const issues = validationResult.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    logger.error(`${SERVICE_NAME}: schema validation failed`, {
      fileName: resume.fileName,
      issues,
    });
    throw new LLMError(
      'LLM response failed schema validation for matching analysis',
      issues
    );
  }

  const data = validationResult.data;

  // Step 4: Map to MatchResult domain type
  const result: MatchResult = {
    skillsScore:        data.skillsScore,
    experienceScore:    data.experienceScore,
    educationScore:     data.educationScore,
    certificationScore: data.certificationScore,
    semanticScore:      data.semanticScore,
    matchedSkills:         data.matchedSkills,
    missingSkills:         data.missingSkills,
    preferredSkillsMatched: data.preferredSkillsMatched,
    strengths:          data.strengths,
    gaps:               data.gaps,
    experienceAnalysis: data.experienceAnalysis,
    educationAnalysis:  data.educationAnalysis,
    recommendation:     data.recommendation,
    justification:      data.justification,
    confidence:         data.confidence,
  };

  logger.debug(`${SERVICE_NAME}: match analysis complete`, {
    fileName: resume.fileName,
    skillsScore: result.skillsScore,
    experienceScore: result.experienceScore,
    educationScore: result.educationScore,
    recommendation: result.recommendation,
  });

  return result;
}

import { llmClient } from '../llm/llmClient';
import {
  JD_ANALYSIS_SYSTEM_PROMPT,
  buildJDAnalysisPrompt,
} from '../prompts/jobAnalysis.prompt';
import { JobAnalysisSchema } from '../validation/jobSchema';
import { AnalyzedJob } from '../types';
import { LLMError, ValidationError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

// ---- Constants ---------------------------------------------

const SERVICE_NAME = 'JobAnalysisService';
const MIN_JD_LENGTH = 50;
const MAX_JD_LENGTH = 15_000;

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

// ---- Input validation --------------------------------------

function validateInput(jobDescriptionText: string): void {
  const trimmed = jobDescriptionText.trim();
  if (trimmed.length < MIN_JD_LENGTH) {
    throw new ValidationError(
      `Job description is too short (${trimmed.length} characters). Minimum is ${MIN_JD_LENGTH}.`
    );
  }
  if (trimmed.length > MAX_JD_LENGTH) {
    throw new ValidationError(
      `Job description is too long (${trimmed.length} characters). Maximum is ${MAX_JD_LENGTH}.`
    );
  }
}

// ---- Main service function ---------------------------------

/**
 * Analyzes a job description text using the LLM and returns structured hiring criteria.
 * Called ONCE per screening batch (shared across all candidates).
 *
 * @param jobDescriptionText  The raw job description string
 * @returns A validated AnalyzedJob object
 * @throws ValidationError if the input is too short/long
 * @throws LLMError on LLM failure, malformed JSON, or schema validation failure
 */
export async function analyzeJobDescription(
  jobDescriptionText: string
): Promise<AnalyzedJob> {
  // Step 0: Validate input length
  validateInput(jobDescriptionText);

  logger.debug(`${SERVICE_NAME}: starting analysis`, {
    jdLength: jobDescriptionText.trim().length,
  });

  // Step 1: Build prompt and call LLM
  const userPrompt = buildJDAnalysisPrompt(jobDescriptionText);

  let rawResponse: string;
  try {
    rawResponse = await llmClient.complete(JD_ANALYSIS_SYSTEM_PROMPT, userPrompt);
  } catch (err) {
    logger.error(`${SERVICE_NAME}: LLM call failed`, {
      error: (err as Error).message,
    });
    throw err;
  }

  // Step 2: Parse JSON
  const parsed = safeJsonParse(rawResponse);
  if (parsed === null) {
    logger.error(`${SERVICE_NAME}: malformed JSON from LLM`);
    throw new LLMError('LLM returned malformed JSON for job description analysis');
  }

  // Step 3: Validate against Zod schema
  const validationResult = JobAnalysisSchema.safeParse(parsed);
  if (!validationResult.success) {
    const issues = validationResult.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    logger.error(`${SERVICE_NAME}: schema validation failed`, { issues });
    throw new LLMError(
      'LLM response failed schema validation for job description analysis',
      issues
    );
  }

  const data = validationResult.data;

  // Step 4: Map to AnalyzedJob domain type
  const result: AnalyzedJob = {
    roleTitle: data.roleTitle,
    requiredSkills: data.requiredSkills,
    preferredSkills: data.preferredSkills,
    requiredExperience: {
      years: data.requiredExperience.years,
      description: data.requiredExperience.description,
    },
    educationRequirements: data.educationRequirements,
    certifications: data.certifications,
    responsibilities: data.responsibilities,
    keywords: data.keywords,
  };

  logger.debug(`${SERVICE_NAME}: analysis complete`, {
    roleTitle: result.roleTitle,
    requiredSkillCount: result.requiredSkills.length,
    preferredSkillCount: result.preferredSkills.length,
    experienceYears: result.requiredExperience.years,
  });

  return result;
}

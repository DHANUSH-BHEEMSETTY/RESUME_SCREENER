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

/**
 * Robustly extracts and parses JSON from an LLM response.
 * Handles: markdown code fences, trailing commas, unclosed brackets, extra text.
 */
function safeJsonParse(raw: string): unknown | null {
  let cleaned = raw.trim();

  // 1. Strip markdown code fences
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  // 2. Extract just the first top-level JSON object if there's surrounding text
  const objStart = cleaned.indexOf('{');
  if (objStart === -1) return null;
  cleaned = cleaned.slice(objStart);

  // 3. Try straight parse first
  try {
    return JSON.parse(cleaned);
  } catch {
    // continue to repair attempts
  }

  // 4. Remove trailing commas before ] or } (common LLM mistake)
  const noTrailingCommas = cleaned.replace(/,\s*([}\]])/g, '$1');
  try {
    return JSON.parse(noTrailingCommas);
  } catch {
    // continue
  }

  // 5. Try to close any unclosed brackets by counting them
  const repaired = repairJsonBrackets(noTrailingCommas);
  try {
    return JSON.parse(repaired);
  } catch {
    return null;
  }
}

/**
 * Attempts to repair a JSON string with unclosed brackets/braces
 * by appending the required closing characters.
 */
function repairJsonBrackets(s: string): string {
  const stack: string[] = [];
  let inString = false;
  let escape = false;

  for (const ch of s) {
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') stack.push('}');
    else if (ch === '[') stack.push(']');
    else if (ch === '}' || ch === ']') stack.pop();
  }

  return s + stack.reverse().join('');
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

  // Step 1: Build prompt and call LLM (with one retry for malformed JSON)
  const userPrompt = buildJDAnalysisPrompt(jobDescriptionText);

  let rawResponse: string;
  let parsed: unknown | null = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const prompt = attempt === 1
        ? userPrompt
        : `The previous response was not valid JSON. Please respond again with ONLY a valid JSON object matching the schema. No markdown, no explanation.\n\n${userPrompt}`;

      rawResponse = await llmClient.complete(JD_ANALYSIS_SYSTEM_PROMPT, prompt);
    } catch (err) {
      logger.error(`${SERVICE_NAME}: LLM call failed on attempt ${attempt}`, {
        error: (err as Error).message,
      });
      throw err;
    }

    parsed = safeJsonParse(rawResponse!);
    if (parsed !== null) break;

    logger.warn(`${SERVICE_NAME}: malformed JSON from LLM (attempt ${attempt}/2)`, {
      rawSnippet: rawResponse!.slice(0, 200),
    });
  }

  if (parsed === null) {
    logger.error(`${SERVICE_NAME}: malformed JSON from LLM after 2 attempts`);
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

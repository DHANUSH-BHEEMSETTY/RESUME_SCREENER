import { llmClient } from '../llm/llmClient';
import {
  RESUME_EXTRACTION_SYSTEM_PROMPT,
  buildResumeExtractionPrompt,
} from '../prompts/resumeExtraction.prompt';
import { ResumeExtractionSchema } from '../validation/resumeSchema';
import { ParsedResume } from '../types';
import { LLMError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

// ---- Constants ---------------------------------------------

const SERVICE_NAME = 'ResumeExtractionService';

// ---- Helpers -----------------------------------------------

/**
 * Attempts to parse a JSON string, returning null on failure.
 * Handles LLM responses that wrap JSON in markdown code fences.
 */
function safeJsonParse(raw: string): unknown | null {
  let cleaned = raw.trim();

  // 1. Strip markdown code fences
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) cleaned = fenceMatch[1].trim();

  // 2. Grab first top-level JSON object
  const objStart = cleaned.indexOf('{');
  if (objStart === -1) return null;
  cleaned = cleaned.slice(objStart);

  // 3. Straight parse
  try { return JSON.parse(cleaned); } catch { /* continue */ }

  // 4. Remove trailing commas
  const noCommas = cleaned.replace(/,\s*([}\]])/g, '$1');
  try { return JSON.parse(noCommas); } catch { /* continue */ }

  // 5. Auto-close unclosed brackets
  const stack: string[] = [];
  let inStr = false, esc = false;
  for (const ch of noCommas) {
    if (esc) { esc = false; continue; }
    if (ch === '\\' && inStr) { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '{') stack.push('}');
    else if (ch === '[') stack.push(']');
    else if (ch === '}' || ch === ']') stack.pop();
  }
  const repaired = noCommas + stack.reverse().join('');
  try { return JSON.parse(repaired); } catch { return null; }
}

// ---- Main service function ---------------------------------

/**
 * Extracts structured candidate information from raw resume text using the LLM.
 *
 * @param rawText   The plain text extracted from a resume PDF
 * @param fileName  Original filename — used for logging context only
 * @returns A validated ParsedResume object
 * @throws LLMError on LLM failure, validation failure, or malformed JSON (after retry)
 */
export async function extractResumeData(
  rawText: string,
  fileName: string
): Promise<ParsedResume> {
  logger.debug(`${SERVICE_NAME}: starting extraction`, { fileName });

  // Build prompt — rawText is not logged for privacy
  const userPrompt = buildResumeExtractionPrompt(rawText);

  // Step 1: Call LLM (retry handled inside llmClient)
  let rawResponse: string;
  try {
    rawResponse = await llmClient.complete(
      RESUME_EXTRACTION_SYSTEM_PROMPT,
      userPrompt
    );
  } catch (err) {
    logger.error(`${SERVICE_NAME}: LLM call failed`, { fileName, error: (err as Error).message });
    throw err; // Already wrapped in LLMError by llmClient
  }

  // Step 2: Parse JSON
  const parsed = safeJsonParse(rawResponse);
  if (parsed === null) {
    logger.error(`${SERVICE_NAME}: malformed JSON from LLM`, { fileName });
    throw new LLMError(
      'LLM returned malformed JSON for resume extraction',
      `File: ${fileName}`
    );
  }

  // Step 3: Validate against Zod schema
  const validationResult = ResumeExtractionSchema.safeParse(parsed);
  if (!validationResult.success) {
    const issues = validationResult.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    logger.error(`${SERVICE_NAME}: schema validation failed`, { fileName, issues });
    throw new LLMError(
      'LLM response failed schema validation for resume extraction',
      issues
    );
  }

  const data = validationResult.data;

  // Step 4: Map LLM output → ParsedResume (flatten candidate sub-object)
  const result: ParsedResume = {
    fileName,
    candidateName: data.candidate.name ?? null,
    email: data.candidate.email ?? null,
    phone: data.candidate.phone ?? null,
    skills: data.skills,
    education: data.education.map((e) => ({
      degree: e.degree,
      institution: e.institution,
      year: e.year ?? null,
    })),
    workExperience: data.experience.map((e) => ({
      title: e.title,
      company: e.company,
      duration: e.duration,
      description: e.description,
    })),
    certifications: data.certifications,
  };

  logger.debug(`${SERVICE_NAME}: extraction complete`, {
    fileName,
    name: result.candidateName ?? '(unnamed)',
    skillCount: result.skills.length,
    experienceCount: result.workExperience.length,
  });

  return result;
}

import { MatchResult } from '../types';
import { logger } from '../utils/logger';

// ---- Weight constants ---------------------------------------

const WEIGHTS = {
  skills: 0.45,
  experience: 0.30,
  education: 0.10,
  certification: 0.05,
  semantic: 0.10,
} as const;

// ---- Helpers -----------------------------------------------

/**
 * Clamps a number to the inclusive range [0, 100].
 * Guards against LLM hallucinating out-of-range scores.
 */
export function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}

// ---- Deterministic score calculation -----------------------

/**
 * Calculates the overall match score using a fixed, deterministic weighted formula.
 *
 * Formula:
 *   overallScore = round(
 *     skillsScore      × 0.45 +
 *     experienceScore  × 0.30 +
 *     educationScore   × 0.10 +
 *     certScore        × 0.05 +
 *     semanticScore    × 0.10
 *   )
 *
 * All component scores are clamped to [0, 100] before calculation.
 * The LLM provides component scores — it does NOT decide the overall score.
 *
 * @param match  Validated MatchResult from the matching engine
 * @returns      Overall score rounded to nearest integer (0–100)
 */
export function calculateOverallScore(match: MatchResult): number {
  const skills      = clamp(match.skillsScore);
  const experience  = clamp(match.experienceScore);
  const education   = clamp(match.educationScore);
  const cert        = clamp(match.certificationScore);
  const semantic    = clamp(match.semanticScore);

  const raw =
    skills      * WEIGHTS.skills +
    experience  * WEIGHTS.experience +
    education   * WEIGHTS.education +
    cert        * WEIGHTS.certification +
    semantic    * WEIGHTS.semantic;

  const overall = Math.round(raw);

  logger.debug('Score calculated', {
    components: { skills, experience, education, cert, semantic },
    rawScore: raw.toFixed(2),
    overallScore: overall,
  });

  return overall;
}

/**
 * Returns the scoring weight constants for reference / documentation.
 */
export function getWeights(): typeof WEIGHTS {
  return WEIGHTS;
}

import { z } from 'zod';

// ---- Score sub-schema (0–100 integer) ----------------------

const score = z.number().int().min(0).max(100);

// ---- Root schema -------------------------------------------

/**
 * Zod schema for the LLM matching analysis response.
 * Scores are validated as integers in [0, 100].
 * Unknown fields are stripped (Zod default).
 */
export const MatchSchema = z.object({
  // Component scores
  skillsScore: score,
  experienceScore: score,
  educationScore: score,
  certificationScore: score,
  semanticScore: score,

  // Skill matching
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  preferredSkillsMatched: z.array(z.string()),

  // Qualitative analysis
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  experienceAnalysis: z.string(),
  educationAnalysis: z.string(),

  // Decision
  recommendation: z.enum(['STRONG_HIRE', 'HIRE', 'MAYBE', 'REJECT']),
  justification: z.string().min(1),
  confidence: score,
});

export type MatchOutput = z.infer<typeof MatchSchema>;

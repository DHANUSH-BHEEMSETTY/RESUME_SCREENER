import { z } from 'zod';

// ---- Sub-schemas -------------------------------------------

const RequiredExperienceSchema = z.object({
  years: z.number().nullable(),
  description: z.string(),
});

// ---- Root schema -------------------------------------------

/**
 * Zod schema for the LLM job description analysis response.
 * Unknown fields are stripped (Zod default).
 */
export const JobAnalysisSchema = z.object({
  roleTitle: z.string().min(1),
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  requiredExperience: RequiredExperienceSchema,
  educationRequirements: z.array(z.string()),
  certifications: z.array(z.string()),
  responsibilities: z.array(z.string()),
  keywords: z.array(z.string()),
});

export type JobAnalysisOutput = z.infer<typeof JobAnalysisSchema>;

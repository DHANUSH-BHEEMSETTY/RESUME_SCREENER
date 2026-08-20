import { z } from 'zod';

// ---- Sub-schemas -------------------------------------------

const RequiredExperienceSchema = z.object({
  years: z.number().nullable().default(null),
  description: z.string().default(''),
}).default({ years: null, description: '' });

// ---- Root schema -------------------------------------------

/**
 * Zod schema for the LLM job description analysis response.
 * Lenient defaults so partial LLM responses still succeed validation.
 */
export const JobAnalysisSchema = z.object({
  roleTitle: z.string().min(1),
  requiredSkills: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  requiredExperience: RequiredExperienceSchema,
  educationRequirements: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  responsibilities: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
});

export type JobAnalysisOutput = z.infer<typeof JobAnalysisSchema>;

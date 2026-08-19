import { z } from 'zod';

// ---- Sub-schemas -------------------------------------------

const CandidateInfoSchema = z.object({
  name: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
});

const EducationEntrySchema = z.object({
  degree: z.string().min(1),
  institution: z.string().min(1),
  year: z.string().nullable(),
});

const ExperienceEntrySchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  duration: z.string().min(1),
  description: z.string(),
});

// ---- Root schema -------------------------------------------

/**
 * Zod schema for the LLM resume extraction response.
 * All unknown fields are stripped (.strip() is default in zod).
 */
export const ResumeExtractionSchema = z.object({
  candidate: CandidateInfoSchema,
  skills: z.array(z.string()),
  education: z.array(EducationEntrySchema),
  experience: z.array(ExperienceEntrySchema),
  certifications: z.array(z.string()),
});

export type ResumeExtractionOutput = z.infer<typeof ResumeExtractionSchema>;

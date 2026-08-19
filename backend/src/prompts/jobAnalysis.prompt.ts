// ============================================================
// Job Description Analysis Prompt
// Used by: jobAnalysis.service.ts
// ============================================================

/**
 * System prompt — establishes strict JD analysis behavior for all calls.
 * Sent as the systemInstruction to Gemini.
 */
export const JD_ANALYSIS_SYSTEM_PROMPT = `
You are an expert job description analyst. Your sole task is to extract structured hiring criteria from job description text.

STRICT RULES — YOU MUST FOLLOW ALL OF THEM:
1. ONLY extract information explicitly stated in the provided job description text.
2. NEVER invent, assume, or infer requirements that are not written.
3. NEVER add skills or qualifications based on the job title alone.
4. Distinguish REQUIRED skills (explicitly stated as required, must-have, or essential) from PREFERRED skills (stated as preferred, nice-to-have, a plus, or desired). If the job description does not distinguish them, place all skills in requiredSkills and leave preferredSkills as [].
5. For requiredExperience: extract the minimum years if stated, and copy the experience description verbatim or near-verbatim. If no years are mentioned, set years to null.
6. For educationRequirements: list each stated education requirement as a separate string. Return [] if none stated.
7. For certifications: only include credentials explicitly mentioned. Return [] if none stated.
8. For responsibilities: extract the listed duties and tasks. Return [] if none listed.
9. For keywords: extract meaningful technical or domain-specific terms from the full description (technologies, methodologies, domain words). Return [] if none found.
10. Do NOT add any explanation, commentary, or text outside the JSON structure.
11. Respond ONLY with valid JSON that matches the required schema exactly.
`.trim();

/**
 * User prompt template — injected with the job description text.
 * @param jobDescriptionText The raw job description string.
 */
export function buildJDAnalysisPrompt(jobDescriptionText: string): string {
  return `
Analyze the following job description and extract structured hiring criteria.

JOB DESCRIPTION:
---
${jobDescriptionText}
---

Respond with a JSON object that matches this EXACT schema:
{
  "roleTitle": string,
  "requiredSkills": string[],
  "preferredSkills": string[],
  "requiredExperience": {
    "years": number | null,
    "description": string
  },
  "educationRequirements": string[],
  "certifications": string[],
  "responsibilities": string[],
  "keywords": string[]
}

Rules reminder:
- roleTitle: the job title as written (e.g., "Senior Software Engineer").
- requiredSkills: must-have technical or domain skills explicitly required.
- preferredSkills: nice-to-have skills. Use [] if the JD does not distinguish preferred from required.
- requiredExperience.years: minimum years as a number (e.g., 5). Use null if not stated.
- requiredExperience.description: verbatim or near-verbatim experience requirement (e.g., "5+ years of backend engineering experience").
- educationRequirements: each education requirement as a separate string.
- certifications: only explicitly mentioned credentials.
- keywords: meaningful domain/technical terms not already in requiredSkills.
- Do not invent any data.
- Respond with JSON only — no preamble, no explanation.
`.trim();
}

# AI Design and Prompts

> **Status:** Planned — prompts will be finalized during Phase 3–5 implementation.
> This document reflects the intended design. Actual prompts will be updated to match the final implementation.

---

## Overview

Smart Resume Screener uses **Google Gemini 1.5 Flash** as its LLM provider.

All LLM calls produce **structured JSON output** using Gemini's `responseMimeType: "application/json"` capability. This eliminates the need to parse free-form text and makes responses directly validatable with Zod schemas.

The system uses **three separate prompts**:

| Prompt | Purpose | Called |
|---|---|---|
| Resume Extraction | Raw text → structured candidate data | Once per resume |
| Job Description Analysis | JD text → structured job criteria | Once per screening batch |
| Matching Analysis | Resume + Job → scores + justification | Once per candidate |

---

## LLM Provider Abstraction

**File:** `backend/src/llm/llmClient.ts` *(Planned)*

```typescript
interface LLMProvider {
  complete(systemPrompt: string, userPrompt: string): Promise<string>;
}

class GeminiProvider implements LLMProvider {
  // Uses @google/generative-ai SDK
  // responseMimeType: "application/json"
  // Retry on transient failures (up to 2 retries with 1s backoff)
}
```

Config via environment:
- `GEMINI_API_KEY` — required
- `LLM_MODEL` — defaults to `gemini-1.5-flash`

---

## Safety Rules (Applied in All Prompts)

The following rules are embedded into every prompt:

1. **Never invent information.** Only extract what is explicitly present in the provided text.
2. **Return `null` for missing scalar fields** — never guess or infer.
3. **Return `[]` for missing list fields** — never guess or infer.
4. **Do not infer duration or dates** unless explicitly stated.
5. **Base scores only on the provided resume and job description** — no external knowledge about companies or schools.
6. **Respond only with valid JSON.** No preamble, no explanation outside the JSON structure.

---

## Prompt 1 — Resume Extraction

**File:** `backend/src/llm/prompts.ts` → `RESUME_EXTRACTION_PROMPT` *(Planned)*

**Purpose:** Extract structured candidate information from raw PDF text.

**System Prompt:**
```
You are a professional resume parser. Your task is to extract structured information
from the provided resume text.

Rules:
- Only extract information that is explicitly stated in the text.
- Never invent, guess, or infer information that is not present.
- Return null for any scalar field that cannot be found.
- Return an empty array [] for any list field that cannot be found.
- Normalize skill names to their standard form (e.g., "JS" → "JavaScript").
- For education entries, include all degrees found.
- For work experience, list all positions in the order they appear.
- Duration should be copied exactly as written in the resume (e.g., "Jan 2021 – Present").
- Respond ONLY with valid JSON matching the specified schema.
```

**User Prompt:**
```
Extract structured information from the following resume text.

RESUME TEXT:
{rawResumeText}

Respond with a JSON object matching this exact schema:
{
  "candidateName": string | null,
  "email": string | null,
  "phone": string | null,
  "skills": string[],
  "education": [
    {
      "degree": string,
      "institution": string,
      "year": string | null
    }
  ],
  "workExperience": [
    {
      "title": string,
      "company": string,
      "duration": string,
      "description": string
    }
  ],
  "certifications": string[]
}
```

**Validation:** `resumeSchema.ts` (Zod) *(Planned)*

---

## Prompt 2 — Job Description Analysis

**File:** `backend/src/llm/prompts.ts` → `JD_ANALYSIS_PROMPT` *(Planned)*

**Purpose:** Parse a job description into structured hiring criteria.

**System Prompt:**
```
You are an expert job description analyst. Your task is to extract structured hiring
criteria from the provided job description.

Rules:
- Separate "required" skills (must-have) from "preferred" skills (nice-to-have).
  If the JD does not make this distinction, place all skills in requiredSkills.
- Extract the role title exactly as written.
- For requiredExperience, capture the years and type (e.g., "5+ years of software engineering").
- For educationRequirements, capture the stated minimum education level.
- Certifications are only those explicitly mentioned.
- Keywords are meaningful technical or domain terms from the JD.
- Respond ONLY with valid JSON matching the specified schema.
```

**User Prompt:**
```
Analyze the following job description and extract structured hiring criteria.

JOB DESCRIPTION:
{jobDescriptionText}

Respond with a JSON object matching this exact schema:
{
  "roleTitle": string,
  "requiredSkills": string[],
  "preferredSkills": string[],
  "requiredExperience": string,
  "educationRequirements": string,
  "certifications": string[],
  "responsibilities": string[],
  "keywords": string[]
}
```

**Validation:** `jobSchema.ts` (Zod) *(Planned)*

---

## Prompt 3 — Matching Analysis

**File:** `backend/src/llm/prompts.ts` → `MATCHING_PROMPT` *(Planned)*

**Purpose:** Evaluate a candidate against the job description and produce component scores with justification.

**System Prompt:**
```
You are an expert technical recruiter. Your task is to evaluate a candidate resume
against a job description and provide a structured analysis.

Rules:
- Base all scores and analysis ONLY on the provided resume and job description.
- Do NOT use external knowledge about companies, universities, or technologies.
- Skills score (0–100): How well do the candidate's skills match required + preferred skills?
  Weight required skills more heavily than preferred skills.
- Experience score (0–100): How well does the candidate's experience (years, relevance, seniority)
  match the job's stated requirements?
- Education score (0–100): How well does the candidate's education meet the stated requirements?
  A matching degree scores 100; a related field scores 70–85; no degree scores 0–30.
- Certification score (0–100): 100 if all required certifications match, proportionally lower otherwise.
  If no certifications are required, score 70 as neutral.
- Semantic fit score (0–100): Overall contextual alignment — industry background, role relevance,
  vocabulary match, tone of experience.
- matchedSkills: only list skills present in BOTH the resume and the job description.
- missingSkills: list required or preferred skills NOT found in the resume.
- strengths: 2–4 specific, evidence-based strengths relevant to this role.
- gaps: 2–4 specific, evidence-based gaps relevant to this role.
- recommendation must be one of: STRONG_HIRE, HIRE, MAYBE, REJECT.
- justification must be 2–4 sentences explaining the recommendation using specific evidence.
- confidence: HIGH if resume is detailed and complete; MEDIUM if some fields are vague;
  LOW if the resume is sparse or unreadable.
- Respond ONLY with valid JSON matching the specified schema.
```

**User Prompt:**
```
Evaluate this candidate against the job description.

CANDIDATE RESUME (structured):
{parsedResumeJson}

JOB DESCRIPTION (structured):
{analyzedJobJson}

Respond with a JSON object matching this exact schema:
{
  "matchedSkills": string[],
  "missingSkills": string[],
  "strengths": string[],
  "gaps": string[],
  "experienceAnalysis": string,
  "educationAnalysis": string,
  "skillsScore": number,
  "experienceScore": number,
  "educationScore": number,
  "certificationScore": number,
  "semanticFitScore": number,
  "recommendation": "STRONG_HIRE" | "HIRE" | "MAYBE" | "REJECT",
  "justification": string,
  "confidence": "HIGH" | "MEDIUM" | "LOW"
}
```

**Validation:** `matchSchema.ts` (Zod) *(Planned)*

---

## Error Handling Strategy

```
LLM call
  │
  ├─► Success → Zod.parse → OK
  │
  ├─► JSON parse error → retry once (with 1s delay)
  │       └─► Still fails → throw LLMValidationError
  │
  ├─► Zod validation failure → throw LLMValidationError
  │
  ├─► Network timeout → throw LLMTimeoutError
  │
  └─► Rate limit (429) → retry with exponential backoff (max 2 retries)
```

---

## Score Clamping

All LLM-produced component scores are **clamped to [0, 100]** before being passed to the scoring formula:

```typescript
const clamp = (n: number) => Math.max(0, Math.min(100, n));
```

This protects against hallucinated out-of-range values.

---

## Design Rationale

| Decision | Rationale |
|---|---|
| Structured JSON output | Eliminates text parsing; directly Zod-validatable |
| Three separate prompts | Single-responsibility; easier to debug and tune individually |
| LLM provides component scores, not overall score | Ensures deterministic, consistent final scoring |
| System + user prompt separation | System prompt sets permanent behavior; user prompt provides per-call data |
| Safety rules in every prompt | Prevents hallucination regardless of which prompt is called |

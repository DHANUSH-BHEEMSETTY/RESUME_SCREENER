# AI Design and Prompts

> **Phase 3 complete.** Resume extraction LLM pipeline is implemented and tested.
> Job description analysis and matching prompts are planned for Phases 4–5.

---

## Overview

Smart Resume Screener uses **Google Gemini 1.5 Flash** as its LLM provider.

All LLM calls produce **structured JSON output** using Gemini's `responseMimeType: "application/json"` configuration. This eliminates free-form text parsing and makes responses directly validatable with Zod schemas.

### Why Structured JSON Output?

| Approach | Problem |
|---|---|
| Free-form text | Requires fragile regex/string parsing; brittle |
| JSON in prompt only | Model may still add preamble or code fences |
| `responseMimeType: "application/json"` | Forces JSON-only output at the model level; most reliable |

Gemini's JSON mode constrains the model to produce syntactically valid JSON. Combined with Zod schema validation, this provides a two-layer safety net: the model produces valid JSON, and the schema ensures it matches our expected shape.

---

## Implementation Status

| Prompt | Status |
|---|---|
| Resume Extraction | ✅ Implemented |
| Job Description Analysis | ✅ Implemented |
| Matching Analysis | ✅ Implemented |

---

## LLM Provider Abstraction

**File:** [`backend/src/llm/llmClient.ts`](../backend/src/llm/llmClient.ts)

```typescript
export interface LLMProvider {
  complete(systemPrompt: string, userPrompt: string): Promise<string>;
}
```

The `llmClient` is exported as a singleton implementing `LLMProvider`. In production it uses `GeminiProvider`. In tests, the entire `llmClient` module is mocked via `vi.mock()` — no real API calls are ever made during testing.

**Gemini configuration:**
```typescript
{
  responseMimeType: 'application/json',
  temperature: 0.1,   // Low — factual extraction, not creative
  topP: 0.8,
  maxOutputTokens: 4096,
}
```

---

## Retry and Timeout Strategy

**File:** `backend/src/llm/llmClient.ts`

| Parameter | Value |
|---|---|
| Max retries | 2 (3 total attempts) |
| Retry delay | 1s × attempt number (exponential) |
| Timeout per attempt | 45 seconds |
| Retry conditions | Rate limit (429), network errors, timeouts, 5xx |
| No-retry conditions | Auth errors, validation errors, non-transient failures |

**Flow:**
```
LLM call attempt 1
  ├─ Success → return text
  ├─ Rate limit / network → wait 1s → attempt 2
  │     ├─ Success → return text
  │     ├─ Rate limit / network → wait 2s → attempt 3
  │     │     ├─ Success → return text
  │     │     └─ Any failure → throw LLMError
  │     └─ Non-retryable → throw LLMError
  └─ Timeout → wait 1s → retry (same flow)
```

---

## Validation Strategy

Every LLM response goes through three steps before it is used:

```
LLM raw string output
    │
    ├─ Step 1: safeJsonParse()
    │   Strip markdown code fences (```json...```)
    │   JSON.parse()
    │   If null → throw LLMError("malformed JSON")
    │
    ├─ Step 2: Zod.safeParse(schema)
    │   Validate shape, types, required fields
    │   Strip unknown fields
    │   If invalid → throw LLMError("schema validation failed")
    │
    └─ Step 3: Map to domain type
        Flatten / rename fields
        Return ParsedResume / AnalyzedJob / MatchResult
```

This ensures: no raw LLM output ever reaches application logic unvalidated.

---

## Safety Rules (Applied in All Prompts)

The following rules are embedded in every system prompt:

1. **Only extract what is explicitly stated** — never invent or infer
2. **Return `null` for missing scalars** — name, email, phone, year
3. **Return `[]` for missing arrays** — skills, education, experience, certifications
4. **Never use external knowledge** — base scores only on the provided text
5. **Normalize skill names** — "JS" → "JavaScript", "TS" → "TypeScript"
6. **Copy duration exactly as written** — do not reformat dates
7. **Respond with JSON only** — no preamble, no explanation outside JSON

---

## Prompt 1 — Resume Extraction ✅ Implemented

**Files:**
- Prompt: [`backend/src/prompts/resumeExtraction.prompt.ts`](../backend/src/prompts/resumeExtraction.prompt.ts)
- Schema: [`backend/src/validation/resumeSchema.ts`](../backend/src/validation/resumeSchema.ts)
- Service: [`backend/src/services/resumeExtraction.service.ts`](../backend/src/services/resumeExtraction.service.ts)

**Purpose:** Extract structured candidate information from raw PDF text.

### System Prompt

```
You are a professional resume parser. Your sole task is to extract structured information from resume text.

STRICT RULES — YOU MUST FOLLOW ALL OF THEM:
1. ONLY extract information explicitly stated in the provided text.
2. NEVER invent, guess, assume, or infer any field value.
3. NEVER use your general knowledge about companies, universities, or technologies.
4. If a field is not found in the text: return null for scalar fields, return [] for arrays.
5. Normalize skill names to their standard/official form (e.g., "JS" → "JavaScript", "TS" → "TypeScript").
6. For experience entries, copy duration exactly as written.
7. Extract ALL education degrees found in the text.
8. Extract ALL work experience entries found in the text, in the order they appear.
9. For certifications: only include formal credentials explicitly listed.
10. Do NOT add any explanation, commentary, or text outside the JSON structure.
11. Respond ONLY with valid JSON that matches the required schema exactly.
```

### User Prompt

```
Extract structured information from the following resume text.

RESUME TEXT:
---
{rawResumeText}
---

Respond with a JSON object that matches this EXACT schema:
{
  "candidate": {
    "name": string | null,
    "email": string | null,
    "phone": string | null
  },
  "skills": string[],
  "education": [
    { "degree": string, "institution": string, "year": string | null }
  ],
  "experience": [
    { "title": string, "company": string, "duration": string, "description": string }
  ],
  "certifications": string[]
}
```

### Output Schema (Zod)

```typescript
ResumeExtractionSchema = z.object({
  candidate: z.object({
    name: z.string().nullable(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
  }),
  skills: z.array(z.string()),
  education: z.array(z.object({
    degree: z.string().min(1),
    institution: z.string().min(1),
    year: z.string().nullable(),
  })),
  experience: z.array(z.object({
    title: z.string().min(1),
    company: z.string().min(1),
    duration: z.string().min(1),
    description: z.string(),
  })),
  certifications: z.array(z.string()),
})
```

### Mapping

The LLM output uses `experience` and a nested `candidate` object. The service maps these to the `ParsedResume` domain type:
- `candidate.name` → `candidateName`
- `experience[]` → `workExperience[]`

---

## Prompt 2 — Job Description Analysis ✅ Implemented

**Files:**
- Prompt: [`backend/src/prompts/jobAnalysis.prompt.ts`](../backend/src/prompts/jobAnalysis.prompt.ts)
- Schema: [`backend/src/validation/jobSchema.ts`](../backend/src/validation/jobSchema.ts)
- Service: [`backend/src/services/jobAnalysis.service.ts`](../backend/src/services/jobAnalysis.service.ts)

**Purpose:** Extract structured hiring criteria from a job description. Called **once per batch** — all candidates in a screening request share the same `AnalyzedJob` result.

**Key design:** The prompt explicitly instructs the model to distinguish *required* skills (must-have) from *preferred* skills (nice-to-have). If the JD doesn't make this distinction, all skills go into `requiredSkills`.

### System Prompt

```
You are an expert job description analyst. Your sole task is to extract structured hiring criteria from job description text.

STRICT RULES — YOU MUST FOLLOW ALL OF THEM:
1. ONLY extract information explicitly stated in the provided job description text.
2. NEVER invent, assume, or infer requirements that are not written.
3. NEVER add skills or qualifications based on the job title alone.
4. Distinguish REQUIRED skills (explicitly stated as required, must-have, or essential)
   from PREFERRED skills (stated as preferred, nice-to-have, a plus, or desired).
   If the job description does not distinguish them, place all skills in requiredSkills
   and leave preferredSkills as [].
5. For requiredExperience: extract the minimum years if stated, and copy the experience
   description verbatim or near-verbatim. If no years are mentioned, set years to null.
6. For educationRequirements: list each stated education requirement as a separate string.
   Return [] if none stated.
7. For certifications: only include credentials explicitly mentioned. Return [] if none stated.
8. For responsibilities: extract the listed duties and tasks. Return [] if none listed.
9. For keywords: extract meaningful technical or domain-specific terms from the full description.
10. Do NOT add any explanation, commentary, or text outside the JSON structure.
11. Respond ONLY with valid JSON that matches the required schema exactly.
```

### User Prompt

```
Analyze the following job description and extract structured hiring criteria.

JOB DESCRIPTION:
---
{jobDescriptionText}
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
```

### Output Schema (Zod)

```typescript
JobAnalysisSchema = z.object({
  roleTitle: z.string().min(1),
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  requiredExperience: z.object({
    years: z.number().nullable(),
    description: z.string(),
  }),
  educationRequirements: z.array(z.string()),
  certifications: z.array(z.string()),
  responsibilities: z.array(z.string()),
  keywords: z.array(z.string()),
})
```

### Input Validation

Before calling the LLM, the service validates:
- Minimum length: 50 characters → throws `ValidationError`
- Maximum length: 15,000 characters → throws `ValidationError`

This prevents unnecessary LLM calls on garbage input and protects against prompt injection via extremely large inputs.

---

## Prompt 3 — Matching Analysis ✅ Implemented

**Files:**
- Prompt: [`backend/src/prompts/matching.prompt.ts`](../backend/src/prompts/matching.prompt.ts)
- Schema: [`backend/src/validation/matchSchema.ts`](../backend/src/validation/matchSchema.ts)
- Service: [`backend/src/services/matchingEngine.service.ts`](../backend/src/services/matchingEngine.service.ts)
- Scorer: [`backend/src/services/scoreCalculator.ts`](../backend/src/services/scoreCalculator.ts)

**Purpose:** Evaluate one resume against one `AnalyzedJob`. Returns component scores and written analysis. Called **once per candidate** per batch. The overall score is then computed deterministically by `scoreCalculator.ts`.

**Key design — LLM never decides the final score.** The LLM provides component scores (0–100) and written analysis. The final overall score is always computed by the backend using the fixed weighted formula.

### Scoring Formula (Deterministic)

```
overallScore = round(
  skillsScore     × 0.45   (45%)
  experienceScore × 0.30   (30%)
  educationScore  × 0.10   (10%)
  certScore       × 0.05   (5%)
  semanticScore   × 0.10   (10%)
)
```

All LLM component scores are **clamped to [0, 100]** before the formula runs.

### System Prompt (excerpt)

```
You are an expert technical recruiter performing a structured candidate evaluation.
Your task is to evaluate a candidate's resume against a job description.

STRICT RULES:
1. Base ALL scores and analysis ONLY on the provided resume and job description.
2. NEVER invent skills, experience, or qualifications.
4. matchedSkills: ONLY skills in BOTH the resume AND job required/preferred lists.
5. missingSkills: required or preferred skills NOT present in the resume.
...
11. Scores must be integers from 0 to 100. Use the scoring guidelines.
12. recommendation must be: STRONG_HIRE, HIRE, MAYBE, or REJECT.
13. justification: 2–4 sentences with specific evidence from resume and JD.
14. confidence: 0–100 — how complete/reliable is the resume data?
```

See the full scoring guidelines per component in [`matching.prompt.ts`](../backend/src/prompts/matching.prompt.ts).

### Output Schema (Zod)

```typescript
MatchSchema = z.object({
  skillsScore: z.number().int().min(0).max(100),
  experienceScore: z.number().int().min(0).max(100),
  educationScore: z.number().int().min(0).max(100),
  certificationScore: z.number().int().min(0).max(100),
  semanticScore: z.number().int().min(0).max(100),
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  preferredSkillsMatched: z.array(z.string()),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  experienceAnalysis: z.string(),
  educationAnalysis: z.string(),
  recommendation: z.enum(['STRONG_HIRE', 'HIRE', 'MAYBE', 'REJECT']),
  justification: z.string().min(1),
  confidence: z.number().int().min(0).max(100),
})
```

---

## Score Clamping

All LLM-produced component scores will be **clamped to [0, 100]** before the scoring formula is applied:

```typescript
const clamp = (n: number) => Math.max(0, Math.min(100, n));
```

---

## Design Rationale

| Decision | Rationale |
|---|---|
| Structured JSON mode | Eliminates text parsing; directly Zod-validatable |
| Three separate prompts | Single-responsibility; easier to debug and tune individually |
| LLM provides component scores, not overall score | Deterministic, consistent final scoring |
| System + user prompt separation | System prompt sets permanent behavior; user prompt provides per-call data |
| Safety rules in every prompt | Prevents hallucination regardless of which prompt is called |
| `safeJsonParse` strips code fences | Some Gemini responses wrap JSON in markdown; this makes extraction robust |
| Low temperature (0.1) | Factual extraction — reduces creativity, reduces hallucination |
| JD analyzed once per batch | Avoids redundant LLM calls; all candidates use the same `AnalyzedJob` |
| Input length validation before LLM call | Prevents unnecessary API usage; protects against oversized inputs |

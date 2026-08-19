# Development Log

A phase-by-phase record of what was built, what decisions were made, and what was learned.

---

## Phase 0 — Architecture and Project Planning

**Date:** 2026-08-19

### Implemented

- Initialized Git repository
- Created `README.md` with full project overview and planned architecture
- Created `docs/architecture.md` — system diagram, component responsibilities, data flow
- Created `docs/api.md` — full API reference with request/response examples
- Created `docs/ai-and-prompts.md` — LLM strategy, prompt templates, safety rules
- Created `docs/scoring.md` — scoring formula, weights, guidelines, rationale
- Created `docs/development-log.md` — this file
- Created `docs/testing.md` — planned test strategy
- Created `docs/security.md` — security considerations
- Created `docs/demo.md` — demo walkthrough (planned)

### Files Added

```
README.md
docs/architecture.md
docs/api.md
docs/ai-and-prompts.md
docs/scoring.md
docs/development-log.md
docs/testing.md
docs/security.md
docs/demo.md
```

### Technical Decisions

| Decision | Rationale |
|---|---|
| Google Gemini 1.5 Flash as LLM | Free tier available; strong JSON output mode; fast response |
| Three separate LLM prompts | Single-responsibility design; easier to tune and debug |
| Zod for LLM response validation | TypeScript-native; prevents runtime crashes from malformed LLM JSON |
| pdf-parse for PDF extraction | No native dependencies; simple Node.js Buffer API |
| multer with memory storage | Files never persisted to disk; privacy-preserving |
| Deterministic scoring formula | Ensures consistency and auditability; LLM provides inputs only |
| Vite for frontend | Fast HMR; first-class TypeScript; Tailwind integration |
| Recharts for visualization | Lightweight; composable; React-native; no canvas deps |

### Verification

- Git initialized: ✅
- All documentation files created: ✅
- README structure complete: ✅
- No source code yet (correct for Phase 0): ✅

### Known Limitations

- No source code exists yet
- All features marked as "Planned"
- LLM prompts are draft — will be refined during Phases 3–5

### Commit

`docs: establish project architecture and development plan`

---

## Phase 1 — Backend Foundation

**Date:** 2026-08-19

### Implemented

- `backend/package.json` — all runtime + dev dependencies
- `backend/tsconfig.json` — TypeScript config (ES2022, strict, CommonJS)
- `backend/.env.example` — env variable template (committed without real keys)
- `backend/src/config/env.ts` — validated env config; throws at startup if `GEMINI_API_KEY` missing
- `backend/src/types/index.ts` — all shared TypeScript interfaces (`ParsedResume`, `AnalyzedJob`, `MatchResult`, `ScoredCandidate`, `ScreeningResponse`, etc.)
- `backend/src/utils/logger.ts` — structured logger; debug only in dev; never logs resume content
- `backend/src/utils/asyncHandler.ts` — async route wrapper eliminating try/catch boilerplate
- `backend/src/middleware/errorHandler.ts` — custom error classes (`AppError`, `ValidationError`, `LLMError`, `PDFExtractionError`); global Express error handler; 404 handler
- `backend/src/middleware/upload.ts` — multer memory storage, PDF MIME filter, 10 MB limit, max 20 files
- `backend/src/middleware/requestLogger.ts` — logs method, path, status, duration; never logs body
- `backend/src/controllers/healthController.ts` — `GET /api/health` implementation
- `backend/src/controllers/screeningController.ts` — `POST /api/screen` with input validation stub (501 response until pipeline built)
- `backend/src/routes/healthRoutes.ts`
- `backend/src/routes/screeningRoutes.ts` — multer middleware wired
- `backend/src/routes/resumeRoutes.ts` — 501 stub
- `backend/src/routes/jobRoutes.ts` — 501 stub
- `backend/src/server.ts` — Express app with CORS, JSON parsing, all routes, graceful shutdown

### Files Added

```
backend/
├── .env.example
├── package.json
├── tsconfig.json
└── src/
    ├── config/env.ts
    ├── types/index.ts
    ├── utils/logger.ts
    ├── utils/asyncHandler.ts
    ├── middleware/errorHandler.ts
    ├── middleware/upload.ts
    ├── middleware/requestLogger.ts
    ├── controllers/healthController.ts
    ├── controllers/screeningController.ts
    ├── routes/healthRoutes.ts
    ├── routes/screeningRoutes.ts
    ├── routes/resumeRoutes.ts
    ├── routes/jobRoutes.ts
    └── server.ts
```

### Technical Decisions

| Decision | Rationale |
|---|---|
| `tsx` for dev server | Faster than ts-node; no separate compilation step; good Node 22 support |
| Custom error classes extending `AppError` | Centralizes status code assignment; eliminates repeated `res.status()` logic |
| Multer memory storage | Resumes never touch disk; privacy-preserving by design |
| `requireEnv()` throws at startup | Fail-fast on misconfiguration; better than runtime crash on first LLM call |
| Request logger never logs body | Resume text is PII; protection against accidental logging |
| `asyncHandler` wrapper | Removes try/catch from every async controller; errors reach global handler automatically |

### Verification

| Check | Result |
|---|---|
| `tsc --noEmit` | ✅ Zero errors |
| Server starts | ✅ Listening on port 3001 |
| `GET /api/health` → 200 | ✅ Returns `{status: "ok", llm: "connected", model: "gemini-1.5-flash"}` |
| `GET /api/unknown` → 404 | ✅ Returns `{error: "Route not found: GET /api/unknown"}` |
| `GET /api/resumes` → 501 | ✅ Stub response |
| `GET /api/jobs` → 501 | ✅ Stub response |

### Known Limitations

- `POST /api/screen` returns 501 — LLM pipeline not yet wired
- No automated tests for this phase (planned for Phase 9)
- multer 1.x has known deprecation — 2.x migration deferred; 1.x remains functional for this use case

### Commit

`feat(backend): add express api foundation`

---

## Phase 2+3 — PDF Extraction and Structured Resume AI Extraction

**Date:** 2026-08-19  
*(Phases combined: PDF extraction was implemented as a prerequisite for resume extraction)*

### Implemented

**Phase 2 — PDF Extraction**
- `backend/src/services/pdfExtractor.ts` — wraps `pdf-parse`; validates minimum text length (50 chars); throws `PDFExtractionError` on failure; never logs resume content

**Phase 3 — LLM Resume Extraction**
- `backend/src/llm/llmClient.ts` — `LLMProvider` interface + `GeminiProvider` implementation; JSON mode (`responseMimeType: "application/json"`); temperature 0.1; retry (max 2, exponential backoff); 45s timeout per attempt
- `backend/src/prompts/resumeExtraction.prompt.ts` — 11-rule system prompt + user prompt template with schema specification
- `backend/src/validation/resumeSchema.ts` — Zod schema for LLM output; nullable scalars; typed arrays; unknown fields stripped
- `backend/src/services/resumeExtraction.service.ts` — orchestrates LLM call → JSON parse → Zod validate → domain type mapping; strips markdown code fences; detailed error logging
- `backend/vitest.config.ts` — Vitest configuration with node environment and setup file
- `backend/src/__tests__/setup.ts` — sets env vars before module import to prevent startup validation failure in tests
- `backend/src/__tests__/resumeExtraction.test.ts` — 15 tests: happy path, null/empty fields, markdown fence stripping, error handling (malformed JSON, schema failure, LLM errors), schema edge cases

### Files Added

```
backend/src/llm/llmClient.ts
backend/src/prompts/resumeExtraction.prompt.ts
backend/src/validation/resumeSchema.ts
backend/src/services/pdfExtractor.ts
backend/src/services/resumeExtraction.service.ts
backend/vitest.config.ts
backend/src/__tests__/setup.ts
backend/src/__tests__/resumeExtraction.test.ts
```

### Technical Decisions

| Decision | Rationale |
|---|---|
| `responseMimeType: "application/json"` | Forces syntactically valid JSON at model level; removes need for text parsing |
| Temperature 0.1 | Factual extraction — reduces creativity, reduces hallucination risk |
| Nested `candidate` object in LLM prompt | Cleaner schema; explicitly groups contact fields; mapped to flat `ParsedResume` in service layer |
| `safeJsonParse` strips code fences | Gemini occasionally wraps JSON in markdown blocks despite JSON mode; defensive stripping makes extraction robust |
| Two-layer validation (JSON parse + Zod) | LLM JSON mode guarantees syntax; Zod guarantees schema shape. Both layers needed. |
| `vi.mock` for LLM client | Enables fast, deterministic tests with no API calls; tests service logic not LLM behavior |
| Singleton `llmClient` export | Easy to replace with mock in tests; avoids re-instantiating SDK on every call |

### Verification

| Check | Result |
|---|---|
| `tsc --noEmit` | ✅ Zero errors |
| `npm test` | ✅ 15/15 tests pass |

### Known Limitations

- PDF extraction doesn't handle scanned image PDFs (no OCR)
- LLM tests use mocks — real API accuracy tested manually
- Phase 2 PDF extractor not independently tested (covered by integration in Phase 9)

### Commit

`feat(ai): add structured resume extraction`

---

## Phase 4 — Job Description Analysis

**Date:** 2026-08-19

### Implemented

- `backend/src/prompts/jobAnalysis.prompt.ts` — 11-rule system prompt; explicit required vs preferred skill distinction; structured `requiredExperience` object with `years` (nullable number) and `description`
- `backend/src/validation/jobSchema.ts` — Zod schema with `RequiredExperienceSchema` sub-object; all list fields typed as `string[]`
- `backend/src/services/jobAnalysis.service.ts` — input length validation (50–15,000 chars); LLM call; code fence stripping; Zod validation; maps to `AnalyzedJob`
- `backend/src/__tests__/jobAnalysis.test.ts` — 18 tests across 5 groups
- `backend/src/types/index.ts` — `AnalyzedJob.requiredExperience` changed from `string` to `RequiredExperience` object; `educationRequirements` changed from `string` to `string[]`

### Files Added / Modified

```
backend/src/prompts/jobAnalysis.prompt.ts     ← NEW
backend/src/validation/jobSchema.ts           ← NEW
backend/src/services/jobAnalysis.service.ts   ← NEW
backend/src/__tests__/jobAnalysis.test.ts     ← NEW
backend/src/types/index.ts                    ← MODIFIED (AnalyzedJob type update)
```

### Technical Decisions

| Decision | Rationale |
|---|---|
| `requiredExperience` as object `{ years, description }` | `years` as number enables scoring engine to compare numerically against candidate experience; `description` preserves verbatim context |
| `educationRequirements` as `string[]` | Multiple education requirements can exist (e.g., "B.Sc. or equivalent experience"); array models this cleanly |
| Input length validation before LLM | Fail-fast on empty/garbage input; prevents wasteful API calls; protects against oversized payloads |
| JD analyzed once per batch | The `AnalyzedJob` is computed once and shared across all candidate matching calls, saving N-1 LLM calls per batch |

### Verification

| Check | Result |
|---|---|
| `tsc --noEmit` | ✅ Zero errors |
| `npm test` (all files) | ✅ 32/32 pass (15 resume + 17 JD tests) |

### Known Limitations

- LLM tests use mocks — real API accuracy verified manually
- JD analysis doesn't validate that role title is meaningful (just non-empty string)

### Commit

`feat(ai): add job description analysis`

---

## Phase 5 — AI Matching and Deterministic Scoring

**Date:** 2026-08-19

### Implemented

- `backend/src/prompts/matching.prompt.ts` — 16-rule system prompt + user prompt; requests component scores (0–100) and written evidence-based analysis (strengths, gaps, justification); ensures explainability
- `backend/src/validation/matchSchema.ts` — strict Zod schema for matching analysis; scores validated as integers [0, 100]; recommendation as enum
- `backend/src/services/scoreCalculator.ts` — fixed deterministic weighted formula for overall score; clamps LLM component scores to [0, 100] to prevent hallucinated inputs
- `backend/src/services/matchingEngine.service.ts` — calls LLM with resume+JD JSON, extracts code fences, validates with Zod, and maps to `MatchResult`
- `backend/src/__tests__/matchingEngine.test.ts` — 21 tests: strong/average/weak candidates, missing skills/experience, field mapping, code fence stripping, error handling
- `backend/src/__tests__/scoreCalculator.test.ts` — 20 tests: formula correctness, weight verification, rounding, clamping, shortlist boundary
- `docs/scoring.md` — detailed breakdown of scoring methodology, component definitions, weight rationale, and deterministic nature

### Files Added / Modified

```
backend/src/prompts/matching.prompt.ts        ← NEW
backend/src/validation/matchSchema.ts         ← NEW
backend/src/services/matchingEngine.service.ts ← NEW
backend/src/services/scoreCalculator.ts       ← NEW
backend/src/__tests__/matchingEngine.test.ts  ← NEW
backend/src/__tests__/scoreCalculator.test.ts ← NEW
backend/src/types/index.ts                    ← MODIFIED (MatchResult updated)
```

### Technical Decisions

| Decision | Rationale |
|---|---|
| Deterministic final scoring | The backend always controls the final score calculation via fixed weights, guaranteeing reproducibility and preventing LLM hallucination of final scores. |
| Clamping LLM score outputs | `Math.max(0, Math.min(100, n))` protects the calculation formula from edge-case LLM failures (e.g., returning 105 or -10) |
| Evidence-based analysis fields | Prompts specifically request strengths, gaps, and justification with citations from the text to make decisions fully explainable |

### Verification

| Check | Result |
|---|---|
| `tsc --noEmit` | ✅ Zero errors |
| `npm test` (all files) | ✅ 65/65 pass (across 4 test files) |

### Known Limitations

- LLM tests are mocked — real semantic evaluation accuracy needs manual verification
- Scoring weights are hardcoded — could be exposed to config later if needed

### Commit

`feat(ai): add resume matching and scoring engine`

---

## Phase 6 — Batch Screening and Ranking

**Date:** 2026-08-19

### Implemented

- `backend/src/services/screeningPipeline.service.ts` — Orchestrates the full candidate screening pipeline. Takes a job description text and an array of PDF buffers. Runs extraction, matching, and scoring in parallel using `Promise.allSettled`.
- **Ranking & Shortlisting**: Candidates are sorted descending by their deterministically calculated overall score. Candidates with a score >= the configurable threshold (default 75) are marked as shortlisted.
- **Error Isolation**: Individual candidate failures (e.g. corrupted PDF or LLM error on one candidate) are caught and returned in a `failed` array without crashing the entire batch process.
- `backend/src/types/index.ts` — Updated `ScreeningSummary` and `ScreeningResponse` to track `failed` candidates.
- `backend/src/__tests__/screeningPipeline.test.ts` — 4 tests ensuring error isolation, correct ranking, and threshold application.

### Files Added / Modified

```
backend/src/services/screeningPipeline.service.ts ← NEW
backend/src/__tests__/screeningPipeline.test.ts   ← NEW
backend/src/types/index.ts                        ← MODIFIED
docs/testing.md                                   ← MODIFIED
README.md                                         ← MODIFIED
```

### Technical Decisions

| Decision | Rationale |
|---|---|
| `Promise.allSettled` | Batch screening is slow; a failure on resume 49/50 shouldn't invalidate the 48 successful parses. |
| Threshold config | Allowing the threshold to be passed in `ScreeningOptions` makes the service flexible for different strictness levels. |

### Verification

| Check | Result |
|---|---|
| `tsc --noEmit` | ✅ Zero errors |
| `npm test` (all files) | ✅ 69/69 pass (across 5 test files) |

### Commit

`feat(screening): add candidate ranking and shortlisting`

---

## Phase 7 — Recruiter Dashboard

**Date:** 2026-08-19

### Implemented

- **Frontend React Application**: Initialized a Vite + React + TypeScript project in `/frontend`.
- **Styling**: Configured Tailwind CSS v3 with a premium dark-mode aesthetic (slate backgrounds, glassmorphism, indigo accents).
- **API Client**: Created `frontend/src/api/client.ts` using Axios to communicate with `POST /api/screen`.
- **Backend Fix**: Updated `backend/src/controllers/screeningController.ts` to actually invoke the screening pipeline instead of returning a 501 stub.
- **UI Components**:
  - `Navbar`, `JobDescriptionInput`, `ResumeDropzone` for candidate input.
  - `ScreeningSummaryCards`, `CandidateTable` for high-level result overviews.
  - `CandidateDetails` for deep dives into AI justification, strengths, gaps, and score rings.
  - `ScoreRing` and `Badge` for data visualization.
- **State Management**: Orchestrated flow in `App.tsx` handling loading states, errors, and conditional rendering of results vs. candidate details.

### Files Added / Modified

```
frontend/ (Vite initialization & dependencies)
frontend/src/api/client.ts                        ← NEW
frontend/src/components/*                         ← NEW
frontend/src/types/api.ts                         ← NEW (copied from backend)
frontend/src/App.tsx                              ← MODIFIED
frontend/src/index.css                            ← MODIFIED
backend/src/controllers/screeningController.ts    ← MODIFIED
docs/architecture.md                              ← MODIFIED
README.md                                         ← MODIFIED
```

### Technical Decisions

| Decision | Rationale |
|---|---|
| Single Page State (No Router) | Given the limited scope of the dashboard (Input -> Results -> Details), managing state in `App.tsx` via conditional rendering is cleaner than setting up React Router. |
| `import type` | Enabled strict type isolation using Vite's `verbatimModuleSyntax` config to ensure no unused imports affect the build. |
| Copied Shared Types | Rather than linking the backend workspace directly, copying `index.ts` to `api.ts` keeps the frontend strictly separated without complex build configurations. |

### Verification

| Check | Result |
|---|---|
| Frontend Build (`vite build`) | ✅ Succeeded |
| TypeScript check (`tsc`) | ✅ Zero errors |

### Commit

`feat(frontend): add recruiter screening dashboard`

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

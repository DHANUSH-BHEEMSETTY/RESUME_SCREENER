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

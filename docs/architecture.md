# Architecture

> **Phase 1 complete.** Backend Express foundation is live.
> Frontend and LLM pipeline are planned.

## Implementation Status

| Component | Status |
|---|---|
| Express server + CORS + middleware | ✅ Implemented |
| Environment configuration (`env.ts`) | ✅ Implemented |
| Custom error classes + global handler | ✅ Implemented |
| Request logger middleware | ✅ Implemented |
| PDF upload middleware (multer) | ✅ Implemented |
| `GET /api/health` | ✅ Implemented |
| `POST /api/screen` (stub, validation only) | ✅ Implemented |
| `GET /api/resumes` (stub) | ✅ Implemented |
| `GET /api/jobs` (stub) | ✅ Implemented |
| PDF extraction service | 🔲 Planned (Phase 2) |
| LLM resume parser | 🔲 Planned (Phase 3) |
| LLM job analyzer | 🔲 Planned (Phase 4) |
| Matching engine | 🔲 Planned (Phase 5) |
| Score calculator | 🔲 Planned (Phase 5) |
| Ranker | 🔲 Planned (Phase 6) |
| React frontend | ✅ Implemented |

---

## Overview

Smart Resume Screener uses a clean, two-tier architecture:

- **Backend** — Node.js + Express REST API that handles PDF extraction, LLM calls, scoring, and ranking
- **Frontend** — React + Vite SPA that provides the recruiter-facing dashboard

### Frontend (`/frontend`) - ✅ Implemented

Built with **React**, **Vite**, **TypeScript**, and **Tailwind CSS**.
- **`src/App.tsx`**: State orchestration and dashboard layout.
- **`src/api/client.ts`**: Typed Axios client connecting to backend.
- **`src/components/`**: Reusable UI elements (`JobDescriptionInput`, `ResumeDropzone`, `CandidateTable`, `CandidateDetails`, `ScoreRing`).
- **`src/types/api.ts`**: Shared types bridging backend responses.

Communication between tiers is via a single REST endpoint (`POST /api/screen`).

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│                   React + Vite + Tailwind                   │
│                                                             │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  Upload Form │  │ Candidate Table  │  │ Detail View  │  │
│  └──────────────┘  └──────────────────┘  └──────────────┘  │
└─────────────────────────────────────┬───────────────────────┘
                                      │ POST /api/screen
                                      │ (multipart/form-data)
                                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  Express REST API                           │
│                  Node.js + TypeScript                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              screeningController.ts                 │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                   │
│         ┌───────────────┼───────────────┐                  │
│         ▼               ▼               ▼                  │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │pdfExtractor │ │ resumeParser │ │  jdAnalyzer  │         │
│  │  (pdf-parse)│ │  (LLM call)  │ │  (LLM call)  │         │
│  └──────┬──────┘ └──────┬───────┘ └──────┬───────┘         │
│         │               │               │                  │
│         └───────────────┼───────────────┘                  │
│                         ▼                                   │
│                ┌─────────────────┐                         │
│                │ matchingEngine  │                         │
│                │   (LLM call)    │                         │
│                └────────┬────────┘                         │
│                         ▼                                   │
│                ┌─────────────────┐                         │
│                │ scoreCalculator │                         │
│                │  (deterministic)│                         │
│                └────────┬────────┘                         │
│                         ▼                                   │
│                ┌─────────────────┐                         │
│                │     ranker      │                         │
│                │ (sort+shortlist)│                         │
│                └────────┬────────┘                         │
│                         ▼                                   │
│                   JSON Response                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│               Google Gemini 1.5 Flash                       │
│                    (External LLM)                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Responsibilities

### Frontend

| Component | Responsibility |
|---|---|
| `UploadForm` | Accept PDF files and job description text, submit to API |
| `CandidateTable` | Display ranked candidates with scores and shortlist badge |
| `CandidateDetail` | Show full analysis: skill breakdown, match analysis, justification |
| `ScoreBreakdown` | Radar/bar chart of component scores |
| `SkillsAnalysis` | Visual matched vs missing skills |
| `useScreening` hook | Manage API call state (loading, error, result) |
| `api.ts` | Axios-based API client |

### Backend

| Module | Responsibility |
|---|---|
| `server.ts` | Express app bootstrap, middleware registration |
| `screeningRoutes.ts` | Route definitions |
| `screeningController.ts` | Request parsing, orchestration, response formatting |
| `pdfExtractor.ts` | Convert PDF buffer → raw text string |
| `resumeParser.ts` | LLM call: raw text → structured `ParsedResume` |
| `jdAnalyzer.ts` | LLM call: JD text → structured `AnalyzedJob` |
| `matchingEngine.ts` | LLM call: resume + job → `MatchResult` with component scores |
| `scoreCalculator.ts` | Apply deterministic formula → `ScoredCandidate` |
| `ranker.ts` | Sort by overall score, assign rank, apply shortlist threshold |
| `llmClient.ts` | Gemini SDK wrapper, retry logic, error handling |
| `prompts.ts` | All LLM prompt templates (centralized) |
| `resumeSchema.ts` | Zod schema for `ParsedResume` |
| `jobSchema.ts` | Zod schema for `AnalyzedJob` |
| `matchSchema.ts` | Zod schema for `MatchResult` |
| `env.ts` | Validate and export environment variables |
| `upload.ts` | Multer middleware for PDF file handling |
| `errorHandler.ts` | Global Express error handler |

---

## Data Flow Detail

### 1. PDF Extraction

```
multer (memory storage)
  └─► Buffer[] (one per uploaded file)
        └─► pdf-parse(buffer)
              └─► string (raw text)
```

### 2. Resume Parsing (per candidate)

```
rawText: string
  └─► LLM: Resume Extraction Prompt
        └─► JSON string
              └─► Zod.parse(resumeSchema)
                    └─► ParsedResume
```

### 3. Job Description Analysis (once per request)

```
jobDescriptionText: string
  └─► LLM: JD Analysis Prompt
        └─► JSON string
              └─► Zod.parse(jobSchema)
                    └─► AnalyzedJob
```

### 4. Matching (per candidate)

```
{ ParsedResume, AnalyzedJob }
  └─► LLM: Matching Analysis Prompt
        └─► JSON string
              └─► Zod.parse(matchSchema)
                    └─► MatchResult
```

### 5. Deterministic Scoring

```
MatchResult (component scores 0–100)
  └─► scoreCalculator
        └─► overallScore = round(
              skills*0.45 + experience*0.30 +
              education*0.10 + cert*0.05 + semantic*0.10
            )
```

### 6. Ranking

```
ScoredCandidate[]
  └─► sort by overallScore DESC (tiebreak: skillsScore DESC)
        └─► assign rank (1 = best)
              └─► shortlisted = overallScore >= SHORTLIST_THRESHOLD
```

---

## LLM Safety Design

- LLM **never** sets the final `overallScore` — that is computed deterministically
- LLM outputs are **always** validated against Zod schemas
- Malformed JSON triggers a **single retry** before returning an error
- Prompts explicitly instruct the model **not to invent** information
- Resume text is **not logged** to protect candidate privacy

---

## Planned Project Structure

```
resume_screener/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── env.ts
│   │   ├── controllers/
│   │   │   └── screeningController.ts
│   │   ├── services/
│   │   │   ├── pdfExtractor.ts
│   │   │   ├── resumeParser.ts
│   │   │   ├── jdAnalyzer.ts
│   │   │   ├── matchingEngine.ts
│   │   │   ├── scoreCalculator.ts
│   │   │   └── ranker.ts
│   │   ├── llm/
│   │   │   ├── llmClient.ts
│   │   │   └── prompts.ts
│   │   ├── validation/
│   │   │   ├── resumeSchema.ts
│   │   │   ├── jobSchema.ts
│   │   │   └── matchSchema.ts
│   │   ├── middleware/
│   │   │   ├── upload.ts
│   │   │   └── errorHandler.ts
│   │   ├── routes/
│   │   │   └── screeningRoutes.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── server.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── UploadForm/
│   │   │   ├── CandidateTable/
│   │   │   ├── CandidateDetail/
│   │   │   ├── ScoreBreakdown/
│   │   │   └── SkillsAnalysis/
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx
│   │   │   └── CandidateDetailPage.tsx
│   │   ├── hooks/
│   │   │   └── useScreening.ts
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── package.json
│
├── docs/
├── README.md
└── .gitignore
```

---

## Technology Decisions

| Decision | Choice | Rationale |
|---|---|---|
| LLM Provider | Google Gemini 1.5 Flash | Free tier, strong JSON output, fast |
| PDF Extraction | pdf-parse | No native deps, simple Node.js buffer API |
| Schema Validation | Zod | TypeScript-native, works well for LLM output parsing |
| File Uploads | multer (memory) | Files never written to disk |
| Frontend Build | Vite | Fast HMR, first-class TypeScript support |
| Styling | Tailwind CSS | Required by spec |
| Charts | Recharts | Lightweight, composable, React-native |

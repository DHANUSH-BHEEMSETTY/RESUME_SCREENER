# Smart Resume Screener

> An AI-powered resume screening tool that matches candidates to job descriptions with explainable, structured scoring.

[![Status](https://img.shields.io/badge/status-in%20development-yellow)]()
[![Node](https://img.shields.io/badge/node-22.x-green)]()
[![TypeScript](https://img.shields.io/badge/typescript-5.x-blue)]()

---

## Overview

Smart Resume Screener automates the initial resume screening process for recruiters. It accepts one or more PDF resumes and a plain-text job description, then uses a Large Language Model (LLM) to extract structured data and perform semantic matching — producing ranked, scored, and shortlisted candidates with clear written justifications.

The system is designed to be **explainable**, **reliable**, and **demo-ready** — not the most complex AI pipeline possible. Every score can be traced back to specific evidence from the resume.

---

## Problem Statement

Manual resume screening is time-consuming, subjective, and inconsistent. Recruiters screening dozens of resumes per role often miss qualified candidates or apply inconsistent criteria. Smart Resume Screener solves this by:

- Extracting structured data from unstructured PDFs
- Analyzing the job description to identify what actually matters
- Applying consistent, weighted, deterministic scoring across all candidates
- Providing written explanations for every ranking decision

---

## Objectives

- Accept PDF resumes and a job description as input
- Extract candidate information (name, email, skills, education, experience, certifications)
- Analyze the job description for required and preferred criteria
- Use an LLM to semantically match candidates to the role
- Produce deterministic, weighted scores (not LLM-chosen numbers)
- Rank all candidates and identify shortlisted candidates
- Display results in a recruiter-focused dashboard
- Explain every score with textual evidence

---

## Features

> **Legend:** ✅ Implemented | 🔲 Planned

| Feature | Status |
|---|---|
| PDF resume upload (single and batch) | 🔲 Planned |
| Job description text input | 🔲 Planned |
| Structured resume data extraction (LLM) | ✅ Implemented |
| Job description analysis (LLM) | ✅ Implemented |
| Semantic resume-to-job matching (LLM) | ✅ Implemented |
| Deterministic weighted scoring | ✅ Implemented |
| Candidate ranking | ✅ Implemented |
| Shortlisting with configurable threshold | ✅ Implemented |
| Skill gap analysis | 🔲 Planned |
| Written justification per candidate | 🔲 Planned |
| Recruiter dashboard (React) | 🔲 Planned |
| Candidate detail view with score breakdown | 🔲 Planned |
| REST API foundation (Express + TypeScript) | ✅ Implemented |
| Route structure (`/api/health`, `/api/screen`, `/api/resumes`, `/api/jobs`) | ✅ Implemented |
| Environment configuration with startup validation | ✅ Implemented |
| Global error handling (custom error classes) | ✅ Implemented |
| PDF upload middleware (multer, memory storage) | ✅ Implemented |
| PDF text extraction (pdf-parse) | ✅ Implemented |
| LLM provider abstraction (Gemini 1.5 Flash, JSON mode) | ✅ Implemented |
| Resume extraction prompt with safety rules | ✅ Implemented |
| Zod schema validation for LLM responses | ✅ Implemented |
| LLM retry logic (2 retries, exponential backoff) | ✅ Implemented |
| LLM timeout handling (45s per attempt) | ✅ Implemented |
| Request validation for `/api/screen` | ✅ Implemented |
| LLM response validation (Zod) | ✅ Implemented |
| LLM error handling and retry | ✅ Implemented |

---

## Architecture

See [`docs/architecture.md`](docs/architecture.md) for full detail.

**High-level flow:**

```
Browser (React + Vite)
        │
        │  POST /api/screen  (multipart/form-data)
        ▼
Express REST API (Node.js + TypeScript)
        │
        ├─► PDF Extractor          → raw text per resume
        ├─► Resume Parser  (LLM)   → ParsedResume JSON
        ├─► JD Analyzer    (LLM)   → AnalyzedJob JSON
        ├─► Matching Engine (LLM)  → MatchResult JSON
        ├─► Score Calculator       → deterministic weighted scores
        ├─► Ranker                 → sorted + shortlisted candidates
        └─► Response               → ranked JSON → Frontend
```

### Scoring Formula

```
overallScore =
    skillsScore      × 0.45
  + experienceScore  × 0.30
  + educationScore   × 0.10
  + certScore        × 0.05
  + semanticScore    × 0.10
```

Shortlist threshold: **≥ 75** (configurable via `SHORTLIST_THRESHOLD` env var).

---

## System Workflow

1. Recruiter uploads PDF resumes and pastes a job description
2. Backend extracts text from each PDF
3. LLM extracts structured fields from each resume
4. LLM analyzes the job description into required/preferred criteria
5. LLM evaluates each candidate against the job description, returning component scores and analysis
6. Backend applies deterministic formula to compute the final overall score
7. Candidates are ranked by overall score and shortlisted if score ≥ threshold
8. Frontend displays the ranked dashboard with score breakdowns and justifications

---

## Tech Stack

### Backend

| Technology | Purpose |
|---|---|
| Node.js 22 | Runtime |
| Express | HTTP server |
| TypeScript | Type safety |
| Zod | Schema validation for LLM responses |
| multer | PDF file upload handling |
| pdf-parse | Server-side PDF text extraction |
| Google Gemini 1.5 Flash | LLM for extraction and matching |
| dotenv | Environment variable management |
| cors | Cross-origin request support |

### Frontend

| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| Vite | Build tool |
| TypeScript | Type safety |
| Tailwind CSS | Utility-first styling |
| React Router | Client-side routing |
| Axios | HTTP client |
| Recharts | Score visualization charts |
| Lucide React | Icon set |

---

## Project Structure

> **Status:** Planned — not yet created

```
resume_screener/
│
├── backend/
│   ├── src/
│   │   ├── config/         ← env validation
│   │   ├── controllers/    ← HTTP request/response
│   │   ├── services/       ← PDF extraction, parsing, scoring
│   │   ├── llm/            ← LLM provider + prompt templates
│   │   ├── validation/     ← Zod schemas
│   │   ├── middleware/      ← upload, error handler
│   │   ├── routes/         ← Express routes
│   │   └── types/          ← shared TypeScript types
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/     ← UI components
│   │   ├── pages/          ← route-level pages
│   │   ├── hooks/          ← React hooks
│   │   ├── services/       ← API client
│   │   └── types/          ← shared types
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── docs/                   ← technical documentation
└── README.md
```

---

## Resume Processing

See [`docs/ai-and-prompts.md`](docs/ai-and-prompts.md) for full prompt design.

The system extracts the following fields from each resume via a structured LLM prompt:

- Candidate name, email, phone
- Skills list
- Education (degree, institution, year)
- Work experience (title, company, duration, description)
- Certifications

Safety rules:
- Return `null` if a field cannot be found — never invent data
- Return `[]` if a list is empty
- Do not infer experience from job titles if dates are not present

---

## Job Description Analysis

The LLM analyzes the job description into:

- Role title
- Required skills (must-have)
- Preferred skills (nice-to-have)
- Required years/type of experience
- Education requirements
- Required certifications
- Key responsibilities
- Keywords

---

## LLM Approach

**Provider:** Google Gemini 1.5 Flash  
**Output format:** JSON (using `responseMimeType: "application/json"`)  
**Validation:** All LLM responses validated against Zod schemas before use  
**Error handling:** Malformed JSON → retry once → return error response

---

## Prompt Design

See [`docs/ai-and-prompts.md`](docs/ai-and-prompts.md) for full prompt text.

Three prompt stages:

1. **Resume Extraction** — extracts structured data from raw PDF text
2. **Job Description Analysis** — extracts structured criteria from JD text
3. **Matching Analysis** — evaluates candidate fit against job criteria and provides component scores with written justifications

---

## Matching Methodology

Each candidate is evaluated by the LLM against the analyzed job description. The LLM produces:

- Lists of matched and missing skills
- Qualitative analysis of experience and education fit
- Component scores (0–100) for each scoring dimension
- Written strengths, gaps, and recommendation

The LLM does **not** decide the final overall score. Component scores are inputs to a deterministic formula.

---

## Scoring Methodology

See [`docs/scoring.md`](docs/scoring.md) for full detail.

| Component | Weight |
|---|---|
| Skills Match | 45% |
| Experience Match | 30% |
| Education Match | 10% |
| Certification Match | 5% |
| Semantic Fit | 10% |

**Formula:**
```
overallScore = round(
  skills × 0.45 + experience × 0.30 +
  education × 0.10 + certification × 0.05 +
  semanticFit × 0.10
)
```

---

## Candidate Ranking

Candidates are sorted by `overallScore` descending. In the event of ties, the candidate with the higher skills score ranks higher (skills being the highest-weight component).

---

## Shortlisting

Candidates with `overallScore >= SHORTLIST_THRESHOLD` (default: 75) are marked as shortlisted. The threshold is configurable via environment variable.

---

## API Overview

See [`docs/api.md`](docs/api.md) for full API reference.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/screen` | Screen resumes against a job description |
| `GET` | `/api/health` | Health check |

---

## Setup Instructions

```bash
# 1. Clone the repository
git clone <repo-url>
cd resume_screener

# 2. Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env and set GEMINI_API_KEY to your Google Gemini API key
npm run dev

# 3. Frontend setup (new terminal) — 🔲 Planned
# cd frontend
# npm install
# npm run dev
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | ✅ | — | Google Gemini API key |
| `LLM_MODEL` | No | `gemini-1.5-flash` | Model to use |
| `SHORTLIST_THRESHOLD` | No | `75` | Minimum overall score for shortlisting |
| `MAX_PDF_SIZE_MB` | No | `10` | Maximum PDF file size |
| `PORT` | No | `3001` | Backend server port |

---

## Running Locally

```bash
# Backend (from resume_screener/backend/)
npm run dev         # development with hot reload on port 3001
npm run type-check  # TypeScript compilation check
npm run build       # production build to dist/

# Frontend — 🔲 Planned
```

---

## Testing

See [`docs/testing.md`](docs/testing.md) for strategy and commands.

```bash
# Run tests (from resume_screener/backend/)
npm test

# Run with verbose output
npx vitest run --reporter=verbose
```

**Current test status:** 69 tests passing across 5 test files.

---

## Security Considerations

See [`docs/security.md`](docs/security.md) for full detail.

Key points:
- API keys stored in `.env`, never committed
- Resume content is not logged
- All uploaded files are processed in memory and not persisted to disk
- LLM responses are validated before use

---

## Limitations

> Will be updated as implementation reveals constraints.

- Processing time increases linearly with number of resumes (sequential LLM calls)
- LLM accuracy depends on resume quality and formatting
- Non-English resumes are not explicitly supported
- PDF files with scanned images (no embedded text) cannot be extracted

---

## Future Improvements

- Parallel LLM processing for batch resumes
- Vector similarity search for large candidate pools
- Resume anonymization for bias reduction
- Export to CSV/Excel
- Webhook notifications when screening completes
- User authentication and saved screening sessions

---

## Demo

See [`docs/demo.md`](docs/demo.md) for the demo walkthrough.

---

## Git Commit History

> Will be populated as development progresses.

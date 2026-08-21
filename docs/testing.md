# Testing Strategy

---

## Test Framework

**Vitest** — compatible with TypeScript out of the box; fast execution; no separate compilation step.

**Configuration:** [`backend/vitest.config.ts`](../backend/vitest.config.ts)
**Setup file:** [`backend/src/__tests__/setup.ts`](../backend/src/__tests__/setup.ts) — sets required env vars before any module loads.

---

## Test Commands

```bash
# From resume_screener/backend/
npm test                              # Run all tests once
npx vitest run --reporter=verbose     # Verbose output with test names
npx vitest                            # Watch mode
npx vitest run --coverage             # With coverage report
```

---

## Current Test Status

| Test File | Tests | Status |
|---|---|---|
| `src/__tests__/resumeExtraction.test.ts` | 15 | ✅ All passing |
| `src/__tests__/jobAnalysis.test.ts` | 17 | ✅ All passing |
| `src/__tests__/matchingEngine.test.ts` | 21 | ✅ All passing |
| `src/__tests__/scoreCalculator.test.ts` | 12 | ✅ All passing |
| `src/__tests__/screeningPipeline.test.ts`| 4 | ✅ All passing |
| **Total** | **69** | **✅ All passing** |

---

## Overview

The testing strategy for Smart Resume Screener focuses on:

1. **Service-level unit tests** — test individual services in isolation
2. **Integration tests** — test the full screening pipeline with real (or stubbed) LLM responses
3. **API endpoint tests** — test the REST API with real HTTP requests

The test goal is to ensure correctness of the deterministic components and robustness of the LLM integration (error handling, retries, schema validation).

---

## Test Framework

**Planned:** [Vitest](https://vitest.dev/) for both backend and frontend

- Compatible with TypeScript out of the box
- Fast execution (no transpile overhead)
- Compatible with Node.js 22

---

## Backend Test Plan

### Unit Tests

#### `scoreCalculator.ts`

| Test | Input | Expected Output |
|---|---|---|
| Perfect score | All components = 100 | Overall = 100 |
| Zero score | All components = 0 | Overall = 0 |
| Weighted formula | skills=80, exp=70, edu=90, cert=50, semantic=60 | `round(80×0.45 + 70×0.30 + 90×0.10 + 50×0.05 + 60×0.10)` = 75 |
| Clamps out-of-range values | skills=150, exp=-10 | Clamped before formula |
| Rounds correctly | Raw = 74.5 | Overall = 75 |
| Rounds correctly | Raw = 74.4 | Overall = 74 |

#### `ranker.ts`

| Test | Input | Expected Output |
|---|---|---|
| Sorts descending | [75, 90, 60] | Ranked [90, 75, 60] |
| Assigns rank 1 to highest score | — | Rank 1 = highest |
| Tiebreaker: skills | Two candidates with same overall, different skills scores | Higher skills score = rank 1 |
| Shortlisting | threshold=75, scores=[90, 75, 74] | Shortlisted: [90, 75] |
| Configurable threshold | threshold=80 | Only 90 shortlisted |
| Empty input | [] | [] |
| Single candidate | [60] | Rank 1, not shortlisted |

#### `pdfExtractor.ts`

| Test | Input | Expected |
|---|---|---|
| Valid PDF | PDF buffer | Non-empty string |
| Empty PDF | Empty PDF | Throws `InvalidPDFError` |
| Non-PDF file | PNG buffer | Throws `InvalidPDFError` |
| Scanned image PDF | No embedded text | Throws `UnextractableError` |

#### `env.ts`

| Test | Scenario | Expected |
|---|---|---|
| Missing GEMINI_API_KEY | No key in env | Throws startup error |
| Invalid SHORTLIST_THRESHOLD | "abc" | Uses default (75) |
| Valid env | All required vars present | Config object returned |

### Integration Tests

#### Full Pipeline Test (with stubbed LLM)

Test the full flow from PDF upload → ranked results using a pre-defined LLM response stub.

```typescript
// Pseudocode
const mockLLMResponse = {
  resumeExtraction: parsedResumeFixture,
  jdAnalysis: analyzedJobFixture,
  matchingAnalysis: matchResultFixture,
};

const result = await screeningPipeline(pdfBuffer, jdText, mockLLMResponse);
expect(result.candidates[0].scores.overall).toBe(expectedScore);
expect(result.candidates[0].shortlisted).toBe(true);
```

#### Zod Validation Tests

| Test | Input | Expected |
|---|---|---|
| Valid resume JSON | Matches schema exactly | Parsed successfully |
| Missing required field | No `skills` field | Zod error thrown |
| Null for nullable field | `candidateName: null` | Accepted |
| Extra fields | Additional unknown fields | Stripped (Zod `.strip()`) |
| Out-of-range score | `skillsScore: 150` | Rejected by schema |

### API Endpoint Tests

#### `POST /api/screen`

| Test | Scenario | Expected |
|---|---|---|
| Valid request | 1 PDF + JD text | 200 with candidates array |
| Missing resumes | No files | 400 with error message |
| Missing JD | No jobDescription field | 400 with error message |
| Empty JD | jobDescription = " " | 400 with error message |
| Non-PDF file | Upload a .txt file | 400 |
| Multiple PDFs | 3 PDF files | 200 with 3 candidates, ranked |
| LLM failure | Mock LLM error | 503 |

#### `GET /api/health`

| Test | Scenario | Expected |
|---|---|---|
| Server running | Normal | 200 with `status: "ok"` |

---

## Frontend Test Plan

### Component Tests (Planned)

- `UploadForm` — renders, accepts files, submits correctly
- `CandidateTable` — renders ranked candidates, shortlist badge visible
- `ScoreBreakdown` — renders chart with correct values
- `SkillsAnalysis` — shows matched/missing skills correctly

---

## Test Commands

> Will be updated when tests are implemented.

```bash
# Backend tests
cd backend
npm run test

# Backend tests with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## Known Limitations (Testing)

- LLM calls in integration tests will be stubbed — real LLM API calls are not tested automatically
- PDF extraction tests require real PDF fixtures
- End-to-end browser tests (Playwright) are not planned for this assessment scope

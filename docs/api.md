# API Reference

> **Phase 1:** `GET /api/health` is implemented and live.
> `POST /api/screen` accepts requests with validation but returns 501 until the LLM pipeline is built in Phase 5.
> All other endpoints are stubs returning 501.

---

## Base URL

```
http://localhost:3001
```

---

## Endpoints

### `POST /api/screen`

Screens one or more PDF resumes against a job description.

#### Request

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| `resumes` | `File[]` | ✅ | One or more PDF resume files |
| `jobDescription` | `string` | ✅ | Plain text job description |
| `options` | `string` (JSON) | No | Optional configuration (see below) |

**Options JSON:**

```json
{
  "shortlistThreshold": 75
}
```

#### Example Request (curl)

```bash
curl -X POST http://localhost:3001/api/screen \
  -F "resumes=@john_doe.pdf" \
  -F "resumes=@jane_smith.pdf" \
  -F "jobDescription=We are looking for a Senior Software Engineer..." \
  -F 'options={"shortlistThreshold": 80}'
```

---

#### Response — `200 OK`

```json
{
  "job": {
    "roleTitle": "Senior Software Engineer",
    "requiredSkills": ["TypeScript", "Node.js", "PostgreSQL"],
    "preferredSkills": ["GraphQL", "Kubernetes"],
    "requiredExperience": "5+ years of software engineering experience",
    "educationRequirements": "Bachelor's degree in Computer Science or related field",
    "certifications": [],
    "responsibilities": [
      "Design and build scalable backend services",
      "Mentor junior engineers"
    ],
    "keywords": ["microservices", "REST API", "CI/CD", "agile"]
  },
  "candidates": [
    {
      "rank": 1,
      "shortlisted": true,
      "resume": {
        "fileName": "john_doe.pdf",
        "candidateName": "John Doe",
        "email": "john.doe@email.com",
        "phone": "+1-555-0100",
        "skills": ["TypeScript", "Node.js", "React", "PostgreSQL"],
        "education": [
          {
            "degree": "B.Sc. Computer Science",
            "institution": "State University",
            "year": "2017"
          }
        ],
        "workExperience": [
          {
            "title": "Senior Software Engineer",
            "company": "TechCorp",
            "duration": "Jan 2021 – Present",
            "description": "Led backend development for SaaS platform..."
          }
        ],
        "certifications": ["AWS Certified Developer"]
      },
      "scores": {
        "skills": 88,
        "experience": 82,
        "education": 75,
        "certification": 60,
        "semanticFit": 85,
        "overall": 84
      },
      "analysis": {
        "matchedSkills": ["TypeScript", "Node.js", "PostgreSQL"],
        "missingSkills": ["GraphQL", "Kubernetes"],
        "strengths": [
          "Strong match on required technical skills",
          "Senior-level experience aligns with role expectations",
          "Relevant domain experience in SaaS products"
        ],
        "gaps": [
          "No GraphQL experience mentioned",
          "No Kubernetes or container orchestration listed"
        ],
        "experienceAnalysis": "5+ years of total engineering experience with 3 years in a senior role. Duration aligns with the required 5+ years.",
        "educationAnalysis": "Bachelor's degree in Computer Science satisfies the stated education requirement.",
        "recommendation": "STRONG_HIRE",
        "justification": "John Doe meets all required technical skills and the experience threshold. The missing preferred skills (GraphQL, Kubernetes) are not blockers. Strong candidate.",
        "confidence": "HIGH"
      }
    }
  ],
  "summary": {
    "total": 2,
    "shortlisted": 1,
    "screened": 2,
    "processingTimeMs": 4312
  }
}
```

---

#### Error Responses

| HTTP Code | Condition | Example Body |
|---|---|---|
| `400` | Missing `resumes` field | `{ "error": "At least one resume PDF is required" }` |
| `400` | Missing `jobDescription` field | `{ "error": "Job description is required" }` |
| `400` | No files sent | `{ "error": "No files uploaded" }` |
| `413` | PDF exceeds size limit | `{ "error": "File john.pdf exceeds maximum size of 10MB" }` |
| `422` | PDF text unextractable | `{ "error": "Could not extract text from john.pdf — it may be a scanned image" }` |
| `500` | Internal server error | `{ "error": "Internal server error", "requestId": "abc123" }` |
| `503` | LLM provider unavailable | `{ "error": "LLM provider unavailable — please retry" }` |

---

### `GET /api/health`

Returns server health and LLM connectivity status.

#### Response — `200 OK`

```json
{
  "status": "ok",
  "llm": "connected",
  "model": "gemini-1.5-flash",
  "uptime": 12345,
  "timestamp": "2026-08-19T15:00:00.000Z"
}
```

---

## Data Models

### `ParsedResume`

```typescript
interface ParsedResume {
  fileName: string;
  candidateName: string | null;
  email: string | null;
  phone: string | null;
  skills: string[];
  education: EducationEntry[];
  workExperience: WorkExperienceEntry[];
  certifications: string[];
}

interface EducationEntry {
  degree: string;
  institution: string;
  year: string | null;
}

interface WorkExperienceEntry {
  title: string;
  company: string;
  duration: string;
  description: string;
}
```

### `AnalyzedJob`

```typescript
interface RequiredExperience {
  years: number | null;       // e.g. 5 — null if not explicitly stated
  description: string;        // e.g. "5+ years of full-stack development experience"
}

interface AnalyzedJob {
  roleTitle: string;
  requiredSkills: string[];       // must-have skills
  preferredSkills: string[];      // nice-to-have skills ([] if JD doesn't distinguish)
  requiredExperience: RequiredExperience;
  educationRequirements: string[];
  certifications: string[];
  responsibilities: string[];
  keywords: string[];
}
```

### `MatchResult`

```typescript
interface MatchResult {
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  gaps: string[];
  experienceAnalysis: string;
  educationAnalysis: string;
  skillsScore: number;           // 0–100, LLM-estimated
  experienceScore: number;       // 0–100, LLM-estimated
  educationScore: number;        // 0–100, LLM-estimated
  certificationScore: number;    // 0–100, LLM-estimated
  semanticFitScore: number;      // 0–100, LLM-estimated
  recommendation: 'STRONG_HIRE' | 'HIRE' | 'MAYBE' | 'REJECT';
  justification: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}
```

### `ScoredCandidate`

```typescript
interface ScoredCandidate {
  rank: number;
  shortlisted: boolean;
  resume: ParsedResume;
  scores: {
    skills: number;
    experience: number;
    education: number;
    certification: number;
    semanticFit: number;
    overall: number;
  };
  analysis: MatchResult;
}
```

### `ScreeningResponse`

```typescript
interface ScreeningResponse {
  job: AnalyzedJob;
  candidates: ScoredCandidate[];
  summary: {
    total: number;
    shortlisted: number;
    screened: number;
    processingTimeMs: number;
  };
}
```

---

## Validation Rules

| Field | Rule |
|---|---|
| `resumes` | At least 1 file required; max 20 files per request |
| `jobDescription` | Min 50 characters; max 10,000 characters |
| PDF file size | Max 10 MB per file (configurable via `MAX_PDF_SIZE_MB`) |
| PDF file type | Must be `application/pdf` |
| All LLM outputs | Validated against Zod schemas before use |
| Component scores | Clamped to 0–100 range before formula is applied |

---

## Notes

- The `/api/screen` endpoint processes resumes **sequentially** in the current implementation to avoid API rate limits.
- Processing time is approximately 2–5 seconds per resume depending on LLM latency.
- The LLM is called three times per resume (extract resume, analyze JD once, match). The JD analysis is shared across all candidates in a batch.

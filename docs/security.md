# Security Considerations

> **Status:** Planned — controls will be verified during Phase 9

---

## Overview

Smart Resume Screener handles sensitive data including resumes (personal information), API keys, and job descriptions. This document outlines the security controls that are planned and implemented.

> **Legend:** ✅ Implemented | 🔲 Planned

---

## API Key Management

| Control | Status |
|---|---|
| `GEMINI_API_KEY` stored in `.env` file | ✅ Implemented |
| `.env` excluded from Git via `.gitignore` | ✅ Implemented |
| `.env.example` committed (keys redacted) | ✅ Implemented |
| API key never logged | ✅ Implemented |
| API key never returned in any API response | ✅ Implemented |
| Startup validation fails if key is missing | ✅ Implemented |

**Rule:** The API key must never appear in:
- Source code
- Log output
- API responses
- Git history

---

## Resume Data Privacy

| Control | Status |
|---|---|
| Resumes processed in memory only (multer memory storage) | ✅ Implemented |
| Resume raw text not written to log files | ✅ Implemented |
| Resume content not returned beyond what is necessary | ✅ Implemented |
| Candidate PII (name, email, phone) only returned in API response, not logged | ✅ Implemented |
| No database persistence — data exists only for the lifetime of the request | ✅ Implemented |

**Design principle:** The server processes resumes statelessly. Once a screening response is returned, no resume data is retained by the server.

---

## File Upload Security

| Control | Status |
|---|---|
| MIME type validation (only `application/pdf` accepted) | ✅ Implemented |
| File size limit enforced (default 10 MB per file) | ✅ Implemented |
| Maximum file count per request (20 files) | ✅ Implemented |
| File contents validated by pdf-parse before LLM call | ✅ Implemented |
| Multer configured with memory storage (no disk write) | ✅ Implemented |

---

## LLM Response Safety

| Control | Status |
|---|---|
| All LLM responses validated against Zod schemas before use | ✅ Implemented |
| Malformed JSON does not crash the server (caught and handled) | ✅ Implemented |
| LLM output scores clamped to [0, 100] before formula | ✅ Implemented |
| LLM timeouts handled gracefully | ✅ Implemented |
| LLM errors return 503, not 500 with internal details | ✅ Implemented |

---

## Transport Security

| Control | Status | Note |
|---|---|---|
| HTTPS | Not planned for local dev | Use a reverse proxy (nginx/Caddy) in production |
| CORS | ✅ Implemented | Configured to allow frontend dev origin only |

---

## Input Validation

| Control | Status |
|---|---|
| `jobDescription` min/max length enforced | ✅ Implemented |
| Request body size limits (Express `bodyParser`) | ✅ Implemented |
| Unknown query parameters ignored | ✅ Implemented |

---

## Error Handling

| Control | Status |
|---|---|
| Internal stack traces not exposed in API responses | ✅ Implemented |
| All errors return structured `{ "error": "message" }` JSON | ✅ Implemented |
| Global Express error handler catches unhandled exceptions | ✅ Implemented |
| LLM provider errors translated to appropriate HTTP codes | ✅ Implemented |

---

## .gitignore Rules

The following patterns will be excluded from Git:

```
# Environment
.env
.env.local
.env.*.local

# Dependencies
node_modules/

# Build output
dist/
build/

# Logs
*.log

# OS artifacts
.DS_Store
Thumbs.db
```

---

## Out of Scope for This Assessment

The following security controls are noted but explicitly out of scope for a 2-day assessment project:

- User authentication / authorization (no login system)
- HTTPS / TLS termination (deploy-time concern)
- Rate limiting per IP (infrastructure concern)
- Audit logging (production concern)
- Data encryption at rest (no persistence)
- CSRF protection (no sessions/cookies)
- Security scanning / SAST tools

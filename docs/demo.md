# Demo Guide

> **Status:** Planned — will be updated with screenshots and a recording after Phase 10

---

## Overview

This document is the demo walkthrough for Smart Resume Screener. It is intended for:

- Assessment reviewers evaluating the project
- Anyone who wants to test the application locally

---

## Pre-Demo Setup

> Will be completed after implementation.

```bash
# 1. Clone the repo
git clone <repo-url>
cd resume_screener

# 2. Add your Gemini API key
cd backend
cp .env.example .env
# Edit .env: GEMINI_API_KEY=your_key_here

# 3. Start the backend
npm install
npm run dev

# 4. Start the frontend (new terminal)
cd ../frontend
npm install
npm run dev

# 5. Open browser
# http://localhost:5173
```

---

## Demo Scenario

### Setup

**Job Description (paste into the dashboard):**

```
Senior Full-Stack Engineer

We are looking for a Senior Full-Stack Engineer with 5+ years of experience to join our growing product team.

Required Skills:
- TypeScript
- React
- Node.js
- PostgreSQL
- REST API design

Preferred Skills:
- GraphQL
- Docker
- CI/CD (GitHub Actions or similar)
- Redis

Responsibilities:
- Design and implement scalable web applications
- Collaborate with product and design teams
- Mentor junior engineers
- Conduct code reviews

Requirements:
- Bachelor's degree in Computer Science or related field (or equivalent experience)
- 5+ years of full-stack development experience
- Strong understanding of software design patterns

Preferred:
- AWS Certified Developer certification
```

**Sample Resumes:** *(to be added to `demo/` folder)*

| File | Candidate | Expected Score | Expected Outcome |
|---|---|---|---|
| `demo/alice_chen.pdf` | Alice Chen | ~88 | STRONG_HIRE, shortlisted |
| `demo/bob_martinez.pdf` | Bob Martinez | ~72 | HIRE, borderline |
| `demo/carol_jones.pdf` | Carol Jones | ~45 | REJECT, not shortlisted |

---

## Demo Steps

### Step 1: Upload

1. Open `http://localhost:5173`
2. Click **"Upload Resumes"** and select all three sample PDF files
3. Paste the job description into the text area
4. Click **"Screen Candidates"**
5. Observe the loading indicator while the backend processes the resumes

### Step 2: Review the Dashboard

1. The ranked candidate table appears
2. Alice Chen is ranked #1 with a SHORTLISTED badge
3. Bob Martinez is ranked #2 — borderline
4. Carol Jones is ranked #3 — not shortlisted
5. Each row shows the overall score and a mini score bar

### Step 3: Candidate Detail

1. Click on **Alice Chen**
2. View the detailed analysis:
   - Score breakdown chart (radar or bar)
   - Matched skills (green): TypeScript, React, Node.js, PostgreSQL
   - Missing skills (red): GraphQL, Docker
   - Written justification explaining the score
   - Experience analysis
   - Education analysis
   - Recommendation: STRONG_HIRE

### Step 4: Compare Candidates

1. Go back to the dashboard
2. Click on **Bob Martinez**
3. Observe the lower skills score and the experience gap analysis
4. Compare his justification to Alice's

### Step 5: Adjust Threshold

> (If time permits)
1. Re-submit with `options.shortlistThreshold = 80`
2. Observe that only Alice is shortlisted

---

## Key Points to Highlight During Demo

1. **Explainability** — every score is accompanied by written evidence, not just a number
2. **No hallucination** — the LLM is instructed not to invent skills or experience
3. **Deterministic scoring** — the overall score is computed by formula, not chosen by the LLM
4. **Batch support** — multiple resumes screened in one request
5. **Clean architecture** — each service has one clear responsibility

---

## Screenshots

> Will be added after UI implementation is complete.

---

## Recording

> Will be added after Phase 10 polish is complete.

# Scoring Methodology

> **Status:** Planned — formula is finalized; implementation pending

---

## Overview

Smart Resume Screener uses a **deterministic, weighted scoring formula** to compute the overall match score for each candidate. The LLM provides component scores through its analysis, but the **final overall score is never chosen by the LLM** — it is computed by `scoreCalculator.ts` using fixed weights.

This design ensures:
- **Consistency** — the same inputs always produce the same output
- **Auditability** — the score can be traced to exact component values
- **Fairness** — no hidden LLM bias in the final ranking

---

## Scoring Components

| Component | Weight | LLM-Provided Score | Description |
|---|---|---|---|
| Skills Match | **45%** | `skillsScore` (0–100) | How well the candidate's skills match required and preferred skills |
| Experience Match | **30%** | `experienceScore` (0–100) | How well the candidate's experience matches the role's requirements |
| Education Match | **10%** | `educationScore` (0–100) | How well the candidate's education meets stated requirements |
| Certification Match | **5%** | `certificationScore` (0–100) | How well the candidate's certifications match required certs |
| Semantic Fit | **10%** | `semanticFitScore` (0–100) | Overall contextual alignment with the role |

**Total weights: 100%**

---

## Formula

```
overallScore = round(
  skillsScore      × 0.45
  + experienceScore  × 0.30
  + educationScore   × 0.10
  + certScore        × 0.05
  + semanticScore    × 0.10
)
```

The result is **rounded to the nearest integer** (0–100).

---

## Implementation

**File:** `backend/src/services/scoreCalculator.ts` *(Planned)*

```typescript
export function calculateOverallScore(match: MatchResult): number {
  const raw =
    clamp(match.skillsScore)      * 0.45 +
    clamp(match.experienceScore)  * 0.30 +
    clamp(match.educationScore)   * 0.10 +
    clamp(match.certificationScore) * 0.05 +
    clamp(match.semanticFitScore) * 0.10;

  return Math.round(raw);
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}
```

All component scores are **clamped to [0, 100]** before the formula is applied to guard against LLM hallucination.

---

## Component Score Guidelines

These guidelines are embedded in the LLM matching prompt to encourage consistent scoring.

### Skills Score (45%)

| Score Range | Meaning |
|---|---|
| 90–100 | All required skills present; most preferred skills present |
| 75–89 | All required skills present; few preferred skills |
| 60–74 | Most required skills present; gaps in 1–2 key areas |
| 40–59 | Partial required skill coverage |
| 0–39 | Major skill gaps; few required skills matched |

### Experience Score (30%)

| Score Range | Meaning |
|---|---|
| 90–100 | Experience exceeds requirements; directly relevant domain |
| 75–89 | Meets experience requirement; relevant domain |
| 60–74 | Slightly under experience requirement OR related domain |
| 40–59 | Significantly under experience requirement |
| 0–39 | Little to no relevant experience |

### Education Score (10%)

| Score Range | Meaning |
|---|---|
| 90–100 | Exact degree/field match |
| 70–89 | Related field or equivalent |
| 50–69 | Partial match (e.g., associate degree when bachelor required) |
| 30–49 | No formal degree but relevant certifications |
| 0–29 | No matching education and no stated requirement met |

> If no education is required by the job, a baseline score of 70 is used.

### Certification Score (5%)

| Score Range | Meaning |
|---|---|
| 90–100 | All required certifications present |
| 70–89 | Some required certifications present |
| 50–69 | No required certs; relevant certifications present |
| 30–49 | No certs at all; certs were required |
| 0–29 | Missing required certifications |

> If no certifications are required, a neutral score of 70 is used.

### Semantic Fit Score (10%)

| Score Range | Meaning |
|---|---|
| 90–100 | Strong domain alignment; vocabulary and context strongly match |
| 75–89 | Good overall fit; candidate background relevant to the role |
| 60–74 | Moderate fit; some domain gap but transferable skills |
| 40–59 | Weak contextual alignment |
| 0–39 | Candidate background largely misaligned with role context |

---

## Shortlisting

**Default threshold:** `overallScore >= 75`

**Environment variable:** `SHORTLIST_THRESHOLD` (integer, 0–100)

```
shortlisted = (overallScore >= SHORTLIST_THRESHOLD)
```

The threshold can be adjusted per screening batch via the optional `options.shortlistThreshold` API field.

---

## Ranking

Candidates are ranked by `overallScore` descending.

**Tiebreaker:** If two candidates have identical `overallScore`, the candidate with the higher `skillsScore` ranks higher. Skills is the highest-weight component and is the most objective discriminator.

---

## Score Interpretation Guide

| Overall Score | Label | Meaning |
|---|---|---|
| 90–100 | Exceptional Match | Exceeds requirements; prioritize immediately |
| 80–89 | Strong Match | Clearly meets requirements; recommend |
| 75–79 | Good Match | Meets most requirements; shortlisted |
| 65–74 | Moderate Match | Notable gaps; borderline |
| 50–64 | Weak Match | Significant gaps; unlikely to proceed |
| 0–49 | Poor Match | Does not meet core requirements |

---

## Weight Rationale

| Component | Weight | Rationale |
|---|---|---|
| Skills | 45% | Skills are the most directly assessable and actionable factor. They determine immediate job readiness. |
| Experience | 30% | Experience provides context that skills alone cannot — seniority, scope, delivery track record. |
| Education | 10% | Education provides foundational signal but is not always determinative, especially in technical roles. |
| Certifications | 5% | Certifications are role-specific; low weight avoids over-penalizing candidates without specific certs. |
| Semantic Fit | 10% | Captures overall alignment — domain, industry, vocabulary — not captured by discrete skill lists. |

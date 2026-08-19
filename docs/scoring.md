# Scoring Methodology

> **Phase 5 complete.** The deterministic scoring engine is implemented and fully tested.

---

## Overview

The scoring system is designed to be **explainable, deterministic, and LLM-independent** for the final score.

| Responsibility | Who does it |
|---|---|
| Component scores (0–100) | LLM — based on evidence from resume vs job |
| Written analysis (strengths, gaps, justification) | LLM — evidence-based |
| Final overall score | Backend — deterministic formula, always |
| Shortlisting decision | Backend — threshold comparison |

**The LLM never decides the final overall score.** This ensures the score is reproducible, auditable, and not subject to LLM drift or hallucination.

---

## Weighted Formula

```
overallScore = round(
  skillsScore      × 0.45   (45%)
  experienceScore  × 0.30   (30%)
  educationScore   × 0.10   (10%)
  certScore        × 0.05    (5%)
  semanticScore    × 0.10   (10%)
)
```

**Implementation:** [`backend/src/services/scoreCalculator.ts`](../backend/src/services/scoreCalculator.ts)

All LLM component scores are **clamped to [0, 100]** before the formula is applied, regardless of what the LLM returns.

---

## Weight Rationale

| Component | Weight | Rationale |
|---|---|---|
| Skills | 45% | Most directly predictive of day-one job performance. Concrete and measurable. |
| Experience | 30% | Strong proxy for capability and domain familiarity. |
| Education | 10% | Often listed as requirement, but less predictive than skills in tech roles. |
| Certifications | 5% | Validates formal knowledge but rarely a blocking criterion. |
| Semantic Fit | 10% | Overall domain/culture alignment from the full profile. |

---

## Score Ranges and Interpretations

| Range | Interpretation | Default Recommendation |
|---|---|---|
| 85–100 | Exceptional match | STRONG_HIRE |
| 70–84 | Strong match | HIRE |
| 55–69 | Moderate match | MAYBE |
| 0–54 | Weak match | REJECT |

These are guidelines. The LLM may deviate with justification (e.g., a candidate with 95 skills but 0 experience might score 75 overall but get a MAYBE recommendation with an explanation).

---

## Component Score Guidelines

### Skills Score (0–100)

| Range | Meaning |
|---|---|
| 90–100 | All required skills present; most preferred skills present |
| 75–89 | All required skills; few preferred |
| 60–74 | Most required skills; 1–2 key gaps |
| 40–59 | Partial required skill coverage |
| 0–39 | Major skill gaps |

### Experience Score (0–100)

| Range | Meaning |
|---|---|
| 90–100 | Exceeds requirement; directly relevant domain |
| 75–89 | Meets requirement; relevant domain |
| 60–74 | Slightly under OR related but different domain |
| 40–59 | Significantly under requirement |
| 0–39 | Little to no relevant experience |

### Education Score (0–100)

| Range | Meaning |
|---|---|
| 90–100 | Exact degree and field match |
| 70–89 | Related field or equivalent stated |
| 50–69 | Partial match (associate vs. bachelor) |
| 30–49 | No degree, relevant certifications present |
| 0–29 | No match, no equivalent |
| Baseline: 75 | If no education is required by the job |

### Certification Score (0–100)

| Range | Meaning |
|---|---|
| 90–100 | All required certifications present |
| 70–89 | Some required certifications |
| 50–69 | No required certs; relevant ones present |
| 30–49 | No certs at all; certs were required |
| 0–29 | Missing explicitly required certifications |
| Baseline: 70 | If no certifications are required |

### Semantic Score (0–100)

| Range | Meaning |
|---|---|
| 90–100 | Strong domain alignment; vocabulary and context match |
| 75–89 | Good overall fit; background is relevant |
| 60–74 | Moderate fit; some domain gap but transferable |
| 40–59 | Weak contextual alignment |
| 0–39 | Background largely misaligned |

---

## Shortlisting Threshold

Default: **overallScore ≥ 75**

Configurable via `SHORTLIST_THRESHOLD` environment variable (default: 75).

Candidates at or above the threshold are marked as `shortlisted: true`.

---

## Explainability

Every candidate result includes a full explanation chain:

```
"Why did this candidate score 72?"

1. skillsScore: 80 → matched TypeScript, Node.js, React (3/4 required); missing PostgreSQL
2. experienceScore: 65 → 3 years vs. 5+ years required (60–74 range)
3. educationScore: 90 → B.Sc. Computer Science — exact requirement met
4. certificationScore: 30 → AWS certification required but not present
5. semanticScore: 75 → backend development background relevant to the role

Formula: 80×0.45 + 65×0.30 + 90×0.10 + 30×0.05 + 75×0.10 = 36+19.5+9+1.5+7.5 = 73.5 → 74

Recommendation: MAYBE — candidate meets technical requirements but experience gap
and missing certification are notable risks.
```

---

## Implementation

| File | Purpose |
|---|---|
| `backend/src/services/scoreCalculator.ts` | Deterministic formula, clamping |
| `backend/src/services/matchingEngine.service.ts` | LLM matching call + Zod validation |
| `backend/src/prompts/matching.prompt.ts` | Matching system + user prompts |
| `backend/src/validation/matchSchema.ts` | Zod schema for LLM match output |

---

## Clamping

All component scores from the LLM are clamped before use:

```typescript
function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}
```

This means even if the LLM returns 110 or -5 due to a bug, the formula always operates on [0, 100] values.

---

## Verification

| Check | Result |
|---|---|
| Formula unit tests | ✅ 20 tests passing |
| Weight sum = 1.0 | ✅ Verified |
| Strong candidate score ≥ 85 | ✅ 88 (skills=90, exp=85, edu=90, cert=80, sem=88) |
| Average candidate score ~63 | ✅ 63 (skills=65, exp=60, edu=70, cert=50, sem=60) |
| Weak candidate score ~24 | ✅ 24 (skills=25, exp=20, edu=40, cert=0, sem=25) |
| Clamping of 150 → 100 | ✅ Verified |
| Clamping of -50 → 0 | ✅ Verified |

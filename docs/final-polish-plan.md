# Final Polish Plan

## Current Strengths
- The application already has a working end-to-end pipeline for screening resumes.
- The UI features a strong, recruiter-focused technical aesthetic.
- The scoring methodology is deterministic (not hallucinated by the LLM) and documented.
- The API is functional and appropriately structured.

## Current Weaknesses
- Explainability in the UI uses overly technical terms ("Neural Evaluation", "Score Integrity") instead of plain English ("Why this candidate?", "Score Breakdown").
- The README is missing a screenshots section and could have clearer demo instructions.
- There are no sample screenshots of the dashboard, candidate results, or candidate analysis in `docs/screenshots/`.
- API, Scoring, and Architecture documentation might need minor tweaks to perfectly align with the current implementation.

## Proposed Changes
1. **P1: Improve Candidate Explainability**
   - Update `CandidateDetails.tsx` to clearly communicate "WHY THIS CANDIDATE?", "SCORE BREAKDOWN", "SKILLS", "EXPERIENCE", "MISSING", and "AI JUSTIFICATION".
   - Use real data from the `ScoredCandidate` object, removing vague headings like "Evidence Graph".
2. **P1: Improve README Presentation**
   - Add a Screenshots section to `README.md`.
   - Create `docs/screenshots/` and add representative screenshots.
3. **P1: Add Project Screenshots**
   - Generate or capture high-quality screenshots (`dashboard.png`, `results.png`, `candidate-details.png`) using sample data.
4. **P2: Verify and Improve API Documentation**
   - Audit `api.md` and ensure it accurately reflects `backend/src/routes`.
5. **P2: Final UI Polish**
   - Tweak `CandidateTable.tsx` and `ScreeningSummaryCards.tsx` to enhance visual hierarchy without rewriting components.

## Files Expected To Change
- `frontend/src/components/CandidateDetails.tsx`
- `frontend/src/components/CandidateTable.tsx`
- `frontend/src/components/ScreeningSummaryCards.tsx`
- `README.md`
- `docs/api.md`
- `docs/final-polish-plan.md`

## Risks
- Modifying `CandidateDetails.tsx` could break responsive layouts or data rendering if missing properties aren't handled properly. 
- Over-engineering UI changes might conflict with the core directive of "Protect working functionality".

## Verification Plan
1. **UI & Build Check:** Ensure `npm run build` succeeds for frontend.
2. **Backend Integrity:** Ensure backend API tests/build succeed.
3. **End-to-End Test:** Run the screening pipeline with 1 JD and 3 sample resumes to verify all components render accurately.

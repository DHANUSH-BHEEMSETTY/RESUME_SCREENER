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

<!-- Future phases will be appended below -->

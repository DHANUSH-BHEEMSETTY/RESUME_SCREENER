// Test setup — sets required environment variables before any test runs.
// This prevents config/env.ts from throwing due to missing GEMINI_API_KEY.
process.env.GEMINI_API_KEY = 'test-placeholder-key-do-not-use';
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.SHORTLIST_THRESHOLD = '75';
process.env.LLM_MODEL = 'gemini-1.5-flash';

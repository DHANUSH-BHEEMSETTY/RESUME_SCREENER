import dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnvInt(name: string, defaultValue: number): number {
  const raw = process.env[name];
  if (!raw) return defaultValue;
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed)) {
    console.warn(`[config] ${name} is not a valid integer — using default (${defaultValue})`);
    return defaultValue;
  }
  return parsed;
}

function optionalEnvString(name: string, defaultValue: string): string {
  return process.env[name] ?? defaultValue;
}

// Validate required vars at startup — throws immediately if missing
const GEMINI_API_KEY = requireEnv('GEMINI_API_KEY');

export const config = {
  port: optionalEnvInt('PORT', 3001),
  nodeEnv: optionalEnvString('NODE_ENV', 'development'),
  geminiApiKey: GEMINI_API_KEY,
  llmModel: optionalEnvString('LLM_MODEL', 'gemini-1.5-flash'),
  shortlistThreshold: optionalEnvInt('SHORTLIST_THRESHOLD', 75),
  maxPdfSizeMb: optionalEnvInt('MAX_PDF_SIZE_MB', 10),
} as const;

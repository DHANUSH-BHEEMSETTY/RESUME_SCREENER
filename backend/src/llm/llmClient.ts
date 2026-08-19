import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { LLMError } from '../middleware/errorHandler';

// ---- Types -------------------------------------------------

export interface LLMProvider {
  complete(systemPrompt: string, userPrompt: string): Promise<string>;
}

// ---- Retry configuration -----------------------------------

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;
const TIMEOUT_MS = 45_000;

// ---- Helpers -----------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  // Retry on rate limits, network errors, 5xx from provider
  return (
    msg.includes('rate limit') ||
    msg.includes('429') ||
    msg.includes('503') ||
    msg.includes('network') ||
    msg.includes('timeout') ||
    msg.includes('econnreset') ||
    msg.includes('socket')
  );
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new LLMError(`LLM request timed out after ${ms}ms`, label));
    }, ms);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutHandle!);
    return result;
  } catch (err) {
    clearTimeout(timeoutHandle!);
    throw err;
  }
}

// ---- Gemini provider ---------------------------------------

class GeminiProvider implements LLMProvider {
  private readonly model: GenerativeModel;

  constructor() {
    const genAI = new GoogleGenerativeAI(config.geminiApiKey);

    const generationConfig: GenerationConfig = {
      responseMimeType: 'application/json',
      temperature: 0.1,       // Low temperature for factual extraction
      topP: 0.8,
      maxOutputTokens: 4096,
    };

    this.model = genAI.getGenerativeModel({
      model: config.llmModel,
      generationConfig,
    });
  }

  async complete(systemPrompt: string, userPrompt: string): Promise<string> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
      try {
        logger.debug(`LLM request attempt ${attempt}/${MAX_RETRIES + 1}`);

        const generatePromise = this.model.generateContent({
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          systemInstruction: systemPrompt,
        });

        const result = await withTimeout(
          generatePromise,
          TIMEOUT_MS,
          'generateContent'
        );

        const text = result.response.text();
        if (!text || text.trim().length === 0) {
          throw new LLMError('LLM returned an empty response');
        }

        return text;
      } catch (err) {
        lastError = err;

        if (err instanceof LLMError) {
          // LLMError (timeout or empty) — retry if we have attempts left
          if (attempt <= MAX_RETRIES) {
            const delay = RETRY_DELAY_MS * attempt;
            logger.warn(`LLM error on attempt ${attempt} — retrying in ${delay}ms`, {
              error: (err as Error).message,
            });
            await sleep(delay);
            continue;
          }
          throw err;
        }

        if (isRetryableError(err)) {
          if (attempt <= MAX_RETRIES) {
            const delay = RETRY_DELAY_MS * attempt;
            logger.warn(`Retryable LLM error on attempt ${attempt} — retrying in ${delay}ms`, {
              error: (err as Error).message,
            });
            await sleep(delay);
            continue;
          }
        }

        // Non-retryable or exhausted retries
        throw new LLMError(
          'LLM provider request failed',
          (err instanceof Error ? err.message : String(err))
        );
      }
    }

    throw new LLMError(
      'LLM provider request failed after retries',
      (lastError instanceof Error ? lastError.message : String(lastError))
    );
  }
}

// ---- Singleton export --------------------------------------

export const llmClient: LLMProvider = new GeminiProvider();

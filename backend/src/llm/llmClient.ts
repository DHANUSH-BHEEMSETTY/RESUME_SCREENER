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
const RETRY_DELAY_MS = 2000;   // increased — 2s between retries
const TIMEOUT_MS = 90_000;     // 90s — Gemini 2.5 thinking can be slow

// ---- Helpers -----------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes('rate limit') ||
    msg.includes('429') ||
    msg.includes('503') ||
    msg.includes('500') ||
    msg.includes('network') ||
    msg.includes('timeout') ||
    msg.includes('econnreset') ||
    msg.includes('socket') ||
    msg.includes('resource_exhausted') ||
    msg.includes('unavailable') ||
    msg.includes('internal')
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

    // gemini-2.5-flash supports thinking — disable it for JSON extraction tasks
    // to get faster, deterministic, non-prefixed responses
    const generationConfig: GenerationConfig = {
      responseMimeType: 'application/json',
      temperature: 0.1,
      topP: 0.8,
      maxOutputTokens: 8192,
      // @ts-ignore — thinkingConfig not yet typed in older SDK versions
      thinkingConfig: { thinkingBudget: 0 },
    };

    this.model = genAI.getGenerativeModel({
      model: config.llmModel,
      generationConfig,
    });

    logger.info('GeminiProvider initialized', { model: config.llmModel });
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

        // Log finish reason for debugging
        const finishReason = result.response.candidates?.[0]?.finishReason;
        if (finishReason && finishReason !== 'STOP') {
          logger.warn(`LLM non-STOP finish reason: ${finishReason}`);
        }

        // Check for blocked / safety-filtered response
        if (!result.response.candidates || result.response.candidates.length === 0) {
          const feedback = result.response.promptFeedback;
          const blockReason = feedback?.blockReason ?? 'unknown';
          throw new LLMError(`LLM response blocked: ${blockReason}`);
        }

        let text: string;
        try {
          text = result.response.text();
        } catch (textErr) {
          // response.text() can throw if content is filtered
          throw new LLMError(
            'LLM response could not be read (possible safety filter)',
            (textErr instanceof Error ? textErr.message : String(textErr))
          );
        }

        if (!text || text.trim().length === 0) {
          throw new LLMError('LLM returned an empty response');
        }

        return text;

      } catch (err) {
        lastError = err;

        // Always log the real underlying error for debugging
        const rawMsg = err instanceof Error ? err.message : String(err);
        logger.error(`LLM error on attempt ${attempt}`, { error: rawMsg });

        if (err instanceof LLMError) {
          if (attempt <= MAX_RETRIES) {
            const delay = RETRY_DELAY_MS * attempt;
            logger.warn(`Retrying LLM (attempt ${attempt}) in ${delay}ms`);
            await sleep(delay);
            continue;
          }
          throw err;
        }

        if (isRetryableError(err)) {
          if (attempt <= MAX_RETRIES) {
            const delay = RETRY_DELAY_MS * attempt;
            logger.warn(`Retryable Gemini error on attempt ${attempt} — retrying in ${delay}ms`, {
              error: rawMsg,
            });
            await sleep(delay);
            continue;
          }
        }

        // Non-retryable — wrap with real message surfaced
        throw new LLMError(
          `LLM provider request failed: ${rawMsg}`,
          rawMsg
        );
      }
    }

    const finalMsg = lastError instanceof Error ? lastError.message : String(lastError);
    throw new LLMError(
      `LLM provider request failed after ${MAX_RETRIES + 1} retries: ${finalMsg}`,
      finalMsg
    );
  }
}

// ---- Singleton export --------------------------------------

export const llmClient: LLMProvider = new GeminiProvider();

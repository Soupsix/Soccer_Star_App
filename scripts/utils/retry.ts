import { Logger } from '../core/logger';

interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  retryOnStatuses?: number[];
}

/**
 * Runs an async task with exponential backoff retrying.
 */
export async function withRetry<T>(
  task: () => Promise<T>,
  context: string,
  options: RetryOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const retryOnStatuses = options.retryOnStatuses ?? [429, 500, 502, 503];
  let delay = options.initialDelayMs ?? 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await task();
    } catch (error: any) {
      const isRetryable =
        error.status && retryOnStatuses.includes(error.status) ||
        error.message?.includes('429') ||
        error.message?.includes('500') ||
        error.message?.includes('502') ||
        error.message?.includes('503') ||
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT';

      if (attempt === maxRetries || !isRetryable) {
        Logger.error(`Task failed after attempt ${attempt}/${maxRetries} (non-retryable or max retries reached).`, error, context);
        throw error;
      }

      // Exponential backoff with small random jitter
      const jitter = Math.random() * 200;
      const actualDelay = delay + jitter;
      Logger.warn(
        `Attempt ${attempt}/${maxRetries} failed with retryable error. Retrying in ${actualDelay.toFixed(0)}ms...`,
        context
      );
      
      await new Promise((resolve) => setTimeout(resolve, actualDelay));
      delay *= 2; // Double the delay
    }
  }

  throw new Error(`Execution exceeded maximum retry attempts for context: ${context}`);
}

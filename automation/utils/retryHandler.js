export async function executeWithRetry(testFn, maxRetries = 2, delayMs = 500) {
  let attempt = 0;
  let lastError = null;

  while (attempt <= maxRetries) {
    try {
      if (attempt > 0) {
        console.log(`[RetryHandler] Retry attempt ${attempt} of ${maxRetries}...`);
        await new Promise(r => setTimeout(r, delayMs));
      }
      return await testFn();
    } catch (err) {
      lastError = err;
      attempt++;
    }
  }

  throw lastError;
}

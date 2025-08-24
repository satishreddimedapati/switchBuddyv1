
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// -----------------------------
// Load API Keys
// -----------------------------
const primaryApiKey = process.env.GEMINI_API_KEY_1;
const secondaryApiKey = process.env.GEMINI_API_KEY;

if (!primaryApiKey) {
  throw new Error("Primary Gemini API key not found. Please set GEMINI_API_KEY_1 in your environment.");
}

// -----------------------------
// Genkit AI Instances
// -----------------------------

// Primary AI instance
export const ai = genkit({
  plugins: [
    googleAI({ apiKey: primaryApiKey }),
  ],
  model: 'googleai/gemini-2.5-pro',
});

// Fallback AI instance - only configured if a secondary key exists
let fallbackAi: typeof ai | null = null;
if (secondaryApiKey) {
  fallbackAi = genkit({
    plugins: [
      googleAI({ apiKey: secondaryApiKey }),
    ],
    model: 'googleai/gemini-2.0-flash',
  });
}

// -----------------------------
// A robust flow runner with retry logic
// -----------------------------
export async function runFlowWithRetry<I, O>(
  primaryFlow: (input: I) => Promise<O>,
  fallbackFlow: (input: I) => Promise<O> | null,
  input: I
): Promise<O> {
  try {
    // First attempt with the primary AI instance
    return await primaryFlow(input);
  } catch (e: any) {
    const isRateLimitError =
      (e.cause?.status === 429 || (e.message && e.message.includes('429'))) && e.message.includes('google');

    if (isRateLimitError && fallbackFlow) {
      console.warn("Primary API key rate limited. Attempting to switch to secondary key.");
      // Second attempt with the fallback AI instance
      const fallbackResult = fallbackFlow(input);
      if (fallbackResult) {
        return await fallbackResult;
      }
    }
    // If it's another type of error or no fallback is available, throw it
    throw e;
  }
}


import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// -----------------------------
// Load API Keys
// -----------------------------
const primaryApiKey = process.env.GEMINI_API_KEY_1;
const secondaryApiKey = process.env.GEMINI_API_KEY;
const tertiaryApiKey = process.env.GEMINI_API_KEY_2;

const apiKeys: string[] = [primaryApiKey, secondaryApiKey, tertiaryApiKey].filter(
  (key): key is string => typeof key === 'string' && key.length > 0
);


if (apiKeys.length === 0) {
  throw new Error("No Gemini API keys found. Please set at least GEMINI_API_KEY_1 in your environment.");
}

// This flag will track if the primary key has failed.
let primaryKeyFailed = false;

// -----------------------------
// Genkit AI Instance
// -----------------------------
export const ai = genkit({
  plugins: [
    googleAI({
      // Use an async function to dynamically select the API key.
      apiKey: async () => {
        // If the primary key has failed, use the secondary key if it exists.
        if (primaryKeyFailed && apiKeys.length > 1) {
          console.log("Primary key failed, using secondary API Key.");
          return apiKeys[1];
        }
        // Otherwise, always use the primary key.
        return apiKeys[0];
      },
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});

// -----------------------------
// A robust flow runner with retry logic
// -----------------------------
export async function runFlowWithRetry<I, O>(
  flow: (input: I) => Promise<O>,
  input: I
): Promise<O> {
  try {
    // First attempt
    return await flow(input);
  } catch (e: any) {
    // Check if the error is a rate limit error (specific to Google AI)
    const isRateLimitError =
      e.cause?.status === 429 || (e.message && e.message.includes('429'));

    if (isRateLimitError && !primaryKeyFailed) {
      console.warn("Primary API key rate limited. Attempting to switch to secondary key.");
      primaryKeyFailed = true; // Set the flag to use the next key
      // Second attempt
      return await flow(input);
    }
    // If it's another type of error or the retry already happened, throw it
    throw e;
  }
}

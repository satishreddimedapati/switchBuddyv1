
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Array to hold all available API keys
const apiKeys: string[] = [];

// Load API keys from environment variables
if (process.env.GEMINI_API_KEY) {
  apiKeys.push(process.env.GEMINI_API_KEY);
}
if (process.env.GEMINI_API_KEY_1) {
  apiKeys.push(process.env.GEMINI_API_KEY_1);
}
if (process.env.GEMINI_API_KEY_2) {
  apiKeys.push(process.env.GEMINI_API_KEY_2);
}

if (apiKeys.length === 0) {
  throw new Error("No Gemini API keys found. Please set GEMINI_API_KEY and other keys in your environment.");
}

let keyIndex = 0;

// Rotate API keys for each request
function getApiKey() {
  const key = apiKeys[keyIndex];
  keyIndex = (keyIndex + 1) % apiKeys.length;
  return key;
}

export const ai = genkit({
    plugins: [
        googleAI({
            apiKey: getApiKey,
        }),
    ],
});

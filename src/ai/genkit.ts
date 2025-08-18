import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// -----------------------------
// Load API Keys
// -----------------------------
const apiKeys: string[] = [];

// Load from env variables
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
  throw new Error("No Gemini API keys found. Please set GEMINI_API_KEY in your environment.");
}

let keyIndex = 0;

// Rotate API keys for each request
function getApiKey() {
  const key = apiKeys[keyIndex];
  keyIndex = (keyIndex + 1) % apiKeys.length;
  return key;
}

// -----------------------------
// 1) Static export: ai (uses only one key, for compatibility)
// -----------------------------
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: getApiKey(), // picked once at startup
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});

// -----------------------------
// 2) Rotating version: runPrompt()
// -----------------------------
function createAI() {
  return genkit({
    plugins: [
      googleAI({
        apiKey: getApiKey(), // rotates per request
      }),
    ],
    model: 'googleai/gemini-2.0-flash',
  });
}

export async function runPrompt(prompt: string) {
  const aiInstance = createAI();
  const result = await aiInstance.generate({
    prompt,
  });
  return result.output;
}


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

let keyIndex = 0;

// Simple key rotation
function getApiKey() {
  const key = apiKeys[keyIndex];
  keyIndex = (keyIndex + 1) % apiKeys.length;
  return key;
}

// -----------------------------
// 1) Static export: ai (uses a rotating key for each request)
// -----------------------------
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: getApiKey, 
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});

// -----------------------------
// 2) A simple prompt runner that also uses the rotating key
// -----------------------------
export async function runPrompt(prompt: string) {
  const result = await ai.generate({
    prompt,
  });
  return result.output;
}

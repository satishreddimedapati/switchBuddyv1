import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Array to hold all available API keys
const apiKeys: string[] = [];

// The primary API key from the default environment variable
if (process.env.GEMINI_API_KEY) {
    apiKeys.push(process.env.GEMINI_API_KEY);
}
// Add the additional keys you provided
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

export const ai = genkit({
  plugins: [
    googleAI({
      // This function will be called for each API request, rotating the keys.
      apiKey: () => {
        const key = apiKeys[keyIndex];
        keyIndex = (keyIndex + 1) % apiKeys.length; // Move to the next key for the next request
        return key;
      },
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});

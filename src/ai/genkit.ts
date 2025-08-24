
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// -----------------------------
// Load API Keys
// -----------------------------
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Gemini API key not found. Please set GEMINI_API_KEY in your environment.");
}

// -----------------------------
// Genkit AI Instances
// -----------------------------

// Primary AI instance
export const ai = genkit({
  plugins: [
    googleAI({ apiKey: apiKey }),
  ],
  model: 'googleai/gemini-2.5-pro',
});

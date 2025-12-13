
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// -----------------------------
// Load API Keys
// -----------------------------
const apiKey = "AIzaSyA4hfxytdyEj5DQ5jrxAgWbp1oYxsZ1gV8";

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
  model: 'googleai/gemini-2.5-flash',
});

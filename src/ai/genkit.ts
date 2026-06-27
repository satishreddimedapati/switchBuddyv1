import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// -----------------------------
// AI helper without server-side fallback key
// -----------------------------
export function createAI(dynamicApiKey?: string, provider: 'gemini' | 'groq' = 'gemini') {
  if (provider === 'gemini') {
    const apiKey = dynamicApiKey?.trim();
    if (!apiKey) {
      throw new Error('Gemini API key is missing. Please configure it in AI Settings.');
    }

    return genkit({
      plugins: [
        googleAI({ apiKey }),
      ],
      model: 'googleai/gemini-2.5-flash',
    });
  } else {
    if (!dynamicApiKey?.trim()) {
      throw new Error('Groq API key is missing. Please configure it in AI Settings.');
    }

    // For Groq we return a mock Genkit-like object that proxies generation to Groq REST API
    return {
      generate: async (options: { prompt: string, output?: { schema: any } }) => {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${dynamicApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama3-8b-8192',
            messages: [{ role: 'user', content: options.prompt }]
          })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        let outputText = data.choices[0].message.content;
        let outputData = outputText;

        if (options.output && options.output.schema) {
          try {
            const jsonMatch = outputText.match(/```json\n([\s\S]*?)\n```/) || outputText.match(/{[\s\S]*}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
              outputData = parsed;
            } else {
              outputData = JSON.parse(outputText);
            }
          } catch (e) {
            console.warn('Could not parse Groq JSON output into schema', e);
          }
        }

        return {
          output: outputData,
          text: outputText
        };
      }
    } as any;
  }
}

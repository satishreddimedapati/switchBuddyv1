const fs = require('fs');
const path = require('path');

const flowsDir = path.join(__dirname, 'src', 'ai', 'flows');
const files = fs.readdirSync(flowsDir);

for (const file of files) {
    if (!file.endsWith('.ts')) continue;
    const filePath = path.join(flowsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove the ai import
    content = content.replace(/import\s*{\s*ai\s*}\s*from\s*['"]@\/ai\/genkit['"];/g, `import { createAI } from '@/ai/genkit';\nimport { cookies } from 'next/headers';`);

    // Comment out ai.definePrompt and ai.defineFlow
    // We will just read the prompt string and use it directly.
    // Let's use a generic regex to replace the exported function.

    // 1. Find the exported function name
    const exportRegex = /export async function (\w+)\s*\(\s*input:\s*([\w<>]+)\s*\)\s*:\s*Promise<([\w<>]+)>/;
    const exportMatch = content.match(exportRegex);
    
    if (exportMatch) {
        const funcName = exportMatch[1];
        const inputType = exportMatch[2];
        const outputType = exportMatch[3];

        // 2. Find the prompt text
        const promptRegex = /prompt:\s*`([\s\S]*?)`\s*,/;
        const promptMatch = content.match(promptRegex);
        const promptText = promptMatch ? promptMatch[1] : '';

        // 3. Find the schema parsing if any
        // Assuming we rely on the schema or we just return the raw text if it's supposed to be JSON, we'll let aiInstance.generate handle it.

        const outputSchemaMatch = content.match(/output:\s*{\s*schema:\s*(\w+)\s*}/);
        const outputSchemaName = outputSchemaMatch ? outputSchemaMatch[1] : null;

        // Replace the whole content below the imports basically
        const newFunc = `
export async function ${funcName}(input: ${inputType}): Promise<${outputType}> {
  const cookieStore = await cookies();
  const provider = (cookieStore.get('ai_provider')?.value || 'gemini') as 'gemini' | 'groq';
  const apiKey = cookieStore.get('ai_api_key')?.value;
  
  if (!apiKey) throw new Error("API Key is missing. Please configure it in AI Settings.");
  
  const ai = createAI(apiKey, provider);

  // We construct the prompt by replacing handlebars (e.g. {{{question}}}) with input properties
  let finalPrompt = \`${promptText}\`;
  for (const key of Object.keys(input)) {
    finalPrompt = finalPrompt.replace(new RegExp('{{{\\s*' + key + '\\s*}}}', 'g'), (input as any)[key]);
  }

  const result = await ai.generate({
    prompt: finalPrompt,
    ${outputSchemaName ? `output: { schema: ${outputSchemaName} },` : ''}
  });

  return result.output as ${outputType};
}
`;
        
        // Remove everything after the types/schemas
        // We'll keep the types and schemas intact.
        const firstDefineIndex = content.indexOf('const prompt = ai.definePrompt');
        if (firstDefineIndex !== -1) {
            content = content.substring(0, firstDefineIndex);
            content += newFunc;
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Refactored ${file}`);
        }
    }
}

const fs = require('fs');
const path = require('path');

const flowsDir = path.join(__dirname, 'src', 'ai', 'flows');
const files = fs.readdirSync(flowsDir);

for (const file of files) {
    if (!file.endsWith('.ts')) continue;
    const filePath = path.join(flowsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Skip if already refactored
    if (content.includes('const cookieStore = await cookies();')) continue;

    // 1. Replace imports
    content = content.replace(/import\s*{\s*ai\s*}\s*from\s*['"]@\/ai\/genkit['"];?/g, "import { createAI } from '@/ai/genkit';\nimport { cookies } from 'next/headers';");

    const promptRegex = /const\s+(\w+)\s*=\s*ai\.definePrompt\(\{\s*name:\s*['"]([^'"]+)['"],\s*input:\s*\{\s*schema:\s*(\w+)\s*\},(?:\s*output:\s*\{\s*schema:\s*(\w+)\s*\},)?\s*prompt:\s*`([\s\S]*?)`,\s*\}\);/g;
    
    let prompts = {};
    let match;
    while ((match = promptRegex.exec(content)) !== null) {
        prompts[match[1]] = {
            inputSchema: match[3],
            outputSchema: match[4],
            promptText: match[5]
        };
    }

    // Relaxed flow regex to match any flow and extract the prompt variable used inside
    const flowRegex = /const\s+(\w+)\s*=\s*ai\.defineFlow\([\s\S]*?(?:await\s+)(\w+)\(/g;
    let flows = {};
    while ((match = flowRegex.exec(content)) !== null) {
        flows[match[1]] = {
            promptVar: match[2]
        };
    }

    const exportRegex = /export\s+async\s+function\s+(\w+)\s*\(\s*[^:]+:\s*([a-zA-Z0-9_]+)\s*\)\s*:\s*Promise<([a-zA-Z0-9_]+)>\s*\{\s*return\s+(\w+)\([^)]+\);\s*\}/g;
    let newExports = [];
    while ((match = exportRegex.exec(content)) !== null) {
        const funcName = match[1];
        const inputType = match[2];
        const outputType = match[3];
        const flowName = match[4];

        const promptVar = flows[flowName] ? flows[flowName].promptVar : Object.keys(prompts)[0];
        const promptInfo = prompts[promptVar];

        if (!promptInfo) {
            console.warn(`Could not find prompt for ${funcName} in ${file}`);
            continue;
        }

        const newFunc = `
export async function ${funcName}(input: ${inputType}): Promise<${outputType}> {
  const cookieStore = await cookies();
  const provider = (cookieStore.get('ai_provider')?.value || 'gemini') as 'gemini' | 'groq';
  const apiKey = cookieStore.get('ai_api_key')?.value;
  if (!apiKey) throw new Error("API Key is missing. Please configure it in AI Settings.");
  
  const ai = createAI(apiKey, provider);

  let finalPrompt = \`${promptInfo.promptText}\`;
  for (const key of Object.keys(input)) {
    finalPrompt = finalPrompt.replace(new RegExp('{{{\\s*' + key + '\\s*}}}', 'g'), (input as any)[key]);
    finalPrompt = finalPrompt.replace(new RegExp('{{' + key + '}}', 'g'), (input as any)[key]);
  }

  const result = await ai.generate({
    prompt: finalPrompt,
    ${promptInfo.outputSchema ? `output: { schema: ${promptInfo.outputSchema} },` : ''}
  });

  return result.output as ${outputType};
}
`;
        newExports.push({
            oldBlock: match[0],
            newBlock: newFunc
        });
    }

    // Strip definePrompt and defineFlow
    content = content.replace(promptRegex, '');
    content = content.replace(/const\s+\w+\s*=\s*ai\.defineFlow\([\s\S]*?\}\s*\);/g, '');

    for (const exp of newExports) {
        content = content.replace(exp.oldBlock, exp.newBlock);
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Successfully refactored ${file}`);
}

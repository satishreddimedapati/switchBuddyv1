const fs = require('fs');
const path = require('path');

const flowsDir = path.join(__dirname, 'src', 'ai', 'flows');
const files = fs.readdirSync(flowsDir);

for (const file of files) {
    if (!file.endsWith('.ts')) continue;
    const filePath = path.join(flowsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove the old wrapper function which looks like:
    // export async function generateTaskDescription(input: GenerateTaskDescriptionInput): Promise<GenerateTaskDescriptionOutput> {
    //   return generateTaskDescriptionFlow(input);
    // }
    
    // We'll use a regex that matches this exact pattern
    const oldFuncRegex = /export\s+async\s+function\s+\w+\s*\([^)]*\)\s*:\s*Promise<[^>]+>\s*\{\s*return\s+\w+Flow\([^)]*\);\s*\}/g;
    
    if (oldFuncRegex.test(content)) {
        content = content.replace(oldFuncRegex, '');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed duplicates in ${file}`);
    }
}

import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { openApiDocument } from './openapi';

const outputDir = path.resolve(__dirname, '../../generated');
const specPath = path.join(outputDir, 'openapi.json');
const outputFile = path.join(outputDir, 'api-types.ts');

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(specPath, `${JSON.stringify(openApiDocument, null, 2)}\n`, 'utf8');

execFileSync('npx', ['--yes', 'openapi-typescript', specPath, '--output', outputFile], {
  cwd: path.resolve(__dirname, '../..'),
  stdio: 'inherit',
});

console.log(`Generated API types at ${outputFile}`);

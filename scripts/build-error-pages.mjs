import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const outputRoot = resolve(process.argv[2] || '_site');
const templatePath = resolve('views/error.html');
const template = await readFile(templatePath, 'utf8');

const renderError = (code, title, message) => template
  .replaceAll('{{CODE}}', String(code))
  .replaceAll('{{TITLE}}', title)
  .replaceAll('{{MESSAGE}}', message);

const notFoundPage = renderError(
  404,
  'Página não encontrada',
  'A página que você procura não existe ou foi movida.'
);

await mkdir(outputRoot, { recursive: true });
await writeFile(join(outputRoot, '404.html'), notFoundPage, 'utf8');

const previewDirectory = join(outputRoot, 'error');
await mkdir(previewDirectory, { recursive: true });
await writeFile(join(previewDirectory, 'index.html'), notFoundPage, 'utf8');


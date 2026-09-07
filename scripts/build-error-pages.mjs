import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const outputRoot = resolve(process.argv[2] || '_site');
const templatePath = resolve('views/error.html');
const template = await readFile(templatePath, 'utf8');
const appShell = (await readFile(resolve('index.html'), 'utf8'))
  .replace('<head>', '<head><base href="/">');

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
// GitHub Pages uses 404.html for refreshes when a route directory is absent.
// Keep the SPA shell here so the client router can resolve the requested path.
await writeFile(join(outputRoot, '404.html'), appShell, 'utf8');

const previewDirectory = join(outputRoot, 'error');
await mkdir(previewDirectory, { recursive: true });
await writeFile(join(previewDirectory, 'index.html'), notFoundPage, 'utf8');

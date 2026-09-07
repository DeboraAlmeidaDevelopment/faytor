import { cp, mkdir, readdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { renderPage } from '../server.mjs';

const outputRoot = resolve(process.argv[2] || '_site');
await mkdir(outputRoot, { recursive: true });
for (const asset of ['css', 'js', 'views', 'img', 'sitemap.xml', 'robots.txt', 'ads.txt']) {
  await cp(resolve(asset), join(outputRoot, asset), { recursive: true });
}

// Descoberta automática: início é a raiz; error é apenas um template.
for (const file of await readdir(resolve('views'))) {
  if (!file.endsWith('.html') || file === 'error.html') continue;
  const route = file === 'inicio.html' ? 'home' : file.slice(0, -5);
  const directory = route === 'home' ? outputRoot : join(outputRoot, route);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, 'index.html'), await renderPage(route), 'utf8');
}
await writeFile(join(outputRoot, '.nojekyll'), '');

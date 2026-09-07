import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import vm from 'node:vm';

const files = (await readdir('views')).filter(file => file.endsWith('.html') && file !== 'error.html');
const titles = new Set();
const indexableUrls = new Set();
for (const file of files) {
  const route = file === 'inicio.html' ? '' : file.slice(0, -5);
  const view = await readFile(`views/${file}`, 'utf8');
  const html = await readFile(`_site/${route ? `${route}/` : ''}index.html`, 'utf8');
  assert.ok(html.includes(view), `Conteúdo completo ausente: ${route || '/'}`);
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  assert.ok(title && !titles.has(title), `Título ausente ou repetido: ${route}`);
  titles.add(title);
  assert.equal((html.match(/<link rel="canonical"/g) || []).length, 1);
  assert.ok(/<meta name="description" content="[^"]+"/.test(html));
  if (html.includes('name="robots" content="index, follow"')) {
    indexableUrls.add(`https://www.faytor.com.br/${route ? `${route}/` : ''}`);
  }
  assert.ok(html.includes(`rel="canonical" href="https://www.faytor.com.br/${route ? `${route}/` : ''}"`), `Canonical: ${route}`);
  assert.doesNotMatch(html, /<body[^>]*x-cloak/);
  assert.doesNotMatch(html, /googlesyndication|adsbygoogle/);
  const response = await fetch(`http://localhost:8080/${route}/`.replace('8080//', '8080/'));
  assert.equal(response.status, 200, route);
  assert.equal(await response.text(), html, `SSR e publicação divergem: ${route}`);
}
assert.equal((await fetch('http://localhost:8080/rota-inexistente-auditoria/')).status, 404);
const sitemap = await readFile('_site/sitemap.xml', 'utf8');
assert.deepEqual(new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1])), indexableUrls,
  'O sitemap deve conter todas e somente as páginas indexáveis');
for (const [, url] of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  const parsed = new URL(url);
  assert.equal(parsed.origin, 'https://www.faytor.com.br');
  assert.ok(parsed.pathname.endsWith('/'), `Sitemap sem barra final: ${url}`);
  const html = await readFile(`_site${parsed.pathname}index.html`, 'utf8');
  assert.ok(html.includes(`rel="canonical" href="${url}"`));
  assert.ok(html.includes('name="robots" content="index, follow"'));
}
const fallback = await readFile('_site/404.html', 'utf8');
assert.ok(fallback.includes('<base href="/">') && fallback.includes('x-data="appState"'));
assert.ok((await readFile('_site/error/index.html', 'utf8')).includes('Página não encontrada'));

let createState;
let fetches = 0;
const context = vm.createContext({
  URL,
  window: { __faytorFetchWrapped: true, location: { protocol: 'http:', pathname: '/' }, setTimeout: fn => fn() },
  document: { addEventListener: (_name, fn) => fn() },
  Alpine: { data: (name, factory) => { if (name === 'appState') createState = factory; } },
  localStorage: { getItem: () => null },
  fetch: async () => { fetches++; return { ok: true, text: async () => '<h1>Conteúdo carregado</h1>' }; },
  console: { warn() {} }
});
vm.runInContext(await readFile('js/app.js', 'utf8'), context);
const app = createState();
assert.deepEqual(Object.keys(app.views).sort(), files.map(file => file === 'inicio.html' ? 'home' : file.slice(0, -5)).sort());
const metadata = new Map();
context.document.querySelector = selector => ({ setAttribute: (_name, value) => metadata.set(selector, value) });
for (const route of Object.keys(app.views)) {
  app.updateMetadata(route);
  const canonical = `https://www.faytor.com.br/${route === 'home' ? '' : `${route}/`}`;
  assert.equal(metadata.get('link[rel="canonical"]'), canonical);
  const html = await readFile(`_site/${route === 'home' ? '' : `${route}/`}index.html`, 'utf8');
  assert.equal(context.document.title, html.match(/<title>([^<]+)<\/title>/)?.[1], `Título SPA/HTML: ${route}`);
  assert.equal(metadata.get('meta[name="description"]'), html.match(/<meta name="description" content="([^"]+)"/)?.[1]);
  assert.equal(metadata.get('meta[name="robots"]'), html.match(/<meta name="robots" content="([^"]+)"/)?.[1]);
}
app.$nextTick = fn => fn();
let initialized = '';
app.initCpfGenerator = () => { initialized = 'cpf'; };
app.initMaskedGenerator = route => { initialized = route; };
for (const route of ['gerador-cpf', 'gerador-cns', 'gerador-pis', 'gerador-rg']) {
  app.currentTab = route;
  app.serverViewContent = '<h1>Conteúdo pré-renderizado</h1>';
  await app.loadView(route);
  assert.equal(initialized, route === 'gerador-cpf' ? 'cpf' : route);
  assert.equal(app.isLoading, false);
}
assert.equal(fetches, 0, 'Conteúdo pré-renderizado não deve ser buscado novamente');
await app.loadView('base64');
assert.equal(fetches, 1);
assert.ok(app.viewContent.includes('Conteúdo carregado'));
context.fetch = async () => { throw new Error('Falha de rede'); };
await app.loadView('base64');
assert.ok(app.viewContent.includes('Erro de Carregamento'));
assert.equal(app.isLoading, false);
await app.loadView('not-found');
assert.ok(app.viewContent.includes('Página não encontrada'));
app.cookieConsent = 'accepted';
app.loadAdvertising(); // Sem DOM de publicidade: qualquer tentativa de injeção falharia.
console.log(`${files.length} páginas: conteúdo, canonical, paridade SSR/estático e HTTP OK. Fallback SPA, inicialização, navegação, falha de rede e anúncios suspensos OK.`);

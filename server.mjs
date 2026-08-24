import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url)).replace(/[\\/]$/, '');
const port = Number(process.env.PORT) || 8080;
const siteOrigin = 'https://faytor.com.br';
const noindexRoutes = new Set(['politica-de-privacidade', 'termos-de-uso', 'contato', 'sobre-nos']);
const errorMessages = {
  400: ['Solicitação inválida', 'Não foi possível entender essa solicitação. Verifique o endereço e tente novamente.'],
  403: ['Acesso não permitido', 'Você não tem permissão para acessar este recurso.'],
  404: ['Página não encontrada', 'A página que você procura não existe ou foi movida.'],
  405: ['Método não permitido', 'Essa ação não está disponível para este endereço.'],
  429: ['Muitas solicitações', 'Recebemos muitas solicitações em pouco tempo. Aguarde um instante e tente novamente.'],
  500: ['Erro interno', 'Algo inesperado aconteceu por aqui. Nossa equipe já pode investigar o problema.'],
  502: ['Serviço indisponível', 'O serviço não respondeu corretamente. Tente novamente em alguns instantes.'],
  503: ['Serviço temporariamente indisponível', 'Estamos fazendo alguns ajustes. Tente novamente em alguns instantes.']
};
const pageMetadata = {
  home: ['Faytor - Ferramentas e Utilitários de Alta Performance', 'Faytor reúne ferramentas online gratuitas para geração, validação e utilidades do dia a dia.'],
  wordcounter: ['Contador de Palavras - Ferramenta Online Grátis | Faytor', 'Conte palavras, caracteres e parágrafos online com o contador de palavras gratuito do Faytor.'],
  jsonformatter: ['Formatador JSON - Formatar, Validar e Visualizar JSON | Faytor', 'Formate, valide e visualize JSON online de forma rápida e gratuita.'],
  base64: ['Codificador e Decodificador Base64 Online | Faytor', 'Codifique e decodifique textos em Base64 online gratuitamente.'],
  'gerador-cpf': ['Gerador de CPF Online - Gerar CPF Válido para Testes | Faytor', 'Gere números de CPF válidos para testes e desenvolvimento.'],
  'gerador-cnpj': ['Gerador de CNPJ Online - Gerar CNPJ Válido para Testes | Faytor', 'Gere números de CNPJ válidos para testes e desenvolvimento.'],
  'gerador-cns': ['Gerador de CNS Online - Cartão Nacional de Saúde | Faytor', 'Gere números de CNS válidos para testes e desenvolvimento.'],
  'gerador-rg': ['Gerador de RG Online - Gerar Registro Geral para Testes | Faytor', 'Gere números de RG fictícios para testes e desenvolvimento.'],
  'gerador-pis': ['Gerador de PIS/PASEP Online - Gerar PIS Válido | Faytor', 'Gere números de PIS/PASEP válidos para testes e desenvolvimento.'],
  'gerador-nomes': ['Gerador de Nomes Online - Nomes Fictícios Aleatórios | Faytor', 'Gere nomes fictícios aleatórios online para testes e desenvolvimento.'],
  'gerador-celular': ['Gerador de Celular Online - Números de Telefone Válidos | Faytor', 'Gere números de celular fictícios para testes e desenvolvimento.'],
  'gerador-email': ['Gerador de E-mail Temporário e Aleatório | Faytor', 'Gere endereços de e-mail fictícios e aleatórios para testes.'],
  'validador-cpf': ['Validador de CPF Online - Verificar CPF Válido | Faytor', 'Valide números de CPF online de forma rápida e gratuita.'],
  'validador-cnpj': ['Validador de CNPJ Online - Verificar CNPJ Válido | Faytor', 'Valide números de CNPJ online de forma rápida e gratuita.'],
  'validador-cns': ['Validador de CNS Online - Verificar Cartão de Saúde | Faytor', 'Valide números de CNS online de forma rápida e gratuita.'],
  'validador-rg': ['Validador de RG Online - Verificar Registro Geral | Faytor', 'Confira números de RG online para testes e desenvolvimento.'],
  'validador-pis': ['Validador de PIS/PASEP Online - Verificar PIS Válido | Faytor', 'Valide números de PIS/PASEP online de forma rápida e gratuita.'],
  'politica-de-privacidade': ['Política de Privacidade | Faytor', 'Leia a política de privacidade do Faytor.'],
  'termos-de-uso': ['Termos de Uso | Faytor', 'Leia os termos de uso do Faytor.'],
  contato: ['Contato - Fale Conosco | Faytor', 'Entre em contato com a equipe do Faytor.'],
  'sobre-nos': ['Sobre Nós - Conheça o Faytor | Faytor', 'Conheça o Faytor e suas ferramentas online gratuitas.']
};
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.txt': 'text/plain; charset=utf-8'
};

const sendFile = (response, filePath) => {
  response.writeHead(200, {
    'Content-Type': mimeTypes[extname(filePath).toLowerCase()] || 'application/octet-stream'
  });
  createReadStream(filePath).pipe(response);
};

const sendPage = async (response, route) => {
  const file = await readFile(join(root, 'index.html'), 'utf8');
  const viewFile = route === 'home' ? 'inicio.html' : `${route}.html`;
  const view = await readFile(join(root, 'views', viewFile), 'utf8');
  const [title, description] = pageMetadata[route];
  const canonical = `${siteOrigin}${route === 'home' ? '/' : `/${route}`}`;
  const html = file
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(">)/, `$1${description}$2`)
    .replace(/(<meta name="robots" content=")[^"]*(">)/, `$1${noindexRoutes.has(route) ? 'noindex, follow' : 'index, follow'}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(">)/, `$1${canonical}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(">)/, `$1${canonical}$2`)
    .replace(/(<meta property="twitter:url" content=")[^"]*(">)/, `$1${canonical}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(">)/, `$1${title}$2`)
    .replace(/(<meta property="twitter:title" content=")[^"]*(">)/, `$1${title}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(">)/, `$1${description}$2`)
    .replace(/(<meta property="twitter:description" content=")[^"]*(">)/, `$1${description}$2`);
  const image = `${siteOrigin}/img/social-card.svg`;
  const withServerView = html.replace(
    '<div id="server-view-content" x-show="!isLoading && !corsFallback" x-html="viewContent" class="focus:outline-none"></div>',
    `<div id="server-view-content" x-show="!isLoading && !corsFallback" x-html="viewContent" class="focus:outline-none">${view}</div>`
  );
  const withSocialImage = withServerView
    .replace(/(<meta property="og:image" content=")[^"]*(">)/, `$1${image}$2`)
    .replace(/(<meta property="twitter:image" content=")[^"]*(">)/, `$1${image}$2`);
  response.writeHead(200, { 'Content-Type': mimeTypes['.html'] });
  response.end(withSocialImage);
};

const sendError = async (response, statusCode, responseStatus = statusCode) => {
  const [title, message] = errorMessages[statusCode] || errorMessages[500];
  const template = await readFile(join(root, 'views/error.html'), 'utf8');
  const html = template
    .replaceAll('{{CODE}}', String(statusCode))
    .replaceAll('{{TITLE}}', title)
    .replaceAll('{{MESSAGE}}', message);
  response.writeHead(responseStatus, {
    'Content-Type': mimeTypes['.html'],
    'Cache-Control': 'no-store'
  });
  response.end(html);
};

createServer(async (request, response) => {
  try {
    const requestPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const route = requestPath.replace(/^\/+|\/+$/g, '') || 'home';
    const filePath = normalize(join(root, requestPath));

    if (!filePath.startsWith(root + sep) && filePath !== join(root, 'index.html')) {
      await sendError(response, 403);
      return;
    }

    if (pageMetadata[route] && !extname(requestPath)) {
      await sendPage(response, route);
      return;
    }

    // Permite visualizar a página de erro sem gerar um erro de rede no console.
    if (route === 'error' && !extname(requestPath)) {
      await sendError(response, 404, 200);
      return;
    }

    const fileInfo = await stat(filePath).catch(() => null);
    if (fileInfo?.isFile()) {
      sendFile(response, filePath);
      return;
    }

    // A rota é controlada pelo Alpine.js; o servidor precisa entregar a SPA
    // para que o navegador possa resolver a URL após um refresh.
    await sendError(response, 404);
  } catch {
    try {
      await sendError(response, 500);
    } catch {
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Internal Server Error');
    }
  }
}).listen(port, () => {
  console.log(`Faytor disponível em http://localhost:${port}`);
});

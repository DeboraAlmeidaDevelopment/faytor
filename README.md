# Faytor

Faytor é uma SPA (Single Page Application) estática com ferramentas rápidas para uso no navegador:

- contador de palavras, caracteres, parágrafos e tempo estimado de leitura;
- formatador, validador e minificador JSON;
- codificador e decodificador Base64;
- modo claro/escuro com preferência salva no `localStorage`.

## Demo e repositório

- Repositório: [github.com/DeboraAlmeidaDevelopment/faytor](https://github.com/DeboraAlmeidaDevelopment/faytor)
- Site configurado nos metadados: [faytor.com](https://faytor.com/)

## Publicação no GitHub Pages

O projeto usa GitHub Actions para instalar as dependências, compilar o Tailwind e publicar os arquivos estáticos. O workflow está em `.github/workflows/deploy-pages.yml`.

No repositório do GitHub:

1. Acesse **Settings → Pages**.
2. Em **Build and deployment → Source**, selecione **GitHub Actions**.
3. Faça push da branch `main` ou execute manualmente o workflow na aba **Actions**.

O endereço padrão será `https://deboraalmeidadevelopment.github.io/faytor/`.

## Tecnologias

- HTML5, CSS3 e JavaScript;
- [Alpine.js](https://alpinejs.dev/) via CDN;
- [Tailwind CSS](https://tailwindcss.com/) 3.4.17 compilado e minificado localmente.

O projeto não possui backend ou banco de dados. O Tailwind é a única dependência de desenvolvimento e é usado para gerar o CSS de produção.

O Google AdSense está configurado para anúncios automáticos com o ID de editor `ca-pub-3673785596412790`. O arquivo `ads.txt` também está na raiz do site. A veiculação depende da aprovação do domínio no AdSense e da propagação da configuração.

## Como executar localmente

### 1. Instalar dependências

Com o Node.js instalado, execute:

```bash
npm install
```

### 2. Gerar o CSS de produção

Execute o build do Tailwind:

```bash
npm run build
```

Para recompilar automaticamente durante alterações:

```bash
npm run watch
```

### 3. Iniciar o servidor local

#### Opção recomendada: servidor SPA do projeto

Use o servidor incluído no projeto. Ele entrega `index.html` quando uma rota interna, como `/gerador-celular`, é atualizada:

```bash
npm run dev
```

Depois, abra [http://localhost:8080](http://localhost:8080).

#### Opção alternativa: Python

Tenha o [Python 3](https://www.python.org/downloads/) instalado. O Python é usado apenas para servir os arquivos por HTTP.

### Inicialização

No diretório raiz do projeto, execute:

```bash
python -m http.server 8080
```

No Windows, caso `python` não esteja disponível, tente:

```bash
py -m http.server 8080
```

Depois, abra [http://localhost:8080](http://localhost:8080).

Para encerrar o servidor, pressione `Ctrl+C` no terminal.

#### Opção 2: Node.js

Se você já possui Node.js instalado, execute:

```bash
npx serve . -l 8080
```

Na primeira execução, o `npx` pode solicitar autorização para baixar o pacote `serve`. Depois, abra [http://localhost:8080](http://localhost:8080).

## Existe algum comando de setup?

Não há um comando `setup` separado. Em uma instalação nova, execute `npm install` e depois `npm run build` antes de iniciar o servidor.

O servidor HTTP local é necessário porque a aplicação carrega as subviews de `views/` usando `fetch`. Para testar e atualizar rotas internas, use `npm run dev`; o `python -m http.server` não possui fallback de SPA e retorna 404 nessas URLs. Abrir o `index.html` diretamente pelo explorador de arquivos (`file://`) também pode bloquear o carregamento por causa das políticas do navegador.

## Estrutura principal

```text
.
├── index.html              # Layout principal e navegação da SPA
├── css/styles.css          # Estilos customizados
├── js/app.js               # Estado, tema e carregamento das views
└── views/
    ├── inicio.html         # Página inicial
    ├── wordcounter.html    # Contador de palavras
    ├── jsonformatter.html  # Formatador JSON
    └── base64.html         # Ferramenta Base64
```

## Observações

- Alpine.js continua sendo carregado pela internet via CDN; para inicializar a interatividade, mantenha a conexão ativa.
- O Tailwind é compilado localmente e o CSS gerado fica em `css/tailwind.css`.
- O tema e a última aba selecionada são persistidos no armazenamento local do navegador.
- As ferramentas processam os dados no navegador e não exigem API ou servidor de aplicação.

## Licença

Este projeto está distribuído sob a licença MIT. Consulte o arquivo [LICENSE](LICENSE).

## Autoria

Desenvolvido por [Debora Almeida Development](https://github.com/DeboraAlmeidaDevelopment).

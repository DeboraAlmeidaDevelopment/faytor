/**
 * Faytor SPA - Modular Application State Management & View Routing
 */

// Monitora todas as requisições da aplicação sem exigir alterações em cada fetch.
if (!window.__faytorFetchWrapped) {
  const nativeFetch = window.fetch.bind(window);
  window.faytorPendingRequests = 0;
  window.fetch = async (...args) => {
    window.faytorPendingRequests += 1;
    window.dispatchEvent(new Event('faytor:request-change'));
    try {
      return await nativeFetch(...args);
    } finally {
      window.faytorPendingRequests = Math.max(0, window.faytorPendingRequests - 1);
      window.dispatchEvent(new Event('faytor:request-change'));
    }
  };
  window.__faytorFetchWrapped = true;
}

window.addressStates = [['AC', 'Acre'], ['AL', 'Alagoas'], ['AP', 'Amapá'], ['AM', 'Amazonas'], ['BA', 'Bahia'], ['CE', 'Ceará'], ['DF', 'Distrito Federal'], ['ES', 'Espírito Santo'], ['GO', 'Goiás'], ['MA', 'Maranhão'], ['MT', 'Mato Grosso'], ['MS', 'Mato Grosso do Sul'], ['MG', 'Minas Gerais'], ['PA', 'Pará'], ['PB', 'Paraíba'], ['PR', 'Paraná'], ['PE', 'Pernambuco'], ['PI', 'Piauí'], ['RJ', 'Rio de Janeiro'], ['RN', 'Rio Grande do Norte'], ['RS', 'Rio Grande do Sul'], ['RO', 'Rondônia'], ['RR', 'Roraima'], ['SC', 'Santa Catarina'], ['SP', 'São Paulo'], ['SE', 'Sergipe'], ['TO', 'Tocantins']];
// As cidades e os endereços são consultados em tempo real; esta tela não usa CEP fictício.
window.addressCities = {};
window.addressCityCache = {};

window.handleMaskedGeneratorChange = event => {
  const settings = {
    'cnpj-with-punctuation': { output: 'cnpj-generated', thumb: 'cnpj-switch-thumb', storage: 'faytor.cnpj.preferences', clean: value => value.replace(/\D/g, ''), format: value => value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') },
    'cns-with-punctuation': { output: 'cns-generated', thumb: 'cns-switch-thumb', storage: 'faytor.cns.preferences', clean: value => value.replace(/\D/g, ''), format: value => value.replace(/^(\d{3})(\d{4})(\d{4})(\d{4})$/, '$1 $2 $3 $4') },
    'pis-with-punctuation': { output: 'pis-generated', thumb: 'pis-switch-thumb', storage: 'faytor.pis.preferences', clean: value => value.replace(/\D/g, ''), format: value => value.replace(/^(\d{3})(\d{5})(\d{2})(\d{1})$/, '$1.$2.$3-$4') },
    'rg-with-punctuation': { output: 'rg-generated', thumb: 'rg-switch-thumb', storage: 'faytor.rg.preferences', clean: value => value.replace(/[^0-9X]/gi, ''), format: value => value.replace(/^(\d{2})(\d{3})(\d{3})([\dX])$/, '$1.$2.$3-$4') }
  }[event.target.id];
  if (!settings) return;

  const checkbox = event.target;
  const output = document.getElementById(settings.output);
  const thumb = document.getElementById(settings.thumb);
  if (!output || !thumb) return;

  const root = output.closest('[x-data]');
  const viewState = root && window.Alpine ? Alpine.$data(root) : null;
  if (viewState) viewState.withPunctuation = checkbox.checked;
  thumb.classList.toggle('translate-x-1', !checkbox.checked);
  thumb.classList.toggle('translate-x-6', checkbox.checked);
  const raw = settings.clean(output.value);
  output.value = checkbox.checked ? settings.format(raw) : raw;
  localStorage.setItem(settings.storage, JSON.stringify({ withPunctuation: checkbox.checked }));
};

window.pasteToInput = async inputId => {
  const input = document.getElementById(inputId);
  if (!input || !navigator.clipboard) return;

  try {
    input.value = await navigator.clipboard.readText();
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
  } catch (error) {
    console.warn('Não foi possível acessar o conteúdo da área de transferência.', error);
  }
};

// Geração de senhas compartilhada pelo gerador individual e pela geração em lote.
window.faytorPasswords = {
  characterSets: ['ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz', '0123456789', '!@#$%^&*()_+[]{}|;:,.<>?'],
  words: 'abacate|alegria|amigo|amizade|amora|arco|areia|aviao|banana|bicicleta|borboleta|brisa|caderno|cachorro|caminho|caneca|carinho|castelo|chuva|cidade|coelho|coragem|coruja|cristal|doce|estrela|familia|felicidade|flor|floresta|formiga|futuro|garrafa|girassol|golfinho|harmonia|janela|jardim|laranja|leao|livro|lua|macarrao|manha|melancia|montanha|musica|nuvem|oceano|passeio|peixe|pipoca|planeta|ponte|praia|presente|queijo|raposa|rio|sabor|sapo|segredo|sorriso|tempo|tesouro|tomate|universo|viagem|vento|verao|verde|vitoria'.split('|'),

  randomIndex(max) {
    if (window.crypto?.getRandomValues) {
      const values = new Uint32Array(1);
      window.crypto.getRandomValues(values);
      return values[0] % max;
    }
    return Math.floor(Math.random() * max);
  },

  random(length, sets) {
    const allCharacters = sets.join('');
    return Array.from({ length }, () => allCharacters[this.randomIndex(allCharacters.length)]).join('');
  },

  easy(count, capitalize, complete) {
    return Array.from({ length: count }, () => {
      const word = this.words[this.randomIndex(this.words.length)];
      const part = complete ? word : word.slice(0, Math.max(3, Math.ceil(word.length * 0.65)));
      return capitalize ? part.charAt(0).toUpperCase() + part.slice(1) : part;
    }).join('-');
  },

  pin(length) {
    return Array.from({ length }, () => String(this.randomIndex(10))).join('');
  },

  // Lê o modo e as opções atuais da tela, com os mesmos limites do gerador individual.
  fromPage() {
    const field = id => document.getElementById(id);
    const number = (id, min, max, fallback) => Math.min(max, Math.max(min, Number.parseInt(field(id)?.value, 10) || fallback));
    const mode = document.querySelector('[data-password-mode][aria-selected="true"]')?.dataset.passwordMode || 'random';
    if (mode === 'easy') return this.easy(number('easy-length', 2, 10, 4), field('easy-capitalize')?.checked, field('easy-complete')?.checked);
    if (mode === 'pin') return this.pin(number('pin-length', 4, 32, 6));
    const ids = ['password-uppercase', 'password-lowercase', 'password-numbers', 'password-special'];
    const sets = this.characterSets.filter((_, index) => field(ids[index])?.checked);
    return sets.length ? this.random(number('password-length', 4, 128, 16), sets) : '';
  }
};
window.faytorBatchSources = Object.assign(window.faytorBatchSources || {}, { senha: () => window.faytorPasswords.fromPage() });

window.handleCnpjFormatChange = event => {
  window.cnpjGenerator.format = event.target.value;
  window.saveCnpjPreferences();
  window.generateCnpj();
};

window.handleCnpjPunctuationChange = event => {
  const checkbox = event.target;
  const output = document.getElementById('cnpj-generated');
  const thumb = document.getElementById('cnpj-switch-thumb');
  if (!output || !thumb) return;

  window.cnpjGenerator.withPunctuation = checkbox.checked;
  window.saveCnpjPreferences();
  thumb.classList.toggle('translate-x-1', !checkbox.checked);
  thumb.classList.toggle('translate-x-6', checkbox.checked);
  output.value = window.formatCnpjValue(output.value.replace(/[^A-Z0-9]/gi, '').toUpperCase());
};

window.cnpjGenerator = { format: 'numeric', withPunctuation: true };

window.saveCnpjPreferences = () => {
  localStorage.setItem('faytor.cnpj.preferences', JSON.stringify({
    format: window.cnpjGenerator.format,
    withPunctuation: window.cnpjGenerator.withPunctuation
  }));
};

window.loadCnpjPreferences = () => {
  const saved = JSON.parse(localStorage.getItem('faytor.cnpj.preferences') || '{}');
  window.cnpjGenerator.format = saved.format === 'alphanumeric' ? 'alphanumeric' : 'numeric';
  window.cnpjGenerator.withPunctuation = saved.withPunctuation !== false;
};

window.formatCnpjValue = raw => window.cnpjGenerator.withPunctuation
  ? raw.replace(/^([A-Z0-9]{2})([A-Z0-9]{3})([A-Z0-9]{3})([A-Z0-9]{4})(\d{2})$/, '$1.$2.$3/$4-$5')
  : raw;

window.generateCnpj = () => {
  const output = document.getElementById('cnpj-generated');
  if (output) output.value = window.formatCnpjValue(window.faytorDocuments.cnpj.generate({ format: window.cnpjGenerator.format }));
};

window.copyCnpj = async () => {
  const output = document.getElementById('cnpj-generated');
  const button = document.getElementById('cnpj-copy-button');
  if (!output || !output.value || !navigator.clipboard) return;
  await navigator.clipboard.writeText(output.value);
  if (!button) return;
  button.classList.remove('bg-primary', 'hover:bg-blue-700', 'border-primary');
  button.classList.add('bg-emerald-500', 'border-emerald-500');
  window.setTimeout(() => {
    button.classList.remove('bg-emerald-500', 'border-emerald-500');
    button.classList.add('bg-primary', 'hover:bg-blue-700', 'border-primary');
  }, 2000);
};

document.addEventListener('alpine:init', () => {
  Alpine.data('appState', () => ({
    // Reactive State
    currentTab: 'home',
    theme: localStorage.getItem('theme') || 'dark',
    mobileMenuOpen: false,
    cookieConsent: localStorage.getItem('faytor.cookie-consent') || '',
    showCookieBanner: false,

    // Dynamic View Loading State
    viewContent: '',
    serverViewContent: '',
    isLoading: false,
    isNetworkLoading: false,
    corsFallback: false, // Set to true if local file access CORS policy blocks dynamic loading

    // Dictionary of pre-defined view paths
    views: {
      home: 'views/inicio.html',
      wordcounter: 'views/wordcounter.html',
      jsonformatter: 'views/jsonformatter.html',
      base64: 'views/base64.html',
      'gerador-cpf': 'views/gerador-cpf.html',
      'gerador-endereco': 'views/gerador-endereco.html',
      'gerador-hash': 'views/gerador-hash.html',
      'gerador-json': 'views/gerador-json.html',
      'gerador-lorem-ipsum': 'views/gerador-lorem-ipsum.html',
      'gerador-numeros': 'views/gerador-numeros.html',
      'gerador-palavras': 'views/gerador-palavras.html',
      'gerador-cnpj': 'views/gerador-cnpj.html',
      'gerador-cns': 'views/gerador-cns.html',
      'gerador-rg': 'views/gerador-rg.html',
      'gerador-pis': 'views/gerador-pis.html',
      'gerador-nomes': 'views/gerador-nomes.html',
      'gerador-celular': 'views/gerador-celular.html',
      'gerador-email': 'views/gerador-email.html',
      'gerador-senhas': 'views/gerador-senhas.html',
      'validador-cpf': 'views/validador-cpf.html',
      'validador-cnpj': 'views/validador-cnpj.html',
      'validador-cns': 'views/validador-cns.html',
      'validador-rg': 'views/validador-rg.html',
      'validador-pis': 'views/validador-pis.html',
      'politica-de-privacidade': 'views/politica-de-privacidade.html',
      'termos-de-uso': 'views/termos-de-uso.html',
      'contato': 'views/contato.html',
      'sobre-nos': 'views/sobre-nos.html'
    },

    // Descriptive, SEO-friendly page titles
    titles: {
      home: 'Faytor - Ferramentas e Utilitários de Alta Performance',
      wordcounter: 'Contador de Palavras - Ferramenta Online Grátis | Faytor',
      jsonformatter: 'Formatador JSON - Formatar, Validar e Visualizar JSON | Faytor',
      base64: 'Codificador e Decodificador Base64 Online | Faytor',
      'gerador-cpf': 'Gerador de CPF Online - Gerar CPF Válido para Testes | Faytor',
      'gerador-endereco': 'Gerador de CEP e Endereço Online para Testes | Faytor',
      'gerador-hash': 'Gerador de Hash MD5, SHA-1, SHA-256 e SHA-512 Online | Faytor',
      'gerador-json': 'Gerador de JSON com Dados de Teste e Mock de API | Faytor',
      'gerador-lorem-ipsum': 'Gerador de Lorem Ipsum Online | Faytor',
      'gerador-numeros': 'Gerador de Números Aleatórios Online | Faytor',
      'gerador-palavras': 'Gerador de Palavras Aleatórias Online | Faytor',
      'gerador-cnpj': 'Gerador de CNPJ Online - Gerar CNPJ Válido para Testes | Faytor',
      'gerador-cns': 'Gerador de CNS Online - Cartão Nacional de Saúde | Faytor',
      'gerador-rg': 'Gerador de RG Online - Gerar Registro Geral para Testes | Faytor',
      'gerador-pis': 'Gerador de PIS/PASEP Online - Gerar PIS Válido | Faytor',
      'gerador-nomes': 'Gerador de Nomes Online - Nomes Fictícios Aleatórios | Faytor',
      'gerador-celular': 'Gerador de Celular Online - Números de Telefone Válidos | Faytor',
      'gerador-email': 'Gerador de E-mail Fictício para Testes | Faytor',
      'gerador-senhas': 'Gerador de Senhas Online | Faytor',
      'validador-cpf': 'Validador de CPF Online - Verificar CPF Válido | Faytor',
      'validador-cnpj': 'Validador de CNPJ Online - Verificar CNPJ Válido | Faytor',
      'validador-cns': 'Validador de CNS Online - Verificar Cartão de Saúde | Faytor',
      'validador-rg': 'Validador de RG Online - Verificar Registro Geral | Faytor',
      'validador-pis': 'Validador de PIS/PASEP Online - Verificar PIS Válido | Faytor',
      'politica-de-privacidade': 'Política de Privacidade | Faytor',
      'termos-de-uso': 'Termos de Uso | Faytor',
      'contato': 'Contato - Fale Conosco | Faytor',
      'sobre-nos': 'Sobre Nós - Conheça o Faytor | Faytor'
    },

    descriptions: {
      home: 'Faytor reúne ferramentas online gratuitas para geração, validação e utilidades do dia a dia.',
      wordcounter: 'Conte palavras, caracteres e parágrafos online com o contador de palavras gratuito do Faytor.',
      jsonformatter: 'Formate, valide e visualize JSON online de forma rápida e gratuita.',
      base64: 'Codifique e decodifique textos em Base64 online gratuitamente.',
      'gerador-cpf': 'Gere números de CPF válidos para testes e desenvolvimento.',
      'gerador-endereco': 'Gere endereços brasileiros reais consultados no ViaCEP para testes e desenvolvimento.',
      'gerador-hash': 'Gere hash MD5, SHA-1, SHA-224, SHA-256, SHA-384, SHA-512 ou CRC32 de um texto ou valor aleatório, com HMAC, Base64 e comparação de hashes.',
      'gerador-json': 'Gere JSON com CPF, CNPJ, nomes, e-mails e celulares válidos a partir do seu modelo. Crie payloads, mocks de API e massa de dados em lote (JSON e JSONL).',
      'gerador-lorem-ipsum': 'Gere texto Lorem Ipsum por palavras, parágrafos ou caracteres para preencher layouts, protótipos e testes de interface. Copie com um clique.',
      'gerador-numeros': 'Gere números aleatórios inteiros, decimais ou em dinheiro (R$ e US$), por quantidade de dígitos ou intervalo, com separadores brasileiro ou americano.',
      'gerador-palavras': 'Sorteie palavras aleatórias por categoria: cores, animais, frutas, comidas, nomes, países, meios de transporte, profissões e esportes. Gere em lote.',
      'gerador-cnpj': 'Gere números de CNPJ válidos para testes e desenvolvimento.',
      'gerador-cns': 'Gere números de CNS válidos para testes e desenvolvimento.',
      'gerador-rg': 'Gere números de RG fictícios para testes e desenvolvimento.',
      'gerador-pis': 'Gere números de PIS/PASEP válidos para testes e desenvolvimento.',
      'gerador-nomes': 'Gere nomes fictícios aleatórios online para testes e desenvolvimento.',
      'gerador-celular': 'Gere números de celular fictícios para testes e desenvolvimento.',
      'gerador-email': 'Gere endereços de e-mail fictícios e aleatórios para testes.',
      'gerador-senhas': 'Gere senhas fortes e aleatórias online com opções personalizadas.',
      'validador-cpf': 'Valide números de CPF online de forma rápida e gratuita.',
      'validador-cnpj': 'Valide números de CNPJ online de forma rápida e gratuita.',
      'validador-cns': 'Valide números de CNS online de forma rápida e gratuita.',
      'validador-rg': 'Confira números de RG online para testes e desenvolvimento.',
      'validador-pis': 'Valide números de PIS/PASEP online de forma rápida e gratuita.',
      'politica-de-privacidade': 'Leia a política de privacidade do Faytor.',
      'termos-de-uso': 'Leia os termos de uso do Faytor.',
      contato: 'Entre em contato com a equipe do Faytor.',
      'sobre-nos': 'Conheça quem mantém o Faytor, como as ferramentas são feitas e como o conteúdo é conferido.'
    },

    init() {
      this.showCookieBanner = !this.cookieConsent;
      // Abaixo de 1024 px o menu lateral é uma gaveta; fechada, ela fica invisível (fora do Tab).
      // Ao abrir, o foco entra no menu depois que a gaveta volta a ficar visível.
      this.$watch('mobileMenuOpen', open => {
        if (open) window.setTimeout(() => this.$refs.closeMenuButton?.focus(), 50);
      });
      this.isNetworkLoading = window.faytorPendingRequests > 0;
      // Consultas em sequência (como IBGE e depois ViaCEP) zeram o contador por um instante.
      // Esperar antes de esconder evita que o overlay pisque e que o Alpine interrompa a
      // transição no meio, o que gera "Uncaught (in promise)" no console.
      let hideOverlay;
      window.addEventListener('faytor:request-change', () => {
        window.clearTimeout(hideOverlay);
        if (window.faytorPendingRequests > 0) {
          this.isNetworkLoading = true;
          return;
        }
        hideOverlay = window.setTimeout(() => {
          this.isNetworkLoading = window.faytorPendingRequests > 0;
        }, 200);
      });

      // O servidor entrega a view completa na primeira resposta. Mantemos esse
      // conteúdo para evitar que a rota pareça vazia antes do JavaScript rodar.
      this.serverViewContent = document.getElementById('server-view-content')?.innerHTML.trim() || '';

      // Retrieve deep-link tab name using URL pathname or legacy hash fallback
      const hashTab = window.location.hash.slice(1);
      const pathTab = window.location.pathname.replace(/^\/+|\/+$/g, '');
      const initialTab = this.views[pathTab] ? pathTab : (this.views[hashTab] ? hashTab : (pathTab ? 'not-found' : 'home'));
      this.currentTab = initialTab;
      if (initialTab !== (this.views[pathTab] ? pathTab : 'home')) this.serverViewContent = '';

      // Clean browser address bar if using legacy hash
      if (hashTab && this.views[hashTab]) {
        const newPath = hashTab === 'home' ? '/' : `/${hashTab}/`;
        window.history.replaceState({ tab: hashTab }, '', newPath);
      }

      // Initialize layout theme
      this.applyTheme();

      // Load initial view content and update tab title
      this.loadView(this.currentTab);
      this.updateMetadata(this.currentTab);

      // Watchers for persistent state storage
      this.$watch('theme', val => {
        localStorage.setItem('theme', val);
        this.applyTheme();
      });

      this.$watch('currentTab', val => {
        localStorage.setItem('currentTab', val);
        this.loadView(val);
        this.updateMetadata(val);
      });

      window.addEventListener('popstate', (event) => {
        const pathTab = window.location.pathname.replace(/^\/+|\/+$/g, '');
        const tabName = this.views[pathTab] ? pathTab : (pathTab ? 'not-found' : 'home');
        if (tabName !== this.currentTab) {
          this.currentTab = tabName;
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    },

    updateTitle(tabName) {
      const title = this.titles[tabName] || 'Página não encontrada | Faytor';
      document.title = title;
    },

    updateMetadata(tabName) {
      const title = this.titles[tabName] || this.titles.home;
      const description = this.descriptions[tabName] || 'A página solicitada não foi encontrada.';
      const path = !this.views[tabName] ? window.location.pathname : (tabName === 'home' ? '/' : `/${tabName}/`);
      const canonical = new URL(path, 'https://www.faytor.com.br').href;
      const noindexRoutes = [];

      document.title = title;
      document.querySelector('meta[name="description"]')?.setAttribute('content', description);
      document.querySelector('meta[name="robots"]')?.setAttribute('content', (!this.views[tabName] || noindexRoutes.includes(tabName)) ? 'noindex, follow' : 'index, follow');
      document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonical);
      document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
      document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
      document.querySelector('meta[property="og:url"]')?.setAttribute('content', canonical);
      document.querySelector('meta[property="twitter:title"]')?.setAttribute('content', title);
      document.querySelector('meta[property="twitter:description"]')?.setAttribute('content', description);
      document.querySelector('meta[property="twitter:url"]')?.setAttribute('content', canonical);
      document.querySelector('meta[property="og:image:alt"]')?.setAttribute('content', `${title} - Faytor`);
      document.querySelector('meta[property="twitter:image:alt"]')?.setAttribute('content', `${title} - Faytor`);
    },

    /**
     * Apply theme CSS class to document root
     */
    applyTheme() {
      if (this.theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
      }
    },

    /**
     * Toggle between Light and Dark mode
     */
    toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark';
    },

    acceptCookies() {
      this.cookieConsent = 'accepted';
      localStorage.setItem('faytor.cookie-consent', this.cookieConsent);
      this.showCookieBanner = false;
      this.loadAdvertising();
    },

    rejectCookies() {
      this.cookieConsent = 'rejected';
      localStorage.setItem('faytor.cookie-consent', this.cookieConsent);
      this.showCookieBanner = false;
    },

    loadAdvertising() {
      // Veiculação suspensa durante a revisão editorial. A meta de verificação
      // e ads.txt permanecem disponíveis para o AdSense. Reativar exige definir
      // inventário editorial e tratar navegação SPA, erros e overlays; carregar
      // Auto Ads uma vez mantém o script ativo também nas telas seguintes.
      return;
    },

    /**
     * Set dynamic tab and close mobile drawer
     */
    selectTab(tabName) {
      if (this.views[tabName]) {
        this.currentTab = tabName;
        // O deploy estático publica cada rota como um diretório com index.html.
        // A barra final garante que o GitHub Pages resolva esse index no refresh.
        const newPath = tabName === 'home' ? '/' : `/${tabName}/`;
        if (window.location.pathname !== newPath) {
          window.history.pushState({ tab: tabName }, '', newPath);
        }
        // A gaveta fechada fica inerte; o foco vai para o conteúdo em vez de sumir com o link.
        if (this.mobileMenuOpen) document.getElementById('main-content-area')?.focus({ preventScroll: true });
        this.mobileMenuOpen = false;

        // Retorna ao início do conteúdo selecionado.
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },

    /**
     * Dynamically loads HTML views using fetch or displays local-run fallback instruction
     */
    async loadView(tabName) {
      const viewPath = this.views[tabName];
      if (!viewPath) {
        this.serverViewContent = '';
        this.viewContent = '<section><h1>Página não encontrada</h1><p>Confira o endereço ou escolha uma ferramenta no menu.</p></section>';
        this.isLoading = false;
        this.corsFallback = false;
        return;
      }

      this.isLoading = true;
      this.corsFallback = false;

      try {
        // A navegação usa pushState e muda a URL para /rota/. Um caminho
        // relativo como "views/arquivo.html" passaria então a apontar para
        // /rota/views/arquivo.html, causando 404 na primeira navegação.
        // Mantemos o caminho relativo no file:// para preservar o fallback
        // de uso local sem servidor.
        const url = window.location.protocol === 'file:'
          ? viewPath
          : `/${viewPath}`;
        const serverContent = this.serverViewContent;
        this.serverViewContent = '';
        const response = serverContent ? null : await fetch(url);
        if (response && !response.ok) {
          throw new Error(`Erro ao carregar a visualização: ${response.statusText}`);
        }
        this.viewContent = serverContent || await response.text();
        if (tabName === 'gerador-cpf') {
          this.$nextTick(() => {
            window.setTimeout(() => this.initCpfGenerator(), 0);
          });
        }
        if (tabName === 'gerador-cnpj') {
          this.$nextTick(() => {
            window.setTimeout(() => {
              window.loadCnpjPreferences();
              const formatSelect = document.querySelector('[aria-label="Selecionar formato do CNPJ"]');
              const punctuationCheckbox = document.getElementById('cnpj-with-punctuation');
              if (formatSelect) formatSelect.value = window.cnpjGenerator.format;
              if (punctuationCheckbox) punctuationCheckbox.checked = window.cnpjGenerator.withPunctuation;
              window.generateCnpj();
              if (punctuationCheckbox) window.handleCnpjPunctuationChange({ target: punctuationCheckbox });
            }, 0);
          });
        }
        if (['gerador-cns', 'gerador-pis', 'gerador-rg'].includes(tabName)) {
          this.$nextTick(() => {
            window.setTimeout(() => this.initMaskedGenerator(tabName), 0);
          });
        }
        if (tabName === 'gerador-senhas') {
          this.$nextTick(() => {
            window.setTimeout(() => this.initPasswordGenerator(), 0);
          });
        }
        if (tabName === 'gerador-endereco') {
          this.$nextTick(() => window.setTimeout(() => this.initAddressGenerator(), 0));
        }
      } catch (err) {
        console.warn('Dynamic fetch blocked or failed. Checking for CORS constraint.', err);

        // Handle CORS block when opened directly through file:// protocol
        if (window.location.protocol === 'file:') {
          this.corsFallback = true;
        } else {
          this.viewContent = `<div class="p-6 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-2xl">
            <h2 class="text-lg font-bold">Erro de Carregamento</h2>
            <p class="text-sm mt-1">Não foi possível carregar o conteúdo da visualização modular "${tabName}". Verifique o console para mais detalhes.</p>
          </div>`;
        }
      } finally {
        this.isLoading = false;
        if (this.cookieConsent === 'accepted') this.loadAdvertising();
      }
    },

    /**
     * Initializes the CPF generator after its view is inserted with x-html.
     */
    initAddressGenerator() {
      const stateSelect = document.getElementById('address-state');
      const citySelect = document.getElementById('address-city');
      const checkbox = document.getElementById('address-with-punctuation');
      const thumb = document.getElementById('address-switch-thumb');
      const ids = ['address-cep', 'address-street', 'address-number', 'address-neighborhood', 'address-city-output', 'address-state-output'];
      const fields = ids.map(id => document.getElementById(id));
      const generateButton = document.getElementById('address-generate');
      const generateCopyButton = document.getElementById('address-generate-copy');
      const copyAllButton = document.getElementById('address-copy-all');
      const copyButtons = [...document.querySelectorAll('[data-copy-target]')];
      if (!stateSelect || !citySelect || !checkbox || !thumb || fields.some(field => !field) || !generateButton || !generateCopyButton || !copyAllButton || copyButtons.length !== fields.length || checkbox.dataset.initialized === 'true') return;

      const states = window.addressStates;
      const cities = window.addressCityCache;
      const saved = JSON.parse(localStorage.getItem('faytor.address.preferences') || '{}');
      states.forEach(([code, name]) => stateSelect.add(new Option(`${name} (${code})`, code)));
      stateSelect.value = saved.state && (saved.state === 'random' || window.addressStates.some(([code]) => code === saved.state)) ? saved.state : 'random';
      checkbox.checked = saved.withPunctuation !== false;
      const streetQueries = ['Rua', 'Avenida', 'Alameda', 'Travessa', 'Estrada', 'Praça', 'Rodovia', 'Rua A', 'Rua B', 'Avenida A', 'Avenida B', 'Jardim', 'Centro'];
      const random = max => Math.floor(Math.random() * max);
      const pick = list => list[random(list.length)];
      const shuffled = list => [...list].sort(() => Math.random() - 0.5);
      const updateSwitch = () => {
        thumb.classList.toggle('translate-x-1', !checkbox.checked);
        thumb.classList.toggle('translate-x-6', checkbox.checked);
      };
      const loadCities = async stateCode => {
        if (cities[stateCode]) return cities[stateCode];
        const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateCode}/municipios`);
        if (!response.ok) throw new Error('Não foi possível carregar as cidades do estado.');
        const data = await response.json();
        const names = data.map(city => city.nome).filter(Boolean);
        if (names.length < 15) throw new Error('O estado não retornou cidades suficientes.');
        cities[stateCode] = names;
        return names;
      };
      const updateCities = async () => {
        citySelect.innerHTML = '';
        if (stateSelect.value === 'random') {
          citySelect.add(new Option('Aleatória', 'random'));
          citySelect.disabled = true;
          return;
        }
        citySelect.disabled = true;
        citySelect.add(new Option('Carregando cidades...', 'loading'));
        const stateCities = await loadCities(stateSelect.value);
        citySelect.innerHTML = '';
        citySelect.disabled = false;
        citySelect.add(new Option('Aleatória', 'random'));
        stateCities.forEach(name => citySelect.add(new Option(name, name)));
        citySelect.value = saved.state === stateSelect.value && saved.city && [...citySelect.options].some(option => option.value === saved.city)
          ? saved.city
          : 'random';
      };
      const formatCep = raw => checkbox.checked ? raw.replace(/^(\d{5})(\d{3})$/, '$1-$2') : raw;
      const getState = () => stateSelect.value === 'random' ? pick(states) : states.find(([code]) => code === stateSelect.value);
      const generate = async () => {
        const [stateCode, stateName] = getState();
        const stateCities = await loadCities(stateCode);
        const fixedCity = citySelect.value !== 'random' && stateSelect.value === stateCode;
        const selectedCities = fixedCity
          ? citySelect.value
          : shuffled(stateCities).slice(0, Math.min(stateCities.length, 10));
        let result = [];
        let cityName = fixedCity ? selectedCities : '';
        const citiesToTry = fixedCity ? [selectedCities] : selectedCities;
        for (const candidateCity of citiesToTry) {
          cityName = candidateCity;
          for (const query of shuffled(streetQueries)) {
            const url = `https://viacep.com.br/ws/${encodeURIComponent(stateCode)}/${encodeURIComponent(cityName)}/${encodeURIComponent(query)}/json/`;
            try {
              const response = await fetch(url);
              if (response.ok) {
                const data = await response.json();
                result = Array.isArray(data) ? data.filter(item => !item.erro && item.cep && item.logradouro) : [];
              }
            } catch (error) {
              console.warn('Falha temporária ao consultar o ViaCEP:', error);
            }
            if (result.length) break;
          }
          if (result.length) break;
        }
        if (!result.length) throw new Error('O ViaCEP não encontrou um endereço para esta cidade.');
        const address = pick(result);
        fields[0].value = formatCep(address.cep.replace(/\D/g, ''));
        fields[1].value = address.logradouro;
        fields[2].value = String(1 + random(9999));
        fields[3].value = address.bairro || '';
        fields[4].value = address.localidade || cityName;
        fields[5].value = `${stateName} (${address.uf || stateCode})`;
        localStorage.setItem('faytor.address.preferences', JSON.stringify({ state: stateSelect.value, city: citySelect.value, withPunctuation: checkbox.checked }));
      };
      const showGenerationError = error => {
        console.warn('Não foi possível consultar um endereço real:', error);
        fields.forEach(field => { field.value = ''; });
        fields[1].value = 'Nenhum logradouro real encontrado para essa seleção';
      };
      const exportFormat = document.getElementById('address-export-format');
      const downloadButton = document.getElementById('address-download');
      const addressData = () => {
        const [, stateName = fields[5].value, uf = ''] = fields[5].value.match(/^(.*) \(([A-Z]{2})\)$/) || [];
        return { cep: fields[0].value, logradouro: fields[1].value, numero: fields[2].value, bairro: fields[3].value, cidade: fields[4].value, estado: stateName, uf };
      };
      // Copiar todos, Gerar e Copiar e Baixar arquivo usam o formato escolhido.
      const addressText = () => {
        const data = addressData();
        if (exportFormat?.value === 'csv') {
          const { csvCell } = window.faytorExport;
          return `${Object.keys(data).join(';')}\n${Object.values(data).map(csvCell).join(';')}`;
        }
        if (exportFormat?.value === 'json') return JSON.stringify(data, null, 2);
        return `CEP: ${fields[0].value}\nEndereço: ${fields[1].value}\nNúmero: ${fields[2].value}\nBairro: ${fields[3].value}\nCidade: ${fields[4].value}\nEstado: ${fields[5].value}`;
      };
      const downloadAddress = () => {
        if (!fields[0].value) return;
        const format = exportFormat?.value || 'txt';
        window.faytorExport.download(addressText(), `endereco-${fields[0].value.replace(/\D/g, '')}.${format}`, window.faytorExport.mimes[format]);
      };
      const setCopiedState = (button, copied) => {
        const label = button.querySelector('span');
        const icon = button.querySelector('svg');
        button.classList.toggle('bg-primary', !copied);
        button.classList.toggle('hover:bg-blue-700', !copied);
        button.classList.toggle('border-primary', !copied);
        button.classList.toggle('bg-emerald-500', copied);
        button.classList.toggle('border-emerald-500', copied);
        if (label) label.textContent = copied ? 'Copiado!' : 'Copiar';
        if (icon) icon.innerHTML = copied
          ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m5 13 4 4L19 7" />'
          : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 8V6a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2h-2M8 8H6a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-2M8 8h6a2 2 0 012 2v6" />';
      };
      const copyField = async button => {
        const field = document.getElementById(button.dataset.copyTarget);
        if (!field?.value || !navigator.clipboard) return;
        await navigator.clipboard.writeText(field.value);
        setCopiedState(button, true);
        window.setTimeout(() => setCopiedState(button, false), 2000);
      };
      const runGenerate = () => generate().catch(showGenerationError);
      stateSelect.addEventListener('change', async () => { try { await updateCities(); await generate(); } catch (error) { showGenerationError(error); } });
      citySelect.addEventListener('change', runGenerate);
      checkbox.addEventListener('change', () => { updateSwitch(); fields[0].value = formatCep(fields[0].value.replace(/\D/g, '')); runGenerate(); });
      generateButton.addEventListener('click', runGenerate);
      generateCopyButton.addEventListener('click', async () => { try { await generate(); await navigator.clipboard?.writeText(addressText()); } catch (error) { showGenerationError(error); } });
      copyAllButton.addEventListener('click', async () => { await navigator.clipboard?.writeText(addressText()); });
      downloadButton?.addEventListener('click', downloadAddress);
      copyButtons.forEach(button => button.addEventListener('click', () => copyField(button)));
      checkbox.dataset.initialized = 'true';
      updateSwitch();
      updateCities().then(() => generate()).catch(showGenerationError);
    },

    initCpfGenerator() {
      const checkbox = document.getElementById('cpf-with-punctuation');
      const stateSelect = document.getElementById('cpf-state');
      const output = document.getElementById('cpf-generated');
      const generateButton = document.getElementById('cpf-generate');
      const generateCopyButton = document.getElementById('cpf-generate-copy');
      const fieldCopyButton = document.getElementById('cpf-copy-field');
      const switchThumb = document.getElementById('cpf-switch-thumb');

      if (!checkbox || !stateSelect || !output || !generateButton || !generateCopyButton || !fieldCopyButton || !switchThumb) return;
      if (checkbox.dataset.initialized === 'true') return;

      const storageKey = 'faytor.cpf.preferences';
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      const stateRegions = window.faytorDocuments.cpf.stateRegions;

      checkbox.checked = saved.withPunctuation !== false;
      stateSelect.value = stateRegions[saved.state] !== undefined ? saved.state : 'random';

      const updateSwitch = () => {
        switchThumb.classList.toggle('translate-x-1', !checkbox.checked);
        switchThumb.classList.toggle('translate-x-6', checkbox.checked);
      };
      updateSwitch();

      const formatCpf = raw => checkbox.checked
        ? raw.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
        : raw;

      const generate = () => {
        output.value = formatCpf(window.faytorDocuments.cpf.generate({ state: stateSelect.value }));
        localStorage.setItem(storageKey, JSON.stringify({
          withPunctuation: checkbox.checked,
          state: stateSelect.value
        }));
        fieldCopyButton.classList.remove('bg-emerald-500', 'border-emerald-500');
        fieldCopyButton.classList.add('bg-primary', 'hover:bg-blue-700', 'text-white');
      };

      checkbox.addEventListener('change', () => {
        updateSwitch();
        output.value = formatCpf(output.value.replace(/\D/g, ''));
        localStorage.setItem(storageKey, JSON.stringify({
          withPunctuation: checkbox.checked,
          state: stateSelect.value
        }));
      });
      stateSelect.addEventListener('change', generate);
      generateButton.addEventListener('click', generate);
      const copyCpf = async () => {
        if (!output.value) return;
        await navigator.clipboard.writeText(output.value);
        fieldCopyButton.classList.remove('bg-primary', 'hover:bg-blue-700');
        fieldCopyButton.classList.add('bg-emerald-500', 'border-emerald-500', 'text-white');
        window.setTimeout(() => {
          fieldCopyButton.classList.remove('bg-emerald-500', 'border-emerald-500');
          fieldCopyButton.classList.add('bg-primary', 'hover:bg-blue-700', 'text-white');
        }, 2000);
      };
      fieldCopyButton.addEventListener('click', copyCpf);
      generateCopyButton.addEventListener('click', async () => {
        generate();
        await copyCpf();
      });

      checkbox.dataset.initialized = 'true';
      generate();
    },

    initMaskedGenerator(tabName) {
      const config = {
        'gerador-cns': { checkbox: 'cns-with-punctuation', output: 'cns-generated', thumb: 'cns-switch-thumb', storage: 'faytor.cns.preferences', clean: value => value.replace(/\D/g, ''), format: raw => raw.replace(/^(\d{3})(\d{4})(\d{4})(\d{4})$/, '$1 $2 $3 $4') },
        'gerador-pis': { checkbox: 'pis-with-punctuation', output: 'pis-generated', thumb: 'pis-switch-thumb', storage: 'faytor.pis.preferences', clean: value => value.replace(/\D/g, ''), format: raw => raw.replace(/^(\d{3})(\d{5})(\d{2})(\d{1})$/, '$1.$2.$3-$4') },
        'gerador-rg': { checkbox: 'rg-with-punctuation', output: 'rg-generated', thumb: 'rg-switch-thumb', storage: 'faytor.rg.preferences', clean: value => value.replace(/[^0-9X]/gi, ''), format: raw => raw.replace(/^(\d{2})(\d{3})(\d{3})([\dX])$/, '$1.$2.$3-$4') }
      }[tabName];
      if (!config) return;

      const checkbox = document.getElementById(config.checkbox);
      const output = document.getElementById(config.output);
      const thumb = document.getElementById(config.thumb);
      if (!checkbox || !output || !thumb || checkbox.dataset.initialized === 'true') return;

      const updateSwitch = () => {
        thumb.classList.toggle('translate-x-1', !checkbox.checked);
        thumb.classList.toggle('translate-x-6', checkbox.checked);
      };
      const formatExisting = () => {
        const raw = config.clean(output.value);
        output.value = checkbox.checked ? config.format(raw) : raw;
        output.dispatchEvent(new Event('input', { bubbles: true }));
      };

      const saved = JSON.parse(localStorage.getItem(config.storage) || '{}');
      checkbox.checked = saved.withPunctuation !== false;
      const viewState = Alpine.$data(output.closest('[x-data]'));
      if (viewState) viewState.withPunctuation = checkbox.checked;
      updateSwitch();
      checkbox.dataset.initialized = 'true';
      formatExisting();
    },

    initPasswordGenerator() {
      const lengthInput = document.getElementById('password-length');
      const output = document.getElementById('password-generated');
      const generateButton = document.getElementById('password-generate');
      const generateCopyButton = document.getElementById('password-generate-copy');
      const fieldCopyButton = document.getElementById('password-copy-field');
      const strength = document.getElementById('password-strength');
      const strengthLabel = document.getElementById('password-strength-label');
      const checkboxes = ['password-uppercase', 'password-lowercase', 'password-numbers', 'password-special'].map(id => document.getElementById(id));
      if (!lengthInput || !output || !generateButton || !generateCopyButton || !fieldCopyButton || !strength || !strengthLabel || checkboxes.some(checkbox => !checkbox)) return;
      if (lengthInput.dataset.initialized === 'true') return;

      const storageKey = 'faytor.password.preferences';
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      const modeKey = 'faytor.password.mode';
      const tabs = Array.from(document.querySelectorAll('[data-password-mode]'));
      const panels = { random: document.getElementById('password-panel-random'), easy: document.getElementById('password-panel-easy'), pin: document.getElementById('password-panel-pin') };
      const easyLength = document.getElementById('easy-length');
      const easyCapitalize = document.getElementById('easy-capitalize');
      const easyComplete = document.getElementById('easy-complete');
      const pinLength = document.getElementById('pin-length');
      let mode = ['random', 'easy', 'pin'].includes(localStorage.getItem(modeKey)) ? localStorage.getItem(modeKey) : 'random';
      lengthInput.value = Math.min(128, Math.max(4, Number(saved.length) || 16));
      checkboxes.forEach((checkbox, index) => { checkbox.checked = saved.types?.[index] !== false; });
      const updateSwitches = () => checkboxes.forEach(checkbox => {
        const thumb = document.getElementById(`${checkbox.id}-thumb`);
        if (thumb) {
          thumb.classList.toggle('translate-x-1', !checkbox.checked);
          thumb.classList.toggle('translate-x-6', checkbox.checked);
        }
        const track = checkbox.parentElement;
        if (track) {
          track.classList.toggle('bg-primary', checkbox.checked);
          track.classList.toggle('bg-slate-300', !checkbox.checked);
          track.classList.toggle('dark:bg-slate-700', !checkbox.checked);
        }
      });
      const updateEasySwitches = () => [easyCapitalize, easyComplete].forEach(checkbox => {
        const thumb = document.getElementById(`${checkbox.id}-thumb`);
        const track = checkbox.parentElement;
        thumb?.classList.toggle('translate-x-1', !checkbox.checked);
        thumb?.classList.toggle('translate-x-6', checkbox.checked);
        track?.classList.toggle('bg-primary', checkbox.checked);
        track?.classList.toggle('bg-slate-300', !checkbox.checked);
        track?.classList.toggle('dark:bg-slate-700', !checkbox.checked);
      });
      updateSwitches();
      const passwords = window.faytorPasswords;
      const characterSets = passwords.characterSets;
      const levelColors = ['bg-red-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-500'];
      const levelNames = ['Fraca', 'Média', 'Forte', 'Muito forte'];
      const updateStrength = (length, selectedTypes) => {
        const typeCount = selectedTypes.length;
        const score = Math.min(4, (length >= 8 ? 1 : 0) + (length >= 12 ? 1 : 0) + (length >= 16 ? 1 : 0) + (typeCount >= 3 ? 1 : 0));
        const level = Math.max(1, score);
        strength.setAttribute('aria-valuenow', String(level));
        strengthLabel.textContent = levelNames[level - 1];
        strengthLabel.className = `font-bold ${['text-red-500', 'text-amber-500', 'text-lime-600', 'text-emerald-500'][level - 1]}`;
        Array.from(strength.children).forEach((bar, index) => {
          bar.className = `h-2 rounded-full ${index < level ? levelColors[level - 1] : 'bg-slate-200 dark:bg-slate-700'}`;
        });
      };
      const generate = () => {
        const length = Math.min(128, Math.max(4, Number.parseInt(lengthInput.value, 10) || 16));
        lengthInput.value = length;
        const selectedTypes = characterSets.filter((_, index) => checkboxes[index].checked);
        if (!selectedTypes.length) {
          output.value = '';
          strengthLabel.textContent = 'Selecione uma opção';
          strength.setAttribute('aria-valuenow', '0');
          Array.from(strength.children).forEach(bar => { bar.className = 'h-2 rounded-full bg-slate-200 dark:bg-slate-700'; });
          return;
        }
        output.value = passwords.random(length, selectedTypes);
        updateStrength(length, selectedTypes);
        localStorage.setItem(storageKey, JSON.stringify({ length, types: checkboxes.map(checkbox => checkbox.checked) }));
      };
      const generateEasy = () => {
        const count = Math.min(10, Math.max(2, Number.parseInt(easyLength.value, 10) || 4));
        easyLength.value = count;
        output.value = passwords.easy(count, easyCapitalize.checked, easyComplete.checked);
        updateStrength(output.value.length, count >= 4 ? ['palavras', 'hífens', 'comprimento'] : ['palavras']);
        localStorage.setItem(storageKey, JSON.stringify({ easyLength: count, capitalize: easyCapitalize.checked, complete: easyComplete.checked, length: lengthInput.value, types: checkboxes.map(checkbox => checkbox.checked) }));
      };
      const generatePin = () => {
        const length = Math.min(32, Math.max(4, Number.parseInt(pinLength.value, 10) || 6));
        pinLength.value = length;
        output.value = passwords.pin(length);
        updateStrength(length, ['números']);
        localStorage.setItem(storageKey, JSON.stringify({ pinLength: length, easyLength: easyLength.value, capitalize: easyCapitalize.checked, complete: easyComplete.checked, length: lengthInput.value, types: checkboxes.map(checkbox => checkbox.checked) }));
      };
      const generateCurrent = () => mode === 'easy' ? generateEasy() : mode === 'pin' ? generatePin() : generate();
      const selectMode = nextMode => {
        mode = nextMode;
        localStorage.setItem(modeKey, mode);
          tabs.forEach(tab => {
          const active = tab.dataset.passwordMode === mode;
          tab.setAttribute('aria-selected', String(active));
          tab.classList.toggle('bg-primary', active);
          tab.classList.toggle('hover:bg-blue-700', active);
          tab.classList.toggle('hover:bg-slate-100', !active);
          tab.classList.toggle('dark:hover:bg-slate-800', !active);
          tab.classList.toggle('text-white', active);
          tab.classList.toggle('text-slate-600', !active);
          tab.classList.toggle('dark:text-slate-300', !active);
        });
        Object.entries(panels).forEach(([name, panel]) => panel?.classList.toggle('hidden', name !== mode));
        document.getElementById('password-strength-wrap')?.classList.toggle('hidden', mode !== 'random');
        updateEasySwitches();
        generateCurrent();
      };
      const copyPassword = async () => {
        if (!output.value || !navigator.clipboard) return;
        await navigator.clipboard.writeText(output.value);
        fieldCopyButton.classList.remove('bg-primary', 'hover:bg-blue-700');
        fieldCopyButton.classList.add('bg-emerald-500');
        document.getElementById('password-copy-label').textContent = 'Copiado!';
        window.setTimeout(() => {
          fieldCopyButton.classList.remove('bg-emerald-500');
          fieldCopyButton.classList.add('bg-primary', 'hover:bg-blue-700');
          document.getElementById('password-copy-label').textContent = 'Copiar';
        }, 2000);
      };
      generateButton.addEventListener('click', generateCurrent);
      generateCopyButton.addEventListener('click', async () => { generateCurrent(); await copyPassword(); });
      fieldCopyButton.addEventListener('click', copyPassword);
      lengthInput.addEventListener('change', generateCurrent);
      easyLength.addEventListener('change', generateCurrent);
      pinLength.addEventListener('change', generateCurrent);
      [easyCapitalize, easyComplete].forEach(checkbox => checkbox.addEventListener('change', () => { updateEasySwitches(); generateCurrent(); }));
      checkboxes.forEach(checkbox => checkbox.addEventListener('change', () => { updateSwitches(); generateCurrent(); }));
      tabs.forEach(tab => tab.addEventListener('click', () => selectMode(tab.dataset.passwordMode)));
      lengthInput.dataset.initialized = 'true';
      easyLength.value = Math.min(10, Math.max(2, Number(saved.easyLength) || 4));
      easyCapitalize.checked = saved.capitalize !== false;
      easyComplete.checked = saved.complete !== false;
      pinLength.value = Math.min(32, Math.max(4, Number(saved.pinLength) || 6));
      selectMode(mode);
    }
  }));
});

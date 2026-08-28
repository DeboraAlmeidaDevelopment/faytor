/**
 * Faytor SPA - Modular Application State Management & View Routing
 */

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
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const valueOf = char => char >= '0' && char <= '9' ? Number(char) : char.charCodeAt(0) - 48;
  const calculate = (source, weights) => {
    const sum = source.split('').reduce((total, char, index) => total + valueOf(char) * weights[index], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  const root = window.cnpjGenerator.format === 'numeric'
    ? `${Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('')}0001`
    : Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const dv1 = calculate(root, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const dv2 = calculate(`${root}${dv1}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const output = document.getElementById('cnpj-generated');
  if (output) output.value = window.formatCnpjValue(`${root}${dv1}${dv2}`);
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
    corsFallback: false, // Set to true if local file access CORS policy blocks dynamic loading

    // Dictionary of pre-defined view paths
    views: {
      home: 'views/inicio.html',
      wordcounter: 'views/wordcounter.html',
      jsonformatter: 'views/jsonformatter.html',
      base64: 'views/base64.html',
      'gerador-cpf': 'views/gerador-cpf.html',
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
      'gerador-cnpj': 'Gerador de CNPJ Online - Gerar CNPJ Válido para Testes | Faytor',
      'gerador-cns': 'Gerador de CNS Online - Cartão Nacional de Saúde | Faytor',
      'gerador-rg': 'Gerador de RG Online - Gerar Registro Geral para Testes | Faytor',
      'gerador-pis': 'Gerador de PIS/PASEP Online - Gerar PIS Válido | Faytor',
      'gerador-nomes': 'Gerador de Nomes Online - Nomes Fictícios Aleatórios | Faytor',
      'gerador-celular': 'Gerador de Celular Online - Números de Telefone Válidos | Faytor',
      'gerador-email': 'Gerador de E-mail Temporário e Aleatório | Faytor',
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
      'sobre-nos': 'Conheça o Faytor e suas ferramentas online gratuitas.'
    },

    init() {
      this.showCookieBanner = !this.cookieConsent;

      // O servidor entrega a view completa na primeira resposta. Mantemos esse
      // conteúdo para evitar que a rota pareça vazia antes do JavaScript rodar.
      this.serverViewContent = document.getElementById('server-view-content')?.innerHTML.trim() || '';

      // Retrieve deep-link tab name using URL pathname or legacy hash fallback
      const hashTab = window.location.hash.slice(1);
      const pathTab = window.location.pathname.replace(/^\/+|\/+$/g, '');
      const initialTab = this.views[pathTab] ? pathTab : (this.views[hashTab] ? hashTab : 'home');
      this.currentTab = initialTab;

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
        const tabName = this.views[pathTab] ? pathTab : 'home';
        if (tabName !== this.currentTab) {
          this.currentTab = tabName;
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    },

    updateTitle(tabName) {
      const title = this.titles[tabName] || this.titles.home;
      document.title = title;
    },

    updateMetadata(tabName) {
      const title = this.titles[tabName] || this.titles.home;
      const description = this.descriptions[tabName] || this.descriptions.home;
      const path = tabName === 'home' ? '/' : `/${tabName}`;
      const canonical = new URL(path, 'https://faytor.com.br').href;
      const noindexRoutes = ['politica-de-privacidade', 'termos-de-uso', 'contato', 'sobre-nos'];

      document.title = title;
      document.querySelector('meta[name="description"]')?.setAttribute('content', description);
      document.querySelector('meta[name="robots"]')?.setAttribute('content', noindexRoutes.includes(tabName) ? 'noindex, follow' : 'index, follow');
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
      if (document.querySelector('script[data-faytor-advertising]')) return;
      const nonContentRoutes = ['politica-de-privacidade', 'termos-de-uso', 'contato', 'sobre-nos'];
      if (nonContentRoutes.includes(this.currentTab) || this.isLoading || !this.viewContent.trim()) return;
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3673785596412790';
      script.crossOrigin = 'anonymous';
      script.dataset.faytorAdvertising = 'true';
      document.head.appendChild(script);
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
        this.mobileMenuOpen = false;

        // Return to the page top so the top AdSense banner stays visible.
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },

    /**
     * Dynamically loads HTML views using fetch or displays local-run fallback instruction
     */
    async loadView(tabName) {
      const viewPath = this.views[tabName];
      if (!viewPath) return;

      if (tabName === this.currentTab && this.serverViewContent) {
        this.viewContent = this.serverViewContent;
        this.serverViewContent = '';
        this.isLoading = false;
        if (tabName === 'gerador-senhas') {
          this.$nextTick(() => window.setTimeout(() => this.initPasswordGenerator(), 0));
        }
        if (this.cookieConsent === 'accepted') this.loadAdvertising();
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
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Erro ao carregar a visualização: ${response.statusText}`);
        }
        this.viewContent = await response.text();
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
      const stateRegions = {
        AC: 2, AL: 4, AP: 2, AM: 2, BA: 5, CE: 3, DF: 1, ES: 3,
        GO: 1, MA: 3, MT: 1, MS: 1, MG: 6, PA: 2, PB: 4, PR: 9,
        PE: 4, PI: 3, RJ: 7, RN: 4, RS: 0, RO: 2, RR: 2, SC: 9,
        SP: 8, SE: 5, TO: 1
      };

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
        const digits = [];
        for (let i = 0; i < 8; i += 1) digits.push(Math.floor(Math.random() * 10));
        digits.push(stateSelect.value === 'random'
          ? Math.floor(Math.random() * 10)
          : stateRegions[stateSelect.value]);

        let sum = 0;
        for (let i = 0; i < 9; i += 1) sum += digits[i] * (10 - i);
        let remainder = sum % 11;
        digits.push(remainder < 2 ? 0 : 11 - remainder);

        sum = 0;
        for (let i = 0; i < 10; i += 1) sum += digits[i] * (11 - i);
        remainder = sum % 11;
        digits.push(remainder < 2 ? 0 : 11 - remainder);

        output.value = formatCpf(digits.join(''));
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
      const characterSets = ['ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz', '0123456789', '!@#$%^&*()_+[]{}|;:,.<>?'];
      const levelColors = ['bg-red-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-500'];
      const levelNames = ['Fraca', 'Média', 'Forte', 'Muito forte'];
      const portugueseWords = 'abacate|alegria|amigo|amizade|amora|arco|areia|aviao|banana|bicicleta|borboleta|brisa|caderno|cachorro|caminho|caneca|carinho|castelo|chuva|cidade|coelho|coragem|coruja|cristal|doce|estrela|familia|felicidade|flor|floresta|formiga|futuro|garrafa|girassol|golfinho|harmonia|janela|jardim|laranja|leao|livro|lua|macarrao|manha|melancia|montanha|musica|nuvem|oceano|passeio|peixe|pipoca|planeta|ponte|praia|presente|queijo|raposa|rio|sabor|sapo|segredo|sorriso|tempo|tesouro|tomate|universo|viagem|vento|verao|verde|vitoria'.split('|');

      const randomIndex = max => {
        if (window.crypto?.getRandomValues) {
          const values = new Uint32Array(1);
          window.crypto.getRandomValues(values);
          return values[0] % max;
        }
        return Math.floor(Math.random() * max);
      };
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
        const allCharacters = selectedTypes.join('');
        output.value = Array.from({ length }, () => allCharacters[randomIndex(allCharacters.length)]).join('');
        updateStrength(length, selectedTypes);
        localStorage.setItem(storageKey, JSON.stringify({ length, types: checkboxes.map(checkbox => checkbox.checked) }));
      };
      const generateEasy = () => {
        const count = Math.min(10, Math.max(2, Number.parseInt(easyLength.value, 10) || 4));
        easyLength.value = count;
        const words = Array.from({ length: count }, () => {
          const word = portugueseWords[randomIndex(portugueseWords.length)];
          if (easyComplete.checked) return easyCapitalize.checked ? word.charAt(0).toUpperCase() + word.slice(1) : word;
          const shortWord = word.slice(0, Math.max(3, Math.ceil(word.length * 0.65)));
          return easyCapitalize.checked ? shortWord.charAt(0).toUpperCase() + shortWord.slice(1) : shortWord;
        });
        output.value = words.join('-');
        updateStrength(output.value.length, words.length >= 4 ? ['palavras', 'hífens', 'comprimento'] : ['palavras']);
        localStorage.setItem(storageKey, JSON.stringify({ easyLength: count, capitalize: easyCapitalize.checked, complete: easyComplete.checked, length: lengthInput.value, types: checkboxes.map(checkbox => checkbox.checked) }));
      };
      const generatePin = () => {
        const length = Math.min(32, Math.max(4, Number.parseInt(pinLength.value, 10) || 6));
        pinLength.value = length;
        output.value = Array.from({ length }, () => String(randomIndex(10))).join('');
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

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

document.addEventListener('alpine:init', () => {
  Alpine.data('appState', () => ({
    // Reactive State
    currentTab: 'home',
    theme: localStorage.getItem('theme') || 'dark',
    mobileMenuOpen: false,

    // Dynamic View Loading State
    viewContent: '',
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

    init() {
      // Use the URL hash as a deep link, for example: /#gerador-cpf.
      // This allows a shared/search result link to open the correct tool.
      const hashTab = window.location.hash.slice(1);
      const pathTab = window.location.pathname.replace(/^\/+|\/+$/g, '');
      const initialTab = this.views[pathTab] ? pathTab : hashTab;
      this.currentTab = this.views[initialTab]
        ? initialTab
        : (localStorage.getItem('currentTab') || 'home');

      // Initialize layout theme
      this.applyTheme();

      // Load initial view content
      this.loadView(this.currentTab);

      // Watchers for persistent state storage
      this.$watch('theme', val => {
        localStorage.setItem('theme', val);
        this.applyTheme();
      });

      this.$watch('currentTab', val => {
        localStorage.setItem('currentTab', val);
        this.loadView(val);
      });

      window.addEventListener('hashchange', () => {
        const tabName = window.location.hash.slice(1);
        if (this.views[tabName] && tabName !== this.currentTab) {
          this.currentTab = tabName;
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
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

    /**
     * Set dynamic tab and close mobile drawer
     */
    selectTab(tabName) {
      if (this.views[tabName]) {
        this.currentTab = tabName;
        if (window.location.hash !== `#${tabName}`) {
          window.location.hash = tabName;
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
      const url = this.views[tabName];
      if (!url) return;

      this.isLoading = true;
      this.corsFallback = false;

      try {
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
        if (['gerador-cnpj', 'gerador-cns', 'gerador-pis', 'gerador-rg'].includes(tabName)) {
          this.$nextTick(() => {
            window.setTimeout(() => this.initMaskedGenerator(tabName), 0);
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
        'gerador-cnpj': { checkbox: 'cnpj-with-punctuation', output: 'cnpj-generated', thumb: 'cnpj-switch-thumb', storage: 'faytor.cnpj.preferences', clean: value => value.replace(/\D/g, ''), format: raw => raw.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') },
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
    }
  }));
});

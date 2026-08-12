/**
 * Faytor SPA - Modular Application State Management & View Routing
 */

document.addEventListener('alpine:init', () => {
  Alpine.data('appState', () => ({
    // Reactive State
    currentTab: localStorage.getItem('currentTab') || 'home',
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
      'gerador-pis': 'views/gerador-pis.html'
    },

    init() {
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
          this.$nextTick(() => this.initCpfGenerator());
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
      const copyButton = document.getElementById('cpf-copy');
      const switchThumb = document.getElementById('cpf-switch-thumb');

      if (!checkbox || !stateSelect || !output || !generateButton || !copyButton || !switchThumb) return;
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
        copyButton.classList.remove('bg-emerald-500', 'border-emerald-500', 'text-white');
        copyButton.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
        document.getElementById('cpf-copy-label').textContent = 'Copiar';
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
      copyButton.addEventListener('click', async () => {
        if (!output.value) return;
        await navigator.clipboard.writeText(output.value);
        copyButton.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
        copyButton.classList.add('bg-emerald-500', 'border-emerald-500', 'text-white');
        document.getElementById('cpf-copy-label').textContent = 'Copiado!';
        window.setTimeout(() => {
          copyButton.classList.remove('bg-emerald-500', 'border-emerald-500', 'text-white');
          copyButton.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
          document.getElementById('cpf-copy-label').textContent = 'Copiar';
        }, 2000);
      });

      checkbox.dataset.initialized = 'true';
      generate();
    }
  }));
});

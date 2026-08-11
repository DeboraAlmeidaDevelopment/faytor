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
      base64: 'views/base64.html'
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

        // Scroll to the main content top smoothly
        const mainContent = document.getElementById('main-content-area');
        if (mainContent) {
          mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
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
        const html = await response.text();
        this.viewContent = html;
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
    }
  }));
});

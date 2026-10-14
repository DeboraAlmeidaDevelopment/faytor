/**
 * Gerador de JSON: um modelo com variáveis {{nome}} é preenchido pelos geradores
 * registrados em window.faytorVariableTypes (js/geradores.js).
 */
(() => {
  // Nome de variável: letras, números, espaço, ponto, hífen e sublinhado, sem espaço nas pontas.
  const NAME = '[\\p{L}\\p{N}_.\\-](?:[\\p{L}\\p{N}_. \\-]{0,38}[\\p{L}\\p{N}_.\\-])?';
  const VARIABLE = `\\{\\{\\s*(${NAME})\\s*\\}\\}`;
  const allVariables = new RegExp(VARIABLE, 'gu');
  const variableAt = new RegExp(VARIABLE, 'uy');
  const validName = new RegExp(`^${NAME}$`, 'u');
  const STORAGE_TEMPLATE = 'faytor.json.template';
  const STORAGE_VARIABLES = 'faytor.json.variables';
  const STORAGE_INDENT = 'faytor.json.indent';
  const MAX_BATCH = 1000;

  const DEFAULT_TEMPLATE = `{
  "cliente": {
    "nome": {{nome}},
    "cpf": {{cpf}},
    "email": {{email}},
    "celular": {{celular}}
  },
  "empresa": {
    "cnpj": {{cnpj}},
    "responsavel": {{nome}}
  },
  "observacao": "Cadastro de teste de {{nome}}"
}`;

  const storage = {
    get(key) {
      try { return localStorage.getItem(key); } catch { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); } catch { /* armazenamento indisponível */ }
    }
  };

  const escapeHtml = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const plain = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  // Percorre o modelo trocando cada variável e informa se ela está dentro de uma string JSON.
  const replaceVariables = (template, replace) => {
    let output = '';
    let inString = false;
    let escaped = false;
    for (let index = 0; index < template.length;) {
      if (template.startsWith('{{', index)) {
        variableAt.lastIndex = index;
        const match = variableAt.exec(template);
        if (match) {
          output += replace(match[1], inString);
          index = variableAt.lastIndex;
          continue;
        }
      }
      const char = template[index];
      if (inString) {
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === '"') inString = false;
      } else if (char === '"') {
        inString = true;
      }
      output += char;
      index += 1;
    }
    return output;
  };

  const isInsideString = (template, position) => {
    let inside = false;
    replaceVariables(template.slice(0, position) + '{{x}}', (_name, inString) => { inside = inString; return ''; });
    return inside;
  };

  // Fora de strings, o valor recebe as aspas escolhidas. Dentro de um texto entre aspas,
  // o valor entra sem aspas extras e com escape, para manter o JSON válido.
  const quoteValue = (value, quote, inString) => {
    if (inString) return JSON.stringify(value).slice(1, -1);
    if (quote === 'double') return JSON.stringify(value);
    if (quote === 'single') return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
    return value;
  };

  const typeHints = [
    ['cnpj', /cnpj/],
    ['cpf', /cpf/],
    ['cns', /(^|[^a-z])cns([^a-z]|$)|cartao.?sus/],
    ['pis', /(^|[^a-z])(pis|pasep|nis|nit)([^a-z]|$)/],
    ['rg', /(^|[^a-z])rg([^a-z]|$)|identidade/],
    ['email', /e-?mail/],
    ['celular', /celular|telefone|fone|whats/],
    ['senha', /senha|password/],
    ['nome', /nome|name/]
  ];
  const guessType = name => typeHints.find(([, pattern]) => pattern.test(plain(name)))?.[0] || '';

  const defaultOptions = type => Object.fromEntries((window.faytorVariableTypes[type]?.options || []).map(option => [option.key, option.default]));

  const readJson = (key, fallback) => {
    try { return JSON.parse(storage.get(key)) || fallback; } catch { return fallback; }
  };

  const createConfig = (type, quote) => ({ type, quote, options: defaultOptions(type) });

  // Configura as variáveis do modelo salvo antes da primeira renderização da lista.
  const initialState = () => {
    const template = storage.get(STORAGE_TEMPLATE) ?? DEFAULT_TEMPLATE;
    const configs = readJson(STORAGE_VARIABLES, {});
    for (const match of template.matchAll(allVariables)) {
      if (!configs[match[1]]) configs[match[1]] = createConfig(guessType(match[1]), 'double');
    }
    return { template, configs };
  };

  document.addEventListener('alpine:init', () => {
    Alpine.data('jsonGenerator', () => ({
      ...initialState(),
      indentStyle: ['2', '4', 'min'].includes(storage.get(STORAGE_INDENT)) ? storage.get(STORAGE_INDENT) : '2',
      tabReleased: false,
      types: Object.entries(window.faytorVariableTypes)
        .map(([key, type]) => ({ key, label: type.label }))
        .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')),
      formatMessage: '',
      formatOk: false,
      output: '',
      outputError: '',
      outputValid: null,
      copied: false,
      adding: false,
      newName: '',
      newType: '',
      newQuote: 'double',
      addError: '',
      selection: { start: 0, end: 0 },
      batchQuantity: 10,
      batchFormat: 'json',
      batchItems: [],
      batchParsed: null,
      batchError: '',
      batchCopied: false,

      init() {
        this.$watch('template', value => {
          this.syncConfigs();
          storage.set(STORAGE_TEMPLATE, value);
          this.formatMessage = '';
        });
        this.$watch('configs', value => storage.set(STORAGE_VARIABLES, JSON.stringify(value)), { deep: true });
        // A view é inserida pelo x-html da SPA dentro de um efeito reativo. Ler o estado aqui,
        // de forma síncrona, registraria o modelo como dependência desse efeito e cada edição
        // recriaria a página inteira. Por isso a primeira geração roda depois da inicialização.
        queueMicrotask(() => {
          this.syncConfigs();
          this.generate();
        });
      },

      get variables() {
        const counts = new Map();
        for (const match of this.template.matchAll(allVariables)) counts.set(match[1], (counts.get(match[1]) || 0) + 1);
        return [...counts].map(([name, count]) => ({ name, count }));
      },

      // HTML do fundo destacado; acompanha o textarea caractere por caractere.
      get highlighted() {
        let html = '';
        let last = 0;
        for (const match of this.template.matchAll(allVariables)) {
          html += escapeHtml(this.template.slice(last, match.index));
          html += `<mark class="json-variable">${escapeHtml(match[0])}</mark>`;
          last = match.index + match[0].length;
        }
        // A quebra final garante a mesma altura do textarea quando o texto termina em nova linha.
        return `${html}${escapeHtml(this.template.slice(last))}\n`;
      },

      syncConfigs() {
        for (const { name } of this.variables) {
          if (!this.configs[name]) this.configs[name] = this.newConfig(guessType(name), 'double');
        }
      },

      newConfig(type, quote) {
        return createConfig(type, quote);
      },

      setType(name, type) {
        this.configs[name].type = type;
        this.configs[name].options = { ...defaultOptions(type), ...this.configs[name].options };
      },

      visibleOptions(name) {
        const config = this.configs[name];
        const type = window.faytorVariableTypes[config?.type];
        if (!type) return [];
        return type.options.filter(option => !option.when || option.when(config.options));
      },

      typePage(name) {
        return window.faytorVariableTypes[this.configs[name]?.type]?.page || '';
      },

      syncScroll(event) {
        this.$refs.highlight.scrollTop = event.target.scrollTop;
        this.$refs.highlight.scrollLeft = event.target.scrollLeft;
      },

      // Unidade inserida pelo Tab; no modo minificado, o Tab usa 2 espaços.
      get indentUnit() {
        return this.indentStyle === '4' ? '    ' : '  ';
      },

      changeIndent(style) {
        this.indentStyle = style;
        storage.set(STORAGE_INDENT, style);
        this.formatTemplate();
      },

      // Substitui um trecho preservando o histórico de desfazer (Ctrl+Z) quando o navegador permite.
      replaceRange(start, end, text) {
        const editor = this.$refs.editor;
        editor.focus();
        editor.setSelectionRange(start, end);
        if (!document.execCommand?.('insertText', false, text)) {
          editor.setRangeText(text, start, end, 'end');
          editor.dispatchEvent(new Event('input', { bubbles: true }));
        }
      },

      // Tab indenta e Shift+Tab desindenta. Esc libera o próximo Tab para sair do editor,
      // evitando prender o foco de quem navega só pelo teclado.
      onEditorKeydown(event) {
        if (event.key === 'Escape') {
          this.tabReleased = true;
          return;
        }
        if (event.key !== 'Tab' || event.ctrlKey || event.altKey || event.metaKey || this.tabReleased) {
          this.tabReleased = false;
          return;
        }
        event.preventDefault();
        const editor = this.$refs.editor;
        const { value, selectionStart: start, selectionEnd: end } = editor;
        const unit = this.indentUnit;
        if (!event.shiftKey && start === end) {
          this.replaceRange(start, end, unit);
          return;
        }
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        // Uma seleção que termina no início de uma linha não inclui essa linha.
        const lastChar = end > start && value[end - 1] === '\n' ? end - 1 : end;
        const lineEnd = value.indexOf('\n', lastChar);
        const stop = lineEnd === -1 ? value.length : lineEnd;
        const outdent = new RegExp(`^(\\t| {1,${unit.length}})`);
        let firstDelta = 0;
        let totalDelta = 0;
        const lines = value.slice(lineStart, stop).split('\n').map((line, index) => {
          if (event.shiftKey) {
            const removed = outdent.exec(line)?.[0].length || 0;
            if (index === 0) firstDelta = -removed;
            totalDelta -= removed;
            return line.slice(removed);
          }
          if (index === 0) firstDelta = unit.length;
          totalDelta += unit.length;
          return unit + line;
        });
        this.replaceRange(lineStart, stop, lines.join('\n'));
        const newStart = Math.max(lineStart, start + firstDelta);
        editor.setSelectionRange(newStart, start === end ? newStart : end + totalDelta);
      },

      formatTemplate() {
        const tokens = [];
        const prepared = replaceVariables(this.template, (name, inString) => {
          const token = `__faytor_${tokens.length}__`;
          tokens.push({ token: inString ? token : `"${token}"`, name });
          return inString ? token : `"${token}"`;
        });
        try {
          const spaces = { 2: 2, 4: 4, min: 0 }[this.indentStyle] ?? 2;
          let formatted = JSON.stringify(JSON.parse(prepared), null, spaces);
          for (const { token, name } of tokens) formatted = formatted.replace(token, `{{${name}}}`);
          this.template = formatted;
          this.$nextTick(() => {
            this.formatMessage = this.indentStyle === 'min' ? 'JSON minificado.' : 'JSON formatado.';
            this.formatOk = true;
          });
        } catch (error) {
          const line = /line (\d+)/.exec(error.message)?.[1];
          this.formatMessage = line
            ? `Não foi possível formatar: o JSON tem um erro perto da linha ${line}.`
            : 'Não foi possível formatar: confira vírgulas, chaves e aspas do modelo.';
          this.formatOk = false;
        }
      },

      openAdd() {
        const editor = this.$refs.editor;
        const start = editor.selectionStart ?? this.template.length;
        const end = editor.selectionEnd ?? start;
        this.selection = { start, end };
        const selected = this.template.slice(start, end);
        const key = /"([^"\n]+)"\s*:\s*$/.exec(this.template.slice(0, start).split('\n').pop())?.[1];
        // Sugere o nome da chave à esquerda do cursor (ex.: "cpf": → cpf), sem repetir variáveis existentes.
        const used = new Set(this.variables.map(variable => variable.name));
        const base = key && validName.test(key) ? key : 'variavel';
        let suggestion = base === 'variavel' ? 'variavel 1' : base;
        for (let counter = 2; used.has(suggestion); counter += 1) suggestion = `${base} ${counter}`;
        this.newName = suggestion;
        this.newType = guessType(suggestion);
        // Um valor selecionado com as próprias aspas vira variável fora de string.
        const quotedSelection = /^\s*".*"\s*$/s.test(selected);
        this.newQuote = !quotedSelection && isInsideString(this.template, start) ? 'none' : 'double';
        this.addError = '';
        this.adding = true;
        this.$nextTick(() => this.$refs.newName.select());
      },

      cancelAdd() {
        this.adding = false;
        this.$nextTick(() => this.$refs.editor.focus());
      },

      confirmAdd() {
        const name = this.newName.trim();
        if (!validName.test(name)) {
          this.addError = 'Use de 1 a 40 caracteres: letras, números, espaço, ponto, hífen ou sublinhado.';
          return;
        }
        if (!this.configs[name] || !this.variables.some(variable => variable.name === name)) {
          this.configs[name] = this.newConfig(this.newType, this.newQuote);
        }
        const placeholder = `{{${name}}}`;
        const { start, end } = this.selection;
        this.template = `${this.template.slice(0, start)}${placeholder}${this.template.slice(end)}`;
        this.adding = false;
        this.$nextTick(() => {
          const editor = this.$refs.editor;
          editor.focus();
          editor.setSelectionRange(start + placeholder.length, start + placeholder.length);
        });
      },

      isExistingName(name) {
        return this.variables.some(variable => variable.name === name.trim());
      },

      // Gera os valores uma vez por JSON: a mesma variável repete o mesmo valor em todos os lugares.
      renderOnce() {
        const missing = this.variables.filter(({ name }) => !this.configs[name]?.type).map(({ name }) => `"${name}"`);
        if (missing.length) throw new Error(`Escolha o tipo ${missing.length === 1 ? 'da variável' : 'das variáveis'} ${missing.join(', ')}.`);
        const values = {};
        for (const { name } of this.variables) {
          const config = this.configs[name];
          try {
            values[name] = window.faytorVariableTypes[config.type].generate(config.options);
          } catch (error) {
            throw new Error(`Não foi possível gerar "${name}": ${error.message}.`);
          }
        }
        return replaceVariables(this.template, (name, inString) => quoteValue(values[name], this.configs[name].quote, inString));
      },

      generate() {
        try {
          this.output = this.renderOnce();
          this.outputError = '';
          try {
            JSON.parse(this.output);
            this.outputValid = true;
          } catch {
            this.outputValid = false;
          }
        } catch (error) {
          this.output = '';
          this.outputError = error.message;
          this.outputValid = null;
        }
        this.copied = false;
      },

      async copy() {
        if (!this.output || !navigator.clipboard) return;
        await navigator.clipboard.writeText(this.output);
        this.copied = true;
        setTimeout(() => { this.copied = false; }, 2000);
      },

      async generateAndCopy() {
        this.generate();
        await this.copy();
      },

      get batchOutput() {
        if (this.batchFormat === 'txt') return this.batchItems.join('\n\n');
        if (!this.batchParsed) return '';
        if (this.batchFormat === 'jsonl') return this.batchParsed.map(item => JSON.stringify(item)).join('\n');
        return JSON.stringify(this.batchParsed, null, 2);
      },

      get batchNeedsValidJson() {
        return this.batchItems.length > 0 && this.batchFormat !== 'txt' && !this.batchParsed;
      },

      generateBatch() {
        const quantity = Math.min(MAX_BATCH, Math.max(1, Number.parseInt(this.batchQuantity, 10) || 1));
        this.batchQuantity = quantity;
        try {
          this.batchItems = Array.from({ length: quantity }, () => this.renderOnce());
          this.batchError = '';
        } catch (error) {
          this.batchItems = [];
          this.batchError = error.message;
        }
        try {
          this.batchParsed = this.batchItems.map(item => JSON.parse(item));
        } catch {
          this.batchParsed = null;
        }
        this.batchCopied = false;
      },

      async copyBatch() {
        if (!this.batchOutput || !navigator.clipboard) return;
        await navigator.clipboard.writeText(this.batchOutput);
        this.batchCopied = true;
        setTimeout(() => { this.batchCopied = false; }, 2000);
      },

      async generateBatchAndCopy() {
        this.generateBatch();
        await this.copyBatch();
      },

      downloadBatch() {
        if (!this.batchOutput) return;
        const mimes = { json: 'application/json', jsonl: 'application/x-ndjson', txt: 'text/plain' };
        window.faytorExport.download(this.batchOutput, `json-teste-${this.batchItems.length}.${this.batchFormat}`, mimes[this.batchFormat]);
      }
    }));
  });
})();

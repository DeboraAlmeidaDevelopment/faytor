/**
 * Regras de documentos brasileiros e componentes de lote compartilhados pelos
 * geradores e validadores. Cada validação devolve também os passos do cálculo,
 * exibidos na tela para explicar por que um número foi aceito ou recusado.
 */
(() => {
  const randomDigits = length => Array.from({ length }, () => Math.floor(Math.random() * 10));
  const weightedSum = (values, weights) => values.reduce((total, value, index) => total + value * weights[index], 0);
  const describeSum = (labels, values, weights) => labels.map((label, index) => `${label}×${weights[index]}`).join(' + ');
  const isRepeated = raw => /^(.)\1+$/.test(raw);

  // Regra usada por CPF e CNPJ: resto menor que 2 vira 0; nos demais casos, 11 − resto.
  const mod11Digit = sum => {
    const remainder = sum % 11;
    return { remainder, digit: remainder < 2 ? 0 : 11 - remainder };
  };
  const mod11Explanation = (sum, remainder, digit) => remainder < 2
    ? `${sum} ÷ 11 deixa resto ${remainder}. Como o resto é menor que 2, o dígito é 0.`
    : `${sum} ÷ 11 deixa resto ${remainder}. 11 − ${remainder} = ${digit}.`;
  const checkStep = (title, detail, expected, informed) => ({
    title,
    detail: `${detail} Esperado: ${expected}. Informado: ${informed}.`,
    ok: String(expected) === String(informed)
  });

  const cpfRegions = {
    0: 'RS', 1: 'DF, GO, MS, MT e TO', 2: 'AC, AM, AP, PA, RO e RR', 3: 'CE, MA e PI', 4: 'AL, PB, PE e RN',
    5: 'BA e SE', 6: 'MG', 7: 'ES e RJ', 8: 'SP', 9: 'PR e SC'
  };
  const cpfStateRegions = {
    AC: 2, AL: 4, AP: 2, AM: 2, BA: 5, CE: 3, DF: 1, ES: 3, GO: 1, MA: 3, MT: 1, MS: 1, MG: 6, PA: 2,
    PB: 4, PR: 9, PE: 4, PI: 3, RJ: 7, RN: 4, RS: 0, RO: 2, RR: 2, SC: 9, SP: 8, SE: 5, TO: 1
  };

  const cpf = {
    name: 'CPF',
    stateRegions: cpfStateRegions,
    clean: value => String(value || '').replace(/\D/g, ''),
    format: raw => raw.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4'),
    checkDigits(base) {
      const digits = base.split('').map(Number);
      const first = mod11Digit(weightedSum(digits, [10, 9, 8, 7, 6, 5, 4, 3, 2])).digit;
      const second = mod11Digit(weightedSum([...digits, first], [11, 10, 9, 8, 7, 6, 5, 4, 3, 2])).digit;
      return `${first}${second}`;
    },
    generate({ state = 'random' } = {}) {
      const digits = randomDigits(8);
      digits.push(cpfStateRegions[state] ?? Math.floor(Math.random() * 10));
      const base = digits.join('');
      return `${base}${this.checkDigits(base)}`;
    },
    validate(value) {
      const raw = this.clean(value);
      if (!raw) return null;
      if (raw.length !== 11) return { raw, valid: false, error: 'Um CPF deve possuir exatamente 11 dígitos numéricos.', steps: [] };
      if (isRepeated(raw)) {
        return {
          raw, valid: false, error: 'CPFs com todos os dígitos iguais são inválidos.',
          steps: [{ title: 'Sequência repetida', detail: 'Números como 111.111.111-11 até passam no cálculo dos dígitos, mas são recusados pelos sistemas por não corresponderem a inscrições reais.', ok: false }]
        };
      }
      const digits = raw.split('').map(Number);
      const firstWeights = [10, 9, 8, 7, 6, 5, 4, 3, 2];
      const secondWeights = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
      const sum1 = weightedSum(digits.slice(0, 9), firstWeights);
      const dv1 = mod11Digit(sum1);
      const sum2 = weightedSum(digits.slice(0, 10), secondWeights);
      const dv2 = mod11Digit(sum2);
      const steps = [
        { title: 'Base e região fiscal', detail: `Os 9 primeiros dígitos (${raw.slice(0, 9)}) formam a base. O 9º dígito, ${raw[8]}, indica a região fiscal de inscrição: ${cpfRegions[raw[8]]}.` },
        checkStep('1º dígito verificador', `${describeSum(raw.slice(0, 9).split(''), digits, firstWeights)} = ${sum1}. ${mod11Explanation(sum1, dv1.remainder, dv1.digit)}`, dv1.digit, raw[9]),
        checkStep('2º dígito verificador', `${describeSum(raw.slice(0, 10).split(''), digits, secondWeights)} = ${sum2}. ${mod11Explanation(sum2, dv2.remainder, dv2.digit)}`, dv2.digit, raw[10])
      ];
      const error = !steps[1].ok ? 'Primeiro dígito verificador inválido.' : (!steps[2].ok ? 'Segundo dígito verificador inválido.' : '');
      return { raw, valid: !error, error, formatted: this.format(raw), steps };
    }
  };

  const cnpjChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const cnpjValue = char => char >= '0' && char <= '9' ? Number(char) : char.charCodeAt(0) - 48;
  const cnpjLabel = char => char >= '0' && char <= '9' ? char : `${char}(${cnpjValue(char)})`;
  const cnpjFirstWeights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const cnpjSecondWeights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const cnpj = {
    name: 'CNPJ',
    clean: value => String(value || '').replace(/[^a-z0-9]/gi, '').toUpperCase(),
    format: raw => raw.replace(/^([A-Z0-9]{2})([A-Z0-9]{3})([A-Z0-9]{3})([A-Z0-9]{4})(\d{2})$/, '$1.$2.$3/$4-$5'),
    checkDigits(base) {
      const values = base.split('').map(cnpjValue);
      const first = mod11Digit(weightedSum(values, cnpjFirstWeights)).digit;
      const second = mod11Digit(weightedSum([...values, first], cnpjSecondWeights)).digit;
      return `${first}${second}`;
    },
    generate({ format = 'numeric' } = {}) {
      const base = format === 'alphanumeric'
        ? Array.from({ length: 12 }, () => cnpjChars[Math.floor(Math.random() * cnpjChars.length)]).join('')
        : `${randomDigits(8).join('')}0001`;
      return `${base}${this.checkDigits(base)}`;
    },
    validate(value) {
      const raw = this.clean(value);
      if (!raw) return null;
      if (raw.length !== 14) return { raw, valid: false, error: 'Um CNPJ deve possuir exatamente 14 posições.', steps: [] };
      if (!/^[A-Z0-9]{12}\d{2}$/.test(raw)) {
        return { raw, valid: false, error: 'Formato inválido: as 12 primeiras posições aceitam letras ou números e os 2 dígitos finais devem ser numéricos.', steps: [] };
      }
      if (isRepeated(raw)) {
        return {
          raw, valid: false, error: 'CNPJs com todas as posições iguais são inválidos.',
          steps: [{ title: 'Sequência repetida', detail: 'Sequências como 00.000.000/0000-00 são recusadas antes do cálculo por não corresponderem a inscrições reais.', ok: false }]
        };
      }
      const chars = raw.split('');
      const values = chars.map(cnpjValue);
      const sum1 = weightedSum(values.slice(0, 12), cnpjFirstWeights);
      const dv1 = mod11Digit(sum1);
      const sum2 = weightedSum(values.slice(0, 13), cnpjSecondWeights);
      const dv2 = mod11Digit(sum2);
      const hasLetters = /[A-Z]/.test(raw.slice(0, 12));
      const steps = [
        {
          title: 'Raiz, ordem e tipo',
          detail: `Raiz ${raw.slice(0, 8)} identifica a empresa; ordem ${raw.slice(8, 12)} identifica o estabelecimento (${raw.slice(8, 12) === '0001' ? '0001 costuma ser a matriz' : 'valores diferentes de 0001 costumam indicar filiais'}). ${hasLetters ? 'Há letras na base: cada uma vale o código ASCII menos 48 (A = 17, B = 18 … Z = 42).' : 'A base é totalmente numérica.'}`
        },
        checkStep('1º dígito verificador', `${describeSum(chars.slice(0, 12).map(cnpjLabel), values, cnpjFirstWeights)} = ${sum1}. ${mod11Explanation(sum1, dv1.remainder, dv1.digit)}`, dv1.digit, raw[12]),
        checkStep('2º dígito verificador', `${describeSum(chars.slice(0, 13).map(cnpjLabel), values, cnpjSecondWeights)} = ${sum2}. ${mod11Explanation(sum2, dv2.remainder, dv2.digit)}`, dv2.digit, raw[13])
      ];
      const error = !steps[1].ok ? 'Primeiro dígito verificador inválido.' : (!steps[2].ok ? 'Segundo dígito verificador inválido.' : '');
      return { raw, valid: !error, error, formatted: this.format(raw), steps };
    }
  };

  const cnsWeights = [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
  const cns = {
    name: 'CNS',
    clean: value => String(value || '').replace(/\D/g, ''),
    format: raw => raw.replace(/^(\d{3})(\d{4})(\d{4})(\d{4})$/, '$1 $2 $3 $4'),
    generate() {
      // Cartão definitivo: 11 dígitos de base iniciados em 1 ou 2, sufixo 000 ou 001 e dígito final.
      const digits = [Math.random() < 0.5 ? 1 : 2, ...randomDigits(10)];
      const sum = weightedSum(digits, cnsWeights.slice(0, 11));
      let dv = 11 - (sum % 11);
      if (dv === 11) dv = 0;
      if (dv === 10) return `${digits.join('')}001${11 - ((sum + 2) % 11)}`;
      return `${digits.join('')}000${dv}`;
    },
    validate(value) {
      const raw = this.clean(value);
      if (!raw) return null;
      if (raw.length !== 15) return { raw, valid: false, error: 'O CNS (Cartão Nacional de Saúde) deve possuir exatamente 15 dígitos numéricos.', steps: [] };
      const type = ['1', '2'].includes(raw[0]) ? 'definitivo' : (['7', '8', '9'].includes(raw[0]) ? 'provisório' : '');
      if (!type) {
        return {
          raw, valid: false, error: 'Um CNS válido deve começar com os dígitos 1, 2, 7, 8 ou 9.',
          steps: [{ title: 'Primeiro dígito', detail: `O número começa com ${raw[0]}. Cartões definitivos começam com 1 ou 2; provisórios, com 7, 8 ou 9.`, ok: false }]
        };
      }
      const digits = raw.split('').map(Number);
      const sum = weightedSum(digits, cnsWeights);
      const remainder = sum % 11;
      const steps = [
        { title: 'Tipo de cartão', detail: `Começa com ${raw[0]}: cartão ${type}.${type === 'definitivo' ? ` Nos definitivos, as posições 12 a 14 (${raw.slice(11, 14)}) costumam ser 000, ou 001 quando o cálculo do dígito precisou de ajuste.` : ''}` },
        { title: 'Soma ponderada', detail: `${describeSum(raw.split(''), digits, cnsWeights)} = ${sum}. ${sum} ÷ 11 deixa resto ${remainder}. Para ser válido, o resto deve ser 0.`, ok: remainder === 0 }
      ];
      const error = remainder === 0 ? '' : `A soma ponderada dos 15 dígitos não é múltipla de 11 (cartão ${type}).`;
      return { raw, valid: !error, error, formatted: this.format(raw), steps };
    }
  };

  const pisWeights = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pisDigit = sum => {
    const remainder = sum % 11;
    const digit = 11 - remainder;
    return { remainder, digit: digit >= 10 ? 0 : digit };
  };
  const pis = {
    name: 'PIS/PASEP',
    clean: value => String(value || '').replace(/\D/g, ''),
    format: raw => raw.replace(/^(\d{3})(\d{5})(\d{2})(\d)$/, '$1.$2.$3-$4'),
    generate() {
      const digits = randomDigits(10);
      return `${digits.join('')}${pisDigit(weightedSum(digits, pisWeights)).digit}`;
    },
    validate(value) {
      const raw = this.clean(value);
      if (!raw) return null;
      if (raw.length !== 11) return { raw, valid: false, error: 'O PIS/PASEP deve possuir exatamente 11 dígitos numéricos.', steps: [] };
      if (isRepeated(raw)) {
        return {
          raw, valid: false, error: 'PIS/PASEP com todos os dígitos iguais são inválidos.',
          steps: [{ title: 'Sequência repetida', detail: 'Sequências com todos os dígitos iguais são recusadas antes do cálculo.', ok: false }]
        };
      }
      const digits = raw.split('').map(Number);
      const sum = weightedSum(digits.slice(0, 10), pisWeights);
      const { remainder, digit } = pisDigit(sum);
      const rule = 11 - remainder >= 10
        ? `11 − ${remainder} = ${11 - remainder}; resultados 10 e 11 viram 0.`
        : `11 − ${remainder} = ${digit}.`;
      const steps = [
        { title: 'Base', detail: `Os 10 primeiros dígitos (${raw.slice(0, 10)}) formam a base; o 11º é o dígito verificador.` },
        checkStep('Dígito verificador', `${describeSum(raw.slice(0, 10).split(''), digits, pisWeights)} = ${sum}. ${sum} ÷ 11 deixa resto ${remainder}. ${rule}`, digit, raw[10])
      ];
      const error = steps[1].ok ? '' : 'Dígito verificador do PIS inválido.';
      return { raw, valid: !error, error, formatted: this.format(raw), steps };
    }
  };

  // RG da SSP-SP: pesos 2 a 9; dígito = 11 − resto, com 10 → X e 11 → 0.
  const rgWeights = [2, 3, 4, 5, 6, 7, 8, 9];
  const rgDigit = sum => {
    const remainder = sum % 11;
    const value = 11 - remainder;
    return { remainder, value, digit: value === 11 ? '0' : (value === 10 ? 'X' : String(value)) };
  };
  const rg = {
    name: 'RG',
    clean: value => String(value || '').toUpperCase().replace(/[^0-9X]/g, ''),
    format: raw => raw.replace(/^(\d{2})(\d{3})(\d{3})([\dX])$/, '$1.$2.$3-$4'),
    generate() {
      const digits = randomDigits(8);
      return `${digits.join('')}${rgDigit(weightedSum(digits, rgWeights)).digit}`;
    },
    validate(value) {
      const raw = this.clean(value);
      if (!raw) return null;
      if (raw.length !== 9) return { raw, valid: false, error: 'Um RG do Estado de São Paulo (SSP-SP) deve possuir exatamente 9 dígitos (sendo o último dígito opcionalmente X).', steps: [] };
      if (!/^\d{8}[\dX]$/.test(raw)) return { raw, valid: false, error: 'A letra X só pode aparecer na última posição, como dígito verificador.', steps: [] };
      const digits = raw.slice(0, 8).split('').map(Number);
      const sum = weightedSum(digits, rgWeights);
      const { remainder, value: result, digit } = rgDigit(sum);
      const rule = result === 11 ? `11 − ${remainder} = 11, que vira 0.` : (result === 10 ? `11 − ${remainder} = 10, representado pela letra X.` : `11 − ${remainder} = ${result}.`);
      const steps = [
        { title: 'Base', detail: `Os 8 primeiros dígitos (${raw.slice(0, 8)}) formam o número de registro; a 9ª posição é o dígito verificador.` },
        checkStep('Dígito verificador (padrão SSP-SP)', `${describeSum(raw.slice(0, 8).split(''), digits, rgWeights)} = ${sum}. ${sum} ÷ 11 deixa resto ${remainder}. ${rule}`, digit, raw[8])
      ];
      const error = steps[1].ok ? '' : 'O dígito verificador final está incorreto para o padrão SP.';
      return { raw, valid: !error, error, formatted: this.format(raw), steps };
    }
  };

  window.faytorDocuments = { cpf, cnpj, cns, pis, rg };

  // Opções do gerador individual reaproveitadas pela geração em lote.
  const generatorOptions = type => {
    const punctuation = document.getElementById(`${type}-with-punctuation`);
    return {
      withPunctuation: punctuation ? punctuation.checked : true,
      state: document.getElementById('cpf-state')?.value || 'random',
      format: window.cnpjGenerator?.format || 'numeric'
    };
  };

  const csvCell = value => /[",;\n]/.test(value) ? `"${String(value).replace(/"/g, '""')}"` : String(value);
  const download = (content, filename, mime) => {
    const url = URL.createObjectURL(new Blob([content], { type: `${mime};charset=utf-8` }));
    const link = Object.assign(document.createElement('a'), { href: url, download: filename });
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };
  const exportMimes = { txt: 'text/plain', csv: 'text/csv', json: 'application/json' };

  // Utilitários de exportação compartilhados com telas que não usam Alpine (gerador de endereço).
  window.faytorExport = { csvCell, download, mimes: exportMimes };

  // Fontes de geração em lote registradas por outras telas, como o gerador de senhas.
  window.faytorBatchSources = window.faytorBatchSources || {};

  document.addEventListener('alpine:init', () => {
    /**
     * Geração em lote reaproveitando as opções do gerador individual.
     * config.type: documento de faytorDocuments ou fonte de faytorBatchSources.
     * config.method: método da tela que devolve um item (ex.: buildName), usado no lugar da fonte.
     * config.column: cabeçalho do CSV; config.file: prefixo do arquivo baixado.
     */
    Alpine.data('batchGenerator', config => ({
      quantity: 10,
      exportFormat: 'txt',
      items: [],
      copied: false,
      error: '',
      maxQuantity: 1000,

      get output() {
        if (this.exportFormat === 'csv') return [config.column || config.type, ...this.items.map(csvCell)].join('\n');
        if (this.exportFormat === 'json') return JSON.stringify(this.items, null, 2);
        return this.items.join('\n');
      },

      producer() {
        if (config.method) return () => this[config.method]();
        if (window.faytorBatchSources[config.type]) return window.faytorBatchSources[config.type];
        const documentRule = window.faytorDocuments[config.type];
        const options = generatorOptions(config.type);
        return () => {
          const raw = documentRule.generate(options);
          return options.withPunctuation ? documentRule.format(raw) : raw;
        };
      },

      generate() {
        const produce = this.producer();
        const quantity = Math.min(this.maxQuantity, Math.max(1, Number.parseInt(this.quantity, 10) || 1));
        this.quantity = quantity;
        const unique = new Set();
        // Itens repetidos são descartados; o limite de tentativas evita laço infinito
        // quando as opções permitem poucas combinações (ex.: PIN de 4 dígitos).
        for (let attempts = 0; unique.size < quantity && attempts < quantity * 20; attempts += 1) {
          const item = produce();
          if (!item) break;
          unique.add(item);
        }
        this.items = [...unique];
        this.error = this.items.length ? '' : 'Não foi possível gerar com as opções atuais. Revise as opções acima.';
        this.copied = false;
      },

      async copy() {
        if (!this.items.length || !navigator.clipboard) return;
        await navigator.clipboard.writeText(this.output);
        this.copied = true;
        setTimeout(() => { this.copied = false; }, 2000);
      },

      async generateAndCopy() {
        this.generate();
        await this.copy();
      },

      download() {
        if (!this.items.length) return;
        download(this.output, `${config.file || config.type}-teste-${this.items.length}.${this.exportFormat}`, exportMimes[this.exportFormat]);
      }
    }));

    Alpine.data('documentBatchValidator', type => ({
      input: '',
      results: [],
      copied: false,
      maxLines: 1000,
      truncated: false,

      get validCount() { return this.results.filter(result => result.valid).length; },
      get invalidCount() { return this.results.length - this.validCount; },
      get csv() {
        return ['documento;resultado;motivo', ...this.results.map(result => [result.input, result.valid ? 'válido' : 'inválido', result.error].map(csvCell).join(';'))].join('\n');
      },

      init() {
        this.$watch('input', () => this.validate());
      },

      validate() {
        const lines = this.input.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
        this.truncated = lines.length > this.maxLines;
        this.results = lines.slice(0, this.maxLines).map(line => {
          const result = window.faytorDocuments[type].validate(line);
          return { input: line, valid: Boolean(result?.valid), error: result ? result.error : 'Nenhum dígito encontrado.' };
        });
        this.copied = false;
      },

      clear() {
        this.input = '';
      },

      async copy() {
        if (!this.results.length || !navigator.clipboard) return;
        await navigator.clipboard.writeText(this.csv);
        this.copied = true;
        setTimeout(() => { this.copied = false; }, 2000);
      },

      download() {
        if (this.results.length) download(this.csv, `validacao-${type}.csv`, 'text/csv');
      }
    }));
  });
})();

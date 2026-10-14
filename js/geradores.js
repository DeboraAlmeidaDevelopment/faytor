/**
 * Geradores de dados reutilizáveis e registro de tipos de variável do Gerador de JSON.
 *
 * Todo gerador do site deve ser registrado em window.faytorVariableTypes para ficar
 * disponível como variável no Gerador de JSON (/gerador-json/). Cada tipo declara:
 * - label: nome exibido na lista de tipos;
 * - page: rota do gerador individual;
 * - options: opções exibidas ao lado da variável (switch, select ou number);
 * - generate(options): devolve o valor gerado como texto.
 */
(() => {
  const pick = list => list[Math.floor(Math.random() * list.length)];
  // Sorteia `count` itens distintos da lista.
  const sample = (list, count) => {
    const pool = [...list];
    return Array.from({ length: Math.min(count, pool.length) }, () => pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  };
  const plain = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const maleNames = ['Gabriel', 'Lucas', 'Pedro', 'Mateus', 'Guilherme', 'Rafael', 'Felipe', 'Thiago', 'Bruno', 'Rodrigo', 'André', 'Gustavo', 'Leonardo', 'Daniel', 'Marcos', 'Marcelo', 'Fernando', 'Douglas', 'Eduardo', 'Henrique', 'Arthur', 'Bernardo', 'Heitor', 'Davi', 'Samuel', 'Lorenzo', 'Enzo', 'Alexandre', 'Ricardo', 'Caio', 'Murilo', 'Vinícius', 'Vitor', 'Igor', 'Otávio', 'Luiz', 'João', 'Francisco', 'Antônio', 'Carlos'];
  const femaleNames = ['Maria', 'Ana', 'Julia', 'Yasmin', 'Beatriz', 'Mariana', 'Leticia', 'Camila', 'Amanda', 'Larissa', 'Bruna', 'Isabella', 'Luana', 'Carolina', 'Gabriela', 'Vitória', 'Heloisa', 'Alice', 'Sophia', 'Laura', 'Valentina', 'Manuela', 'Helena', 'Giovanna', 'Clara', 'Eduarda', 'Nicole', 'Luiza', 'Fernanda', 'Rebeca', 'Lívia', 'Sarah', 'Lorena', 'Rafaela', 'Melissa', 'Cecília', 'Esther', 'Emanuelly', 'Isadora'];
  const surnames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Rocha', 'Dias', 'Nascimento', 'Moreira', 'Nunes', 'Mendes', 'Vieira', 'Teixeira', 'Cardoso', 'Araújo', 'Melo', 'Cavalcanti', 'Pinto', 'Cabral', 'Campos', 'Figueiredo', 'Andrade', 'Fonseca', 'Barros', 'Miranda', 'Freitas', 'Castro'];
  const emailDomains = ['@gmail.com', '@hotmail.com', '@outlook.com', '@yahoo.com.br', '@bol.com.br', '@uol.com.br', '@terra.com.br', '@ig.com.br', '@proton.me', '@icloud.com'];
  const dddMap = {
    AC: [68], AL: [82], AP: [96], AM: [92, 97], BA: [71, 73, 74, 75, 77], CE: [85, 88], DF: [61], ES: [27, 28],
    GO: [62, 64], MA: [98, 99], MT: [65, 66], MS: [67], MG: [31, 32, 33, 34, 35, 37, 38], PA: [91, 93, 94],
    PB: [83], PR: [41, 42, 43, 44, 45, 46], PE: [81, 87], PI: [86, 89], RJ: [21, 22, 24], RN: [84],
    RS: [51, 53, 54, 55], RO: [69], RR: [95], SC: [47, 48, 49], SP: [11, 12, 13, 14, 15, 16, 17, 18, 19],
    SE: [79], TO: [63]
  };

  const clamp = (value, min, max, fallback) => Math.min(max, Math.max(min, Number.parseInt(value, 10) || fallback));
  const randomDigits = count => Array.from({ length: count }, () => Math.floor(Math.random() * 10)).join('');

  const wordCategories = {
    animais: { label: 'Animais', words: ['cachorro', 'gato', 'cavalo', 'vaca', 'porco', 'ovelha', 'cabra', 'galinha', 'pato', 'coelho', 'leão', 'tigre', 'onça', 'elefante', 'girafa', 'zebra', 'macaco', 'urso', 'lobo', 'raposa', 'capivara', 'tamanduá', 'tatu', 'jacaré', 'tartaruga', 'golfinho', 'baleia', 'tubarão', 'polvo', 'águia', 'coruja', 'papagaio', 'arara', 'tucano', 'beija-flor', 'pinguim', 'sapo', 'cobra', 'borboleta', 'abelha'] },
    comidas: { label: 'Comidas', words: ['arroz', 'feijão', 'feijoada', 'lasanha', 'pizza', 'hambúrguer', 'macarrão', 'churrasco', 'coxinha', 'pastel', 'pão de queijo', 'tapioca', 'cuscuz', 'moqueca', 'acarajé', 'vatapá', 'farofa', 'estrogonofe', 'risoto', 'omelete', 'panqueca', 'sopa', 'salada', 'sanduíche', 'empada', 'quibe', 'esfiha', 'brigadeiro', 'pudim', 'bolo', 'sorvete', 'torta', 'baião de dois', 'escondidinho', 'polenta'] },
    cores: { label: 'Cores', words: ['vermelho', 'azul', 'verde', 'amarelo', 'laranja', 'roxo', 'rosa', 'branco', 'preto', 'cinza', 'marrom', 'bege', 'dourado', 'prateado', 'turquesa', 'lilás', 'violeta', 'magenta', 'ciano', 'vinho', 'bordô', 'salmão', 'creme', 'caramelo', 'anil', 'carmim', 'esmeralda', 'grafite', 'índigo', 'ocre'] },
    esportes: { label: 'Esportes', words: ['futebol', 'vôlei', 'basquete', 'handebol', 'tênis', 'natação', 'atletismo', 'ciclismo', 'surfe', 'skate', 'judô', 'caratê', 'boxe', 'jiu-jítsu', 'capoeira', 'xadrez', 'golfe', 'rúgbi', 'beisebol', 'esgrima', 'remo', 'canoagem', 'ginástica', 'hipismo', 'badminton'] },
    frutas: { label: 'Frutas', words: ['maçã', 'banana', 'laranja', 'uva', 'manga', 'abacaxi', 'mamão', 'melancia', 'melão', 'morango', 'pera', 'pêssego', 'ameixa', 'kiwi', 'limão', 'maracujá', 'goiaba', 'caju', 'acerola', 'jabuticaba', 'açaí', 'cupuaçu', 'graviola', 'pitanga', 'cereja', 'framboesa', 'mirtilo', 'figo', 'coco', 'tangerina', 'carambola', 'caqui', 'lichia', 'romã', 'abacate'] },
    nomes: { label: 'Nomes', words: [...maleNames, ...femaleNames] },
    paises: { label: 'Países', words: ['Brasil', 'Argentina', 'Chile', 'Uruguai', 'Paraguai', 'Bolívia', 'Peru', 'Colômbia', 'Venezuela', 'Equador', 'México', 'Canadá', 'Estados Unidos', 'Cuba', 'Portugal', 'Espanha', 'França', 'Itália', 'Alemanha', 'Reino Unido', 'Irlanda', 'Países Baixos', 'Bélgica', 'Suíça', 'Áustria', 'Suécia', 'Noruega', 'Dinamarca', 'Finlândia', 'Grécia', 'Polônia', 'China', 'Japão', 'Coreia do Sul', 'Índia', 'Austrália', 'Nova Zelândia', 'Egito', 'África do Sul', 'Angola', 'Moçambique', 'Marrocos', 'Nigéria', 'Turquia'] },
    profissoes: { label: 'Profissões', words: ['médico', 'enfermeiro', 'professor', 'engenheiro', 'advogado', 'arquiteto', 'programador', 'designer', 'jornalista', 'contador', 'dentista', 'veterinário', 'farmacêutico', 'psicólogo', 'motorista', 'cozinheiro', 'padeiro', 'eletricista', 'encanador', 'pedreiro', 'carpinteiro', 'bombeiro', 'policial', 'piloto', 'garçom', 'vendedor', 'fotógrafo', 'músico', 'ator', 'agricultor', 'mecânico', 'cabeleireiro', 'costureiro', 'bibliotecário', 'economista'] },
    transportes: { label: 'Meios de transporte', words: ['carro', 'moto', 'bicicleta', 'ônibus', 'caminhão', 'trem', 'metrô', 'avião', 'helicóptero', 'navio', 'barco', 'lancha', 'balsa', 'bonde', 'patinete', 'táxi', 'van', 'trator', 'jangada', 'canoa', 'submarino', 'foguete', 'teleférico', 'caminhonete', 'charrete'] }
  };
  const allWords = [...new Set(Object.values(wordCategories).flatMap(category => category.words))];
  const loremWords = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate', 'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint', 'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia', 'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum'];

  window.faytorGenerators = {
    emailDomains,
    dddMap,

    // Prenomes do gênero escolhido e sobrenomes, sem repetição dentro do mesmo nome.
    // surnameCount 'aleatorio' sorteia um ou dois sobrenomes, como nos cadastros mais comuns.
    nome(gender = 'aleatorio', firstNameCount = 1, surnameCount = 'aleatorio') {
      const firstNames = gender === 'masculino' ? maleNames : gender === 'feminino' ? femaleNames : pick([maleNames, femaleNames]);
      const firstCount = Math.min(3, Math.max(1, Number(firstNameCount) || 1));
      const lastCount = surnameCount === 'aleatorio' ? (Math.random() < 0.6 ? 2 : 1) : Math.min(4, Math.max(1, Number(surnameCount) || 1));
      return [...sample(firstNames, firstCount), ...sample(surnames, lastCount)].join(' ');
    },

    email(domain = 'random') {
      const first = plain(pick(Math.random() < 0.5 ? maleNames : femaleNames));
      const last = plain(pick(surnames));
      const username = pick([
        `${first}.${last}`,
        `${first}${last}`,
        `${first}_${last}`,
        `${first}${Math.floor(Math.random() * 90) + 10}`,
        `${first}.${last}${Math.floor(Math.random() * 900) + 99}`
      ]);
      return `${username}${domain === 'random' ? pick(emailDomains) : domain}`;
    },

    // Celular: DDD do estado, 9 e mais 8 dígitos.
    celular({ state = 'random', punctuation = true } = {}) {
      const ddd = pick(dddMap[state] || dddMap[pick(Object.keys(dddMap))]);
      const number = `9${Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('')}`;
      return this.formatCelular(`${ddd}${number}`, punctuation);
    },

    formatCelular(digits, punctuation) {
      return punctuation ? digits.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3') : digits;
    },

    /**
     * Número inteiro, decimal ou em dinheiro, limitado por quantidade de dígitos ou por intervalo.
     * O padrão brasileiro usa vírgula decimal e ponto nos milhares; o americano, o contrário.
     * Em dinheiro, a moeda define o padrão: Real (R$ 1.234,56) ou Dólar ($1,234.56).
     */
    numero({ format = 'integer', limit = 'digits', digits = 4, min = 0, max = 1000, decimals = 2, style = 'br', thousands = false, currency = 'BRL', symbol = true } = {}) {
      const places = format === 'money' ? 2 : format === 'decimal' ? clamp(decimals, 1, 10, 2) : 0;
      const pattern = format === 'money' ? (currency === 'USD' ? 'us' : 'br') : style;
      const separators = pattern === 'us' ? { decimal: '.', group: ',' } : { decimal: ',', group: '.' };
      let negative = false;
      let integerPart;
      let fraction = randomDigits(places);
      if (limit === 'range') {
        let low = Number(min);
        let high = Number(max);
        if (!Number.isFinite(low)) low = 0;
        if (!Number.isFinite(high)) high = low;
        if (low > high) throw new Error('o máximo não pode ser menor que o mínimo');
        const scale = 10 ** places;
        // A tolerância evita erros de ponto flutuante, como 0,1 × 100 = 10,000000000000002.
        const first = Math.ceil(low * scale - 1e-9);
        const last = Math.floor(high * scale + 1e-9);
        if (first > last) throw new Error('o intervalo não contém nenhum valor com essa quantidade de casas decimais');
        if (Math.abs(first) > Number.MAX_SAFE_INTEGER || Math.abs(last) > Number.MAX_SAFE_INTEGER) throw new Error('o intervalo é grande demais para essa quantidade de casas decimais');
        const value = first + Math.floor(Math.random() * (last - first + 1));
        negative = value < 0;
        const absolute = String(Math.abs(value)).padStart(places + 1, '0');
        integerPart = places ? absolute.slice(0, -places) : absolute;
        fraction = places ? absolute.slice(-places) : '';
      } else {
        const count = clamp(digits, 1, 15, 4);
        integerPart = count === 1 ? randomDigits(1) : `${1 + Math.floor(Math.random() * 9)}${randomDigits(count - 1)}`;
      }
      if (thousands) integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, separators.group);
      let text = places ? `${integerPart}${separators.decimal}${fraction}` : integerPart;
      if (format === 'money' && symbol) text = `${currency === 'USD' ? '$' : 'R$ '}${text}`;
      return negative ? `-${text}` : text;
    },

    wordCategories,

    // Palavras distintas da categoria escolhida ("todas" mistura as categorias).
    palavras({ category = 'todas', count = 1, letterCase = 'original' } = {}) {
      const list = category === 'todas' ? allWords : wordCategories[category]?.words || allWords;
      const words = sample(list, clamp(count, 1, 20, 1));
      const cased = words.map(word => {
        if (letterCase === 'lower') return word.toLocaleLowerCase('pt-BR');
        if (letterCase === 'upper') return word.toLocaleUpperCase('pt-BR');
        if (letterCase === 'title') return word.replace(/(^|[\s-])(\p{L})/gu, (_, before, letter) => before + letter.toLocaleUpperCase('pt-BR'));
        return word;
      });
      return cased.join(' ');
    },

    /**
     * Texto Lorem Ipsum por quantidade de palavras, parágrafos ou caracteres.
     * Em caracteres, o texto tem exatamente a quantidade pedida.
     */
    lorem({ unit = 'paragraphs', amount = 3, startWithLorem = true } = {}) {
      const limits = { words: 1000, paragraphs: 50, characters: 10000 };
      const total = clamp(amount, 1, limits[unit] || 50, 3);
      const opening = ['lorem', 'ipsum', 'dolor', 'sit', 'amet,', 'consectetur', 'adipiscing', 'elit'];
      const sentence = (words, randomCommas = true) => {
        const text = words.map((word, index) => (randomCommas && index > 2 && index < words.length - 2 && Math.random() < 0.12 ? `${word},` : word)).join(' ');
        return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;
      };
      // Divide uma lista de palavras em frases de 6 a 14 palavras.
      const sentences = words => {
        const result = [];
        for (let index = 0; index < words.length;) {
          const size = 6 + Math.floor(Math.random() * 9);
          result.push(sentence(words.slice(index, index + size)));
          index += size;
        }
        return result.join(' ');
      };
      const randomWords = count => Array.from({ length: count }, () => pick(loremWords));
      // A abertura clássica forma sempre a primeira frase: "Lorem ipsum dolor sit amet, consectetur adipiscing elit."
      const withOpening = count => {
        if (count <= opening.length) return sentence(opening.slice(0, count).map((word, index) => (index === count - 1 ? word.replace(/,$/, '') : word)), false);
        return `${sentence(opening, false)} ${sentences(randomWords(count - opening.length))}`;
      };
      if (unit === 'words') return startWithLorem ? withOpening(total) : sentences(randomWords(total));
      const paragraph = isFirst => {
        const count = 40 + Math.floor(Math.random() * 40);
        return isFirst && startWithLorem ? withOpening(count) : sentences(randomWords(count));
      };
      if (unit === 'characters') {
        let text = paragraph(true);
        while (text.length < total) text += ` ${paragraph(false)}`;
        text = text.slice(0, total);
        // Evita terminar em espaço, mantendo exatamente a quantidade pedida.
        return text.length > 1 && text.endsWith(' ') ? `${text.slice(0, -1)}.` : text;
      }
      return Array.from({ length: total }, (_, index) => paragraph(index === 0)).join('\n\n');
    }
  };

  const states = [['AC', 'Acre'], ['AL', 'Alagoas'], ['AP', 'Amapá'], ['AM', 'Amazonas'], ['BA', 'Bahia'], ['CE', 'Ceará'], ['DF', 'Distrito Federal'], ['ES', 'Espírito Santo'], ['GO', 'Goiás'], ['MA', 'Maranhão'], ['MT', 'Mato Grosso'], ['MS', 'Mato Grosso do Sul'], ['MG', 'Minas Gerais'], ['PA', 'Pará'], ['PB', 'Paraíba'], ['PR', 'Paraná'], ['PE', 'Pernambuco'], ['PI', 'Piauí'], ['RJ', 'Rio de Janeiro'], ['RN', 'Rio Grande do Norte'], ['RS', 'Rio Grande do Sul'], ['RO', 'Rondônia'], ['RR', 'Roraima'], ['SC', 'Santa Catarina'], ['SP', 'São Paulo'], ['SE', 'Sergipe'], ['TO', 'Tocantins']];
  const stateOptions = [['random', 'Aleatório'], ...states.map(([code, name]) => [code, `${name} (${code})`])];
  const punctuation = { key: 'punctuation', label: 'Com pontuação', type: 'switch', default: true };
  const documentType = (key, label, page, extraOptions = [], toOptions = () => ({})) => ({
    label,
    page,
    options: [punctuation, ...extraOptions],
    generate(options) {
      const rule = window.faytorDocuments[key];
      const raw = rule.generate(toOptions(options));
      return options.punctuation ? rule.format(raw) : raw;
    }
  });

  // Opções compartilhadas entre as telas dos geradores e o registro de variáveis.
  const firstNameOptions = [['1', '1 prenome'], ['2', '2 prenomes'], ['3', '3 prenomes']];
  const surnameOptions = [['aleatorio', 'Aleatório (1 ou 2)'], ['1', '1 sobrenome'], ['2', '2 sobrenomes'], ['3', '3 sobrenomes'], ['4', '4 sobrenomes']];
  const loremUnitOptions = [['words', 'Palavras'], ['paragraphs', 'Parágrafos'], ['characters', 'Caracteres']];
  const wordCategoryOptions = [['todas', 'Todas'], ...Object.entries(wordCategories).map(([key, category]) => [key, category.label])];
  const letterCaseOptions = [['original', 'Como na lista'], ['lower', 'minúsculas'], ['title', 'Primeira Maiúscula'], ['upper', 'MAIÚSCULAS']];
  const isNumber = format => options => options.format === format;
  const numberOptions = [
    { key: 'format', label: 'Formato', type: 'select', options: [['integer', 'Inteiro'], ['decimal', 'Decimal'], ['money', 'Dinheiro']], default: 'integer' },
    { key: 'currency', label: 'Moeda', type: 'select', options: [['BRL', 'Real (R$ 1.234,56)'], ['USD', 'Dólar ($1,234.56)']], default: 'BRL', when: isNumber('money') },
    { key: 'symbol', label: 'Símbolo da moeda', type: 'switch', default: true, when: isNumber('money') },
    { key: 'limit', label: 'Limitar por', type: 'select', options: [['digits', 'Quantidade de dígitos'], ['range', 'Intervalo (mín. e máx.)']], default: 'digits' },
    { key: 'digits', label: 'Dígitos', type: 'number', min: 1, max: 15, default: 4, when: options => options.limit !== 'range' },
    { key: 'min', label: 'Mínimo', type: 'number', step: 'any', default: 0, when: options => options.limit === 'range' },
    { key: 'max', label: 'Máximo', type: 'number', step: 'any', default: 1000, when: options => options.limit === 'range' },
    { key: 'decimals', label: 'Casas decimais', type: 'number', min: 1, max: 10, default: 2, when: isNumber('decimal') },
    { key: 'style', label: 'Separadores', type: 'select', options: [['br', 'Brasileiro (1.234,56)'], ['us', 'Americano (1,234.56)']], default: 'br', when: options => options.format !== 'money' },
    { key: 'thousands', label: 'Separar milhares', type: 'switch', default: false }
  ];
  window.faytorGenerators.numberOptions = numberOptions;
  window.faytorGenerators.optionLists = { firstNameOptions, surnameOptions, loremUnitOptions, wordCategoryOptions, letterCaseOptions };

  // Tipos em ordem alfabética, como no menu de Geradores.
  window.faytorVariableTypes = {
    celular: {
      label: 'Celular',
      page: 'gerador-celular',
      options: [punctuation, { key: 'state', label: 'Estado (DDD)', type: 'select', options: stateOptions, default: 'random' }],
      generate: options => window.faytorGenerators.celular(options)
    },
    cnpj: documentType('cnpj', 'CNPJ', 'gerador-cnpj',
      [{ key: 'format', label: 'Formato', type: 'select', options: [['numeric', 'Numérico'], ['alphanumeric', 'Alfanumérico']], default: 'numeric' }],
      options => ({ format: options.format })),
    cns: documentType('cns', 'CNS', 'gerador-cns'),
    cpf: documentType('cpf', 'CPF', 'gerador-cpf',
      [{ key: 'state', label: 'Estado de origem', type: 'select', options: stateOptions, default: 'random' }],
      options => ({ state: options.state })),
    email: {
      label: 'E-mail',
      page: 'gerador-email',
      options: [{ key: 'domain', label: 'Domínio', type: 'select', options: [['random', 'Aleatório'], ...emailDomains.map(domain => [domain, domain])], default: 'random' }],
      generate: options => window.faytorGenerators.email(options.domain)
    },
    hash: {
      label: 'Hash',
      page: 'gerador-hash',
      options: [
        { key: 'algorithm', label: 'Algoritmo', type: 'select', options: window.faytorHash.algorithmOptions, default: 'sha256' },
        { key: 'output', label: 'Formato', type: 'select', options: window.faytorHash.outputOptions, default: 'hex' }
      ],
      // Hash de um valor aleatório; para hash de um texto conhecido, use a página do gerador.
      generate: options => window.faytorHash.digest({ text: window.faytorHash.randomValue(), algorithm: options.algorithm, output: options.output })
    },
    lorem: {
      label: 'Lorem Ipsum',
      page: 'gerador-lorem-ipsum',
      options: [
        { key: 'unit', label: 'Gerar por', type: 'select', options: loremUnitOptions, default: 'words' },
        { key: 'amount', label: 'Quantidade', type: 'number', min: 1, max: 10000, default: 10 },
        { key: 'startWithLorem', label: 'Começar com "Lorem ipsum"', type: 'switch', default: true }
      ],
      generate: options => window.faytorGenerators.lorem(options)
    },
    nome: {
      label: 'Nome',
      page: 'gerador-nomes',
      options: [
        { key: 'gender', label: 'Gênero', type: 'select', options: [['aleatorio', 'Aleatório'], ['feminino', 'Feminino'], ['masculino', 'Masculino']], default: 'aleatorio' },
        { key: 'firstNames', label: 'Prenomes', type: 'select', options: firstNameOptions, default: '1' },
        { key: 'surnames', label: 'Sobrenomes', type: 'select', options: surnameOptions, default: 'aleatorio' }
      ],
      generate: options => window.faytorGenerators.nome(options.gender, options.firstNames, options.surnames)
    },
    numero: {
      label: 'Número',
      page: 'gerador-numeros',
      options: numberOptions,
      generate: options => window.faytorGenerators.numero(options)
    },
    palavras: {
      label: 'Palavras',
      page: 'gerador-palavras',
      options: [
        { key: 'category', label: 'Categoria', type: 'select', options: wordCategoryOptions, default: 'todas' },
        { key: 'count', label: 'Palavras', type: 'number', min: 1, max: 20, default: 1 },
        { key: 'letterCase', label: 'Letras', type: 'select', options: letterCaseOptions, default: 'original' }
      ],
      generate: options => window.faytorGenerators.palavras(options)
    },
    pis: documentType('pis', 'PIS/PASEP', 'gerador-pis'),
    rg: documentType('rg', 'RG', 'gerador-rg'),
    senha: {
      label: 'Senha',
      page: 'gerador-senhas',
      options: [
        { key: 'mode', label: 'Modo', type: 'select', options: [['random', 'Aleatório'], ['easy', 'Fácil de lembrar'], ['pin', 'PIN']], default: 'random' },
        { key: 'length', label: 'Tamanho', type: 'number', min: 4, max: 128, default: 16, when: options => options.mode === 'random' },
        { key: 'uppercase', label: 'Maiúsculas', type: 'switch', default: true, when: options => options.mode === 'random' },
        { key: 'lowercase', label: 'Minúsculas', type: 'switch', default: true, when: options => options.mode === 'random' },
        { key: 'numbers', label: 'Números', type: 'switch', default: true, when: options => options.mode === 'random' },
        { key: 'special', label: 'Símbolos', type: 'switch', default: true, when: options => options.mode === 'random' },
        { key: 'words', label: 'Palavras', type: 'number', min: 2, max: 10, default: 4, when: options => options.mode === 'easy' },
        { key: 'capitalize', label: 'Primeira maiúscula', type: 'switch', default: true, when: options => options.mode === 'easy' },
        { key: 'complete', label: 'Palavras completas', type: 'switch', default: true, when: options => options.mode === 'easy' },
        { key: 'pinLength', label: 'Dígitos', type: 'number', min: 4, max: 32, default: 6, when: options => options.mode === 'pin' }
      ],
      generate(options) {
        const passwords = window.faytorPasswords;
        const clamp = (value, min, max, fallback) => Math.min(max, Math.max(min, Number.parseInt(value, 10) || fallback));
        if (options.mode === 'easy') return passwords.easy(clamp(options.words, 2, 10, 4), options.capitalize, options.complete);
        if (options.mode === 'pin') return passwords.pin(clamp(options.pinLength, 4, 32, 6));
        const sets = passwords.characterSets.filter((_, index) => [options.uppercase, options.lowercase, options.numbers, options.special][index]);
        if (!sets.length) throw new Error('marque ao menos um tipo de caractere');
        return passwords.random(clamp(options.length, 4, 128, 16), sets);
      }
    }
  };
})();

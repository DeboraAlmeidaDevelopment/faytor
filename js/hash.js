/**
 * Funções de hash síncronas em JavaScript puro (MD5, SHA-1, SHA-2 e CRC32) e HMAC.
 * A Web Crypto não é usada porque é assíncrona e exige contexto seguro; a geração
 * em lote e as variáveis do Gerador de JSON precisam de resultados síncronos.
 */
(() => {
  const encoder = new TextEncoder();
  const rotl = (x, n) => (x << n) | (x >>> (32 - n));
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));

  // Preenchimento padrão: bit 1, zeros e o tamanho da mensagem em bits.
  const pad = (bytes, blockSize, lengthBytes, littleEndian) => {
    const total = Math.ceil((bytes.length + 1 + lengthBytes) / blockSize) * blockSize;
    const padded = new Uint8Array(total);
    padded.set(bytes);
    padded[bytes.length] = 0x80;
    const view = new DataView(padded.buffer);
    const bits = bytes.length * 8;
    const high = Math.floor(bits / 2 ** 32);
    const low = bits >>> 0;
    if (littleEndian) {
      view.setUint32(total - 8, low, true);
      view.setUint32(total - 4, high, true);
    } else {
      view.setUint32(total - 8, high);
      view.setUint32(total - 4, low);
    }
    return { padded, view };
  };

  const MD5_SHIFTS = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
  const MD5_K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0);

  const md5 = bytes => {
    const { padded, view } = pad(bytes, 64, 8, true);
    let [a0, b0, c0, d0] = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
    for (let offset = 0; offset < padded.length; offset += 64) {
      const m = Array.from({ length: 16 }, (_, i) => view.getUint32(offset + i * 4, true));
      let [a, b, c, d] = [a0, b0, c0, d0];
      for (let i = 0; i < 64; i += 1) {
        let f;
        let g;
        if (i < 16) { f = (b & c) | (~b & d); g = i; }
        else if (i < 32) { f = (d & b) | (~d & c); g = (5 * i + 1) % 16; }
        else if (i < 48) { f = b ^ c ^ d; g = (3 * i + 5) % 16; }
        else { f = c ^ (b | ~d); g = (7 * i) % 16; }
        const next = d;
        d = c;
        c = b;
        b = (b + rotl((a + f + MD5_K[i] + m[g]) | 0, MD5_SHIFTS[i])) | 0;
        a = next;
      }
      a0 = (a0 + a) | 0; b0 = (b0 + b) | 0; c0 = (c0 + c) | 0; d0 = (d0 + d) | 0;
    }
    const out = new DataView(new ArrayBuffer(16));
    [a0, b0, c0, d0].forEach((word, i) => out.setUint32(i * 4, word >>> 0, true));
    return new Uint8Array(out.buffer);
  };

  const sha1 = bytes => {
    const { padded, view } = pad(bytes, 64, 8, false);
    const h = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];
    const w = new Int32Array(80);
    for (let offset = 0; offset < padded.length; offset += 64) {
      for (let i = 0; i < 16; i += 1) w[i] = view.getUint32(offset + i * 4);
      for (let i = 16; i < 80; i += 1) w[i] = rotl(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1);
      let [a, b, c, d, e] = h;
      for (let i = 0; i < 80; i += 1) {
        const [f, k] = i < 20 ? [(b & c) | (~b & d), 0x5a827999] : i < 40 ? [b ^ c ^ d, 0x6ed9eba1] : i < 60 ? [(b & c) | (b & d) | (c & d), 0x8f1bbcdc] : [b ^ c ^ d, 0xca62c1d6];
        const temp = (rotl(a, 5) + f + e + k + w[i]) | 0;
        e = d; d = c; c = rotl(b, 30); b = a; a = temp;
      }
      [a, b, c, d, e].forEach((value, i) => { h[i] = (h[i] + value) | 0; });
    }
    const out = new DataView(new ArrayBuffer(20));
    h.forEach((word, i) => out.setUint32(i * 4, word >>> 0));
    return new Uint8Array(out.buffer);
  };

  const SHA256_K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];

  const sha256Family = (initial, outputWords) => bytes => {
    const { padded, view } = pad(bytes, 64, 8, false);
    const h = [...initial];
    const w = new Int32Array(64);
    for (let offset = 0; offset < padded.length; offset += 64) {
      for (let i = 0; i < 16; i += 1) w[i] = view.getUint32(offset + i * 4);
      for (let i = 16; i < 64; i += 1) {
        const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      let [a, b, c, d, e, f, g, hh] = h;
      for (let i = 0; i < 64; i += 1) {
        const t1 = (hh + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + SHA256_K[i] + w[i]) | 0;
        const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
        hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      [a, b, c, d, e, f, g, hh].forEach((value, i) => { h[i] = (h[i] + value) | 0; });
    }
    const out = new DataView(new ArrayBuffer(outputWords * 4));
    h.slice(0, outputWords).forEach((word, i) => out.setUint32(i * 4, word >>> 0));
    return new Uint8Array(out.buffer);
  };

  // SHA-384 e SHA-512 usam palavras de 64 bits; BigInt mantém a implementação legível.
  const SHA512_K = ['428a2f98d728ae22', '7137449123ef65cd', 'b5c0fbcfec4d3b2f', 'e9b5dba58189dbbc', '3956c25bf348b538', '59f111f1b605d019', '923f82a4af194f9b', 'ab1c5ed5da6d8118', 'd807aa98a3030242', '12835b0145706fbe', '243185be4ee4b28c', '550c7dc3d5ffb4e2', '72be5d74f27b896f', '80deb1fe3b1696b1', '9bdc06a725c71235', 'c19bf174cf692694', 'e49b69c19ef14ad2', 'efbe4786384f25e3', '0fc19dc68b8cd5b5', '240ca1cc77ac9c65', '2de92c6f592b0275', '4a7484aa6ea6e483', '5cb0a9dcbd41fbd4', '76f988da831153b5', '983e5152ee66dfab', 'a831c66d2db43210', 'b00327c898fb213f', 'bf597fc7beef0ee4', 'c6e00bf33da88fc2', 'd5a79147930aa725', '06ca6351e003826f', '142929670a0e6e70', '27b70a8546d22ffc', '2e1b21385c26c926', '4d2c6dfc5ac42aed', '53380d139d95b3df', '650a73548baf63de', '766a0abb3c77b2a8', '81c2c92e47edaee6', '92722c851482353b', 'a2bfe8a14cf10364', 'a81a664bbc423001', 'c24b8b70d0f89791', 'c76c51a30654be30', 'd192e819d6ef5218', 'd69906245565a910', 'f40e35855771202a', '106aa07032bbd1b8', '19a4c116b8d2d0c8', '1e376c085141ab53', '2748774cdf8eeb99', '34b0bcb5e19b48a8', '391c0cb3c5c95a63', '4ed8aa4ae3418acb', '5b9cca4f7763e373', '682e6ff3d6b2b8a3', '748f82ee5defb2fc', '78a5636f43172f60', '84c87814a1f0ab72', '8cc702081a6439ec', '90befffa23631e28', 'a4506cebde82bde9', 'bef9a3f7b2c67915', 'c67178f2e372532b', 'ca273eceea26619c', 'd186b8c721c0c207', 'eada7dd6cde0eb1e', 'f57d4f7fee6ed178', '06f067aa72176fba', '0a637dc5a2c898a6', '113f9804bef90dae', '1b710b35131c471b', '28db77f523047d84', '32caab7b40c72493', '3c9ebe0a15c9bebc', '431d67c49c100d4c', '4cc5d4becb3e42b6', '597f299cfc657e2a', '5fcb6fab3ad6faec', '6c44198c4a475817'].map(hex => BigInt(`0x${hex}`));
  const MASK64 = (1n << 64n) - 1n;
  const rotr64 = (x, n) => ((x >> n) | (x << (64n - n))) & MASK64;

  const sha512Family = (initialHex, outputBytes) => bytes => {
    const padded = new Uint8Array(Math.ceil((bytes.length + 17) / 128) * 128);
    padded.set(bytes);
    padded[bytes.length] = 0x80;
    const view = new DataView(padded.buffer);
    const bits = BigInt(bytes.length) * 8n;
    view.setBigUint64(padded.length - 8, bits);
    const h = initialHex.map(hex => BigInt(`0x${hex}`));
    const w = new Array(80);
    for (let offset = 0; offset < padded.length; offset += 128) {
      for (let i = 0; i < 16; i += 1) w[i] = view.getBigUint64(offset + i * 8);
      for (let i = 16; i < 80; i += 1) {
        const s0 = rotr64(w[i - 15], 1n) ^ rotr64(w[i - 15], 8n) ^ (w[i - 15] >> 7n);
        const s1 = rotr64(w[i - 2], 19n) ^ rotr64(w[i - 2], 61n) ^ (w[i - 2] >> 6n);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) & MASK64;
      }
      let [a, b, c, d, e, f, g, hh] = h;
      for (let i = 0; i < 80; i += 1) {
        const t1 = (hh + (rotr64(e, 14n) ^ rotr64(e, 18n) ^ rotr64(e, 41n)) + ((e & f) ^ (~e & MASK64 & g)) + SHA512_K[i] + w[i]) & MASK64;
        const t2 = ((rotr64(a, 28n) ^ rotr64(a, 34n) ^ rotr64(a, 39n)) + ((a & b) ^ (a & c) ^ (b & c))) & MASK64;
        hh = g; g = f; f = e; e = (d + t1) & MASK64; d = c; c = b; b = a; a = (t1 + t2) & MASK64;
      }
      [a, b, c, d, e, f, g, hh].forEach((value, i) => { h[i] = (h[i] + value) & MASK64; });
    }
    const out = new DataView(new ArrayBuffer(64));
    h.forEach((word, i) => out.setBigUint64(i * 8, word));
    return new Uint8Array(out.buffer).slice(0, outputBytes);
  };

  const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc32 = bytes => {
    let crc = 0xffffffff;
    for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    const out = new DataView(new ArrayBuffer(4));
    out.setUint32(0, (crc ^ 0xffffffff) >>> 0);
    return new Uint8Array(out.buffer);
  };

  const algorithms = {
    md5: { label: 'MD5', fn: md5, blockSize: 64 },
    sha1: { label: 'SHA-1', fn: sha1, blockSize: 64 },
    sha224: { label: 'SHA-224', fn: sha256Family([0xc1059ed8, 0x367cd507, 0x3070dd17, 0xf70e5939, 0xffc00b31, 0x68581511, 0x64f98fa7, 0xbefa4fa4], 7), blockSize: 64 },
    sha256: { label: 'SHA-256', fn: sha256Family([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19], 8), blockSize: 64 },
    sha384: { label: 'SHA-384', fn: sha512Family(['cbbb9d5dc1059ed8', '629a292a367cd507', '9159015a3070dd17', '152fecd8f70e5939', '67332667ffc00b31', '8eb44a8768581511', 'db0c2e0d64f98fa7', '47b5481dbefa4fa4'], 48), blockSize: 128 },
    sha512: { label: 'SHA-512', fn: sha512Family(['6a09e667f3bcc908', 'bb67ae8584caa73b', '3c6ef372fe94f82b', 'a54ff53a5f1d36f1', '510e527fade682d1', '9b05688c2b3e6c1f', '1f83d9abfb41bd6b', '5be0cd19137e2179'], 64), blockSize: 128 },
    crc32: { label: 'CRC32', fn: crc32, blockSize: 0 }
  };

  // HMAC (RFC 2104): chave ajustada ao bloco, combinada com ipad e opad.
  const hmac = (algorithm, key, message) => {
    const { fn, blockSize } = algorithms[algorithm];
    let keyBytes = key.length > blockSize ? fn(key) : key;
    const block = new Uint8Array(blockSize);
    block.set(keyBytes);
    keyBytes = block;
    const inner = new Uint8Array(blockSize + message.length);
    const outer = new Uint8Array(blockSize);
    for (let i = 0; i < blockSize; i += 1) {
      inner[i] = keyBytes[i] ^ 0x36;
      outer[i] = keyBytes[i] ^ 0x5c;
    }
    inner.set(message, blockSize);
    const innerHash = fn(inner);
    const final = new Uint8Array(blockSize + innerHash.length);
    final.set(outer);
    final.set(innerHash, blockSize);
    return fn(final);
  };

  const toHex = bytes => Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  const toBase64 = bytes => btoa(String.fromCharCode(...bytes));
  const randomBytes = count => {
    const bytes = new Uint8Array(count);
    if (window.crypto?.getRandomValues) window.crypto.getRandomValues(bytes);
    else for (let i = 0; i < count; i += 1) bytes[i] = Math.floor(Math.random() * 256);
    return bytes;
  };

  window.faytorHash = {
    algorithms,
    algorithmOptions: Object.entries(algorithms).map(([key, { label }]) => [key, label]),
    outputOptions: [['hex', 'Hexadecimal (minúsculas)'], ['HEX', 'Hexadecimal (MAIÚSCULAS)'], ['base64', 'Base64']],

    /**
     * Calcula o hash de um texto (UTF-8). Com hmacKey, calcula o HMAC; o CRC32 não tem HMAC.
     */
    digest({ text = '', algorithm = 'sha256', output = 'hex', hmacKey = null } = {}) {
      if (!algorithms[algorithm]) throw new Error('algoritmo desconhecido');
      const message = encoder.encode(text);
      const bytes = hmacKey !== null && algorithm !== 'crc32'
        ? hmac(algorithm, encoder.encode(hmacKey), message)
        : algorithms[algorithm].fn(message);
      if (output === 'base64') return toBase64(bytes);
      return output === 'HEX' ? toHex(bytes).toUpperCase() : toHex(bytes);
    },

    // Valor aleatório de 32 bytes em hexadecimal, usado como origem do hash aleatório.
    randomValue: () => toHex(randomBytes(32))
  };
})();

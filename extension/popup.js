const button = document.getElementById('fill-cpf');
const punctuation = document.getElementById('with-punctuation');
const status = document.getElementById('status');

function showStatus(message, type) {
  status.textContent = message;
  status.className = `status ${type}`;
}

function fillCpfField(usePunctuation) {
  const cpfRegions = {
    AC: 2, AL: 4, AP: 2, AM: 2, BA: 5, CE: 3, DF: 1, ES: 3,
    GO: 1, MA: 3, MT: 1, MS: 1, MG: 6, PA: 2, PB: 4, PR: 9,
    PE: 4, PI: 3, RJ: 7, RN: 4, RS: 0, RO: 2, RR: 2, SC: 9,
    SP: 8, SE: 5, TO: 1
  };
  const digits = [];
  for (let index = 0; index < 8; index += 1) {
    digits.push(Math.floor(Math.random() * 10));
  }
  const regions = Object.values(cpfRegions);
  digits.push(regions[Math.floor(Math.random() * regions.length)]);

  let sum = 0;
  for (let index = 0; index < 9; index += 1) sum += digits[index] * (10 - index);
  let remainder = sum % 11;
  digits.push(remainder < 2 ? 0 : 11 - remainder);

  sum = 0;
  for (let index = 0; index < 10; index += 1) sum += digits[index] * (11 - index);
  remainder = sum % 11;
  digits.push(remainder < 2 ? 0 : 11 - remainder);

  const rawCpf = digits.join('');
  const value = usePunctuation ? rawCpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4') : rawCpf;
  const candidates = [...document.querySelectorAll('input, textarea')]
    .filter((field) => !field.disabled && !field.readOnly && field.type !== 'hidden')
    .map((field) => {
      const label = field.labels?.[0]?.textContent || field.closest('label')?.textContent || '';
      const text = [field.id, field.name, field.placeholder, field.getAttribute('aria-label'), label]
        .join(' ').toLowerCase();
      let score = 0;
      if (text.includes('cpf')) score += 10;
      if (field.autocomplete?.toLowerCase() === 'off') score -= 1;
      if (['email', 'password', 'file', 'submit', 'button', 'checkbox', 'radio'].includes(field.type)) score -= 10;
      return { field, score };
    })
    .filter(({ score }) => score > 0)
    .sort((first, second) => second.score - first.score);

  if (!candidates.length) return { ok: false, message: 'Nenhum campo de CPF foi encontrado.' };

  const field = candidates[0].field;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    || Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
  setter?.call(field, value);
  field.dispatchEvent(new Event('input', { bubbles: true }));
  field.dispatchEvent(new Event('change', { bubbles: true }));
  field.focus();
  return { ok: true, value };
}

button.addEventListener('click', async () => {
  button.disabled = true;
  showStatus('Procurando um campo de CPF...', '');
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('Não foi possível identificar a aba atual.');
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: fillCpfField,
      args: [punctuation.checked]
    });
    if (!result.result?.ok) throw new Error(result.result?.message || 'Não foi possível preencher o campo.');
    showStatus(`CPF preenchido: ${result.result.value}`, 'success');
  } catch (error) {
    showStatus(error.message || 'Não foi possível executar na página atual.', 'error');
  } finally {
    button.disabled = false;
  }
});

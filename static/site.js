// Kopieerknoppen bij codeblokken. Zonder dit script blijven de blokken gewoon leesbaar.
for (const block of document.querySelectorAll('.codeblock')) {
  const button = block.querySelector('.copy');
  const code = block.querySelector('code');
  if (!button || !code || !navigator.clipboard) continue;
  button.hidden = false;
  button.setAttribute('aria-label', 'Kopieer code');
  let reset;
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(code.textContent.replace(/\n$/, ''));
      button.textContent = 'Gekopieerd';
      button.dataset.state = 'done';
    } catch {
      button.textContent = 'Lukt niet';
      button.dataset.state = 'failed';
    }
    clearTimeout(reset);
    reset = setTimeout(() => {
      button.textContent = 'Kopieer';
      delete button.dataset.state;
    }, 1600);
  });
}

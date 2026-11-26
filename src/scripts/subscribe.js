const leadsEndpoint = 'https://85-208-87-17.sslip.io/landing/leads';

export function initSubscribe(getCopy) {
  const form = document.getElementById('subscribe-form');
  const input = form.elements.email;
  const button = form.querySelector('[data-submit]');
  const status = document.getElementById('subscribe-status');
  // Selection APIs require type="text", so email validation uses a separate input.
  const emailValidator = document.createElement('input');
  emailValidator.type = 'email';
  emailValidator.required = true;
  let state = '';
  let isSending = false;

  const renderStatus = () => {
    status.textContent = state ? getCopy()[state] : '';
    status.dataset.state = ['invalidEmail', 'failure'].includes(state) ? 'error' : state;
  };

  document.addEventListener('landing:language', renderStatus);
  input.addEventListener('input', () => {
    input.removeAttribute('aria-invalid');
    if (!isSending) { state = ''; renderStatus(); }
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (isSending) return;

    const email = input.value.trim();
    input.value = email;
    emailValidator.value = email;
    if (!emailValidator.validity.valid || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      state = 'invalidEmail';
      input.setAttribute('aria-invalid', 'true');
      renderStatus();
      input.focus();
      return;
    }

    input.removeAttribute('aria-invalid');
    isSending = true;
    button.disabled = true;
    input.readOnly = true;
    button.setAttribute('aria-busy', 'true');
    state = 'sending';
    renderStatus();
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(leadsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Lead request failed: ${response.status}`);
      form.reset();
      state = 'success';
    } catch {
      state = 'failure';
    } finally {
      window.clearTimeout(timeout);
      isSending = false;
      button.disabled = false;
      input.readOnly = false;
      button.removeAttribute('aria-busy');
      renderStatus();
    }
  });
}

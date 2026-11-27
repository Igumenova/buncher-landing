export function initInputCaret() {
  const input = document.getElementById('email');
  const field = input.closest('.subscribe__field');
  const caret = field.querySelector('.subscribe__caret');
  const measure = document.createElement('span');
  measure.className = 'subscribe__measure';
  measure.setAttribute('aria-hidden', 'true');
  field.append(measure);
  input.classList.add('has-custom-caret');
  let frame;
  let isComposing = false;

  const update = () => {
    const focused = document.activeElement === input;
    const selection = input.selectionStart !== input.selectionEnd;
    if (!focused || selection || isComposing || input.readOnly || input.disabled) {
      caret.hidden = true;
      return;
    }
    const style = getComputedStyle(input);
    measure.style.font = style.font;
    measure.style.letterSpacing = style.letterSpacing;
    measure.textContent = input.value.slice(0, input.selectionEnd ?? input.value.length);
    const start = parseFloat(style.paddingLeft);
    const end = input.getBoundingClientRect().width - parseFloat(style.paddingRight);
    const left = start + measure.getBoundingClientRect().width - input.scrollLeft;
    const caretWidth = parseFloat(getComputedStyle(caret).width);
    caret.hidden = left < start - 1 || left > end + 1;
    caret.style.left = `${Math.min(end - caretWidth, Math.max(start, left))}px`;
    caret.style.height = `${parseFloat(style.fontSize) * 1.1}px`;
  };
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(update);
  };

  ['input', 'focus', 'blur', 'keyup', 'click', 'pointerup', 'scroll', 'select'].forEach(event => {
    input.addEventListener(event, schedule);
  });
  input.addEventListener('compositionstart', () => {
    isComposing = true;
    input.classList.remove('has-custom-caret');
    schedule();
  });
  input.addEventListener('compositionend', () => {
    isComposing = false;
    input.classList.add('has-custom-caret');
    schedule();
  });
  document.addEventListener('selectionchange', schedule);
  new ResizeObserver(schedule).observe(input);
  new MutationObserver(schedule).observe(input, { attributes: true, attributeFilter: ['readonly', 'disabled'] });
  document.fonts.ready.then(schedule);
  schedule();
}

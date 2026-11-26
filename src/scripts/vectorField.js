// Inset strokes avoid clipping at fractional sizes.
export function initVectorField() {
  const field = document.querySelector('.subscribe__field');
  const layers = field.querySelectorAll('[data-field-shape]');
  const fills = field.querySelectorAll('[data-field-path]');
  const outerOutline = field.querySelector('[data-field-outline]');
  const buttonFill = field.querySelector('[data-button-fill]');
  const buttonOutline = field.querySelector('[data-button-outline]');
  const number = value => Number(value.toFixed(5));

  const shape = (x, y, width, height, button = false) => {
    const radius = Math.min(height * (button ? 0.5 : 20.9699 / 42), width / 2);
    const control = radius * (button ? 0.35 : 7.33947 / 20.9699);
    const right = x + width;
    const bottom = y + height;
    const middle = y + height / 2;
    const near = y + height * 0.175;
    const far = bottom - height * 0.175;
    return [
      `M${number(x)} ${number(middle)}`,
      `C${number(x)} ${number(far)} ${number(x + control)} ${number(bottom)} ${number(x + radius)} ${number(bottom)}`,
      `H${number(right - radius)}`,
      `C${number(right - control)} ${number(bottom)} ${number(right)} ${number(far)} ${number(right)} ${number(middle)}`,
      `C${number(right)} ${number(near)} ${number(right - control)} ${number(y)} ${number(right - radius)} ${number(y)}`,
      `H${number(x + radius)}`,
      `C${number(x + control)} ${number(y)} ${number(x)} ${number(near)} ${number(x)} ${number(middle)}Z`,
    ].join('');
  };

  const resize = (width, height) => {
    if (width <= 1 || height <= 1) return;
    layers.forEach(svg => svg.setAttribute('viewBox', `0 0 ${number(width)} ${number(height)}`));
    fills.forEach(path => path.setAttribute('d', shape(0, 0, width, height)));
    outerOutline.setAttribute('d', shape(0.5, 0.5, width - 1, height - 1));
    const inset = parseFloat(getComputedStyle(field).getPropertyValue('--submit-inset'));
    const size = height - 2 * inset;
    const left = width - inset - size;
    buttonFill.setAttribute('d', shape(left, inset, size, size, true));
    buttonOutline.setAttribute('d', shape(left + 0.5, inset + 0.5, size - 1, size - 1, true));
  };

  new ResizeObserver(entries => {
    const { width, height } = entries[0].contentRect;
    resize(width, height);
  }).observe(field);
  const { width, height } = field.getBoundingClientRect();
  resize(width, height);
}

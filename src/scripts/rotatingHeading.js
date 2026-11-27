export function initRotatingHeading(getHeadings, isInteractionPaused) {
  const heading = document.querySelector('[data-heading]');
  const phrase = document.querySelector('[data-rotating-title]');
  const mobile = window.matchMedia('(max-width: 767px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let phraseIndex = mobile.matches ? 1 : 0;
  let typingTimeout;
  let transitionTimeout;
  let letters = [];

  const isPaused = () => document.hidden || reducedMotion.matches || isInteractionPaused();
  const showAllLetters = () => {
    window.clearTimeout(typingTimeout);
    letters.forEach(letter => letter.classList.add('is-visible'));
  };

  const render = (animate = true) => {
    window.clearTimeout(transitionTimeout);
    window.clearTimeout(typingTimeout);
    phrase.classList.remove('is-changing');
    const headings = getHeadings();
    heading.setAttribute('aria-label', `${headings.join('. ')}.`);
    const fragment = document.createDocumentFragment();
    letters = [];
    headings[phraseIndex].split(' ').forEach((word, wordIndex) => {
      if (wordIndex) fragment.append(' ');
      const wordElement = document.createElement('span');
      wordElement.className = 'hero__word';
      Array.from(word).forEach(character => {
        const letter = document.createElement('span');
        letter.className = 'hero__letter';
        letter.textContent = character;
        wordElement.append(letter);
        letters.push(letter);
      });
      fragment.append(wordElement);
    });
    phrase.replaceChildren(fragment);

    if (!animate || isPaused()) {
      showAllLetters();
      return;
    }
    let letterIndex = 0;
    const typeNextLetter = () => {
      if (isPaused()) {
        showAllLetters();
        return;
      }
      letters[letterIndex].classList.add('is-visible');
      letterIndex += 1;
      if (letterIndex < letters.length) typingTimeout = window.setTimeout(typeNextLetter, 95);
    };
    typingTimeout = window.setTimeout(typeNextLetter, 95);
  };

  mobile.addEventListener('change', () => {
    phraseIndex = mobile.matches ? 1 : 0;
    render();
  });
  reducedMotion.addEventListener('change', () => render(false));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) render(false);
  });
  window.setInterval(() => {
    if (isPaused()) return;
    phrase.classList.add('is-changing');
    transitionTimeout = window.setTimeout(() => {
      if (isPaused()) {
        render(false);
        return;
      }
      phraseIndex = (phraseIndex + 1) % getHeadings().length;
      render();
    }, 250);
  }, 5000);

  return { reset: () => render() };
}

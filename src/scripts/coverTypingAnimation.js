import {
  getCoverTypingPhrases,
  LANGUAGE_CHANGE_EVENT,
} from "@/scripts/languageSelection";

export const setCoverTypingAnimation = function () {
  const typingText = document.getElementById("coverTypingText");

  if (!typingText) {
    return;
  }

  const TYPE_DELAY = 95;
  const ERASE_DELAY = 55;
  const HOLD_DELAY = 1200;

  let phraseIndex = 0;
  let charIndex = 0;
  let isErasing = false;
  let timer = null;

  const schedule = (delay) => {
    timer = setTimeout(tick, delay);
  };

  const resetTyping = () => {
    clearTimeout(timer);
    phraseIndex = 0;
    charIndex = 0;
    isErasing = false;
    typingText.textContent = "";
    schedule(TYPE_DELAY);
  };

  const tick = () => {
    const phrases = getCoverTypingPhrases();
    const phrase = phrases[phraseIndex];
    typingText.textContent = phrase.slice(0, charIndex);

    if (!isErasing && charIndex < phrase.length) {
      charIndex++;
      schedule(TYPE_DELAY);
      return;
    }

    if (!isErasing) {
      isErasing = true;
      schedule(HOLD_DELAY);
      return;
    }

    if (charIndex > 0) {
      charIndex--;
      schedule(ERASE_DELAY);
      return;
    }

    isErasing = false;
    phraseIndex = (phraseIndex + 1) % phrases.length;
    schedule(TYPE_DELAY);
  };

  document.addEventListener(LANGUAGE_CHANGE_EVENT, resetTyping);
  tick();
};

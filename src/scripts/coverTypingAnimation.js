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
  const ERASE_DELAY = 90;
  const ERASE_END_DELAY = 200;
  const HOLD_DELAY = 1200;

  let phraseIndex = 0;
  let charIndex = 0;
  let fadeIndex = 0;
  let phase = "typing";
  let timer = null;
  let renderedPhrase = "";

  const schedule = (delay) => {
    timer = setTimeout(tick, delay);
  };

  const renderPhrase = (phrase) => {
    if (renderedPhrase === phrase) {
      return;
    }

    renderedPhrase = phrase;
    typingText.textContent = "";

    phrase.split("").forEach((char) => {
      const charNode = document.createElement("span");
      charNode.className = "section-cover__typing-char";
      charNode.textContent = char === " " ? "\u00a0" : char;
      typingText.appendChild(charNode);
    });
  };

  const setVisibleChars = (isCharVisible) => {
    Array.from(typingText.children).forEach((charNode, index) => {
      charNode.classList.toggle(
        "section-cover__typing-char_visible",
        isCharVisible(index),
      );
    });
  };
  const resetTyping = () => {
    clearTimeout(timer);
    phraseIndex = 0;
    charIndex = 0;
    fadeIndex = 0;
    phase = "typing";
    renderedPhrase = "";
    typingText.textContent = "";
    typingText.classList.remove("section-cover__typing-text_erasing");
    schedule(TYPE_DELAY);
  };

  const tick = () => {
    const phrases = getCoverTypingPhrases();
    const phrase = phrases[phraseIndex];
    renderPhrase(phrase);

    if (phase === "typing") {
      typingText.classList.remove("section-cover__typing-text_erasing");
      setVisibleChars((index) => index < charIndex);

      if (charIndex >= phrase.length) {
        phase = "erasing";
        fadeIndex = 0;
        schedule(HOLD_DELAY);
        return;
      }

      charIndex++;
      schedule(TYPE_DELAY);
      return;
    }

    typingText.classList.add("section-cover__typing-text_erasing");

    if (fadeIndex < phrase.length) {
      fadeIndex++;
      setVisibleChars((index) => index >= fadeIndex);
      schedule(fadeIndex === phrase.length ? ERASE_END_DELAY : ERASE_DELAY);
      return;
    }

    phase = "typing";
    phraseIndex = (phraseIndex + 1) % phrases.length;
    charIndex = 0;
    fadeIndex = 0;
    renderedPhrase = "";
    typingText.classList.remove("section-cover__typing-text_erasing");
    schedule(TYPE_DELAY);
  };

  document.addEventListener(LANGUAGE_CHANGE_EVENT, resetTyping);
  tick();
};

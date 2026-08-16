import {
  getScrollAnimationTextSteps,
  LANGUAGE_CHANGE_EVENT,
} from "@/scripts/languageSelection";

export let refreshSizes = function () {
  //reainitiated later, do not remove
};

export const setScrollingAnimations = function () {
  const NUMBER_OF_BLOCKS = 5;
  const COUNTER_RATIO = 0.65;
  const TEXT_TYPE_DELAY = 28;
  const TEXT_PHASE_DELAY = 800;
  const TEXT_EXIT_DURATION = 850;
  const DIGIT_TRANSITION_DURATION = 650;
  const TEXT_STEP_CHANGE_EVENT = "buncher:text-step-change";

  const measure100vh = document.querySelector(".section-footer");
  const scrollRoot = document.getElementById("custom-scrollbar");
  const blocks = document.querySelectorAll(".trackable");
  let counterIsActive = false;
  let currentDigit = 1;
  let zeroTransitionTimer = null;
  let zeroIsVisible = false;
  const animateZeroVisibility = (isVisible) => {
    const counterBlock = document.getElementById("counter");

    if (zeroIsVisible === isVisible) {
      return;
    }

    zeroIsVisible = isVisible;
    clearTimeout(zeroTransitionTimer);
    counterBlock.classList.remove(
      "section-main__counter-block_zero-entering",
      "section-main__counter-block_zero-exiting",
      "section-main__counter-block_zero-visible",
      "section-main__counter-block_zero-hidden",
    );
    counterBlock.classList.add(
      isVisible
        ? "section-main__counter-block_zero-entering"
        : "section-main__counter-block_zero-exiting",
    );

    zeroTransitionTimer = setTimeout(() => {
      counterBlock.classList.remove(
        "section-main__counter-block_zero-entering",
        "section-main__counter-block_zero-exiting",
      );
      counterBlock.classList.add(
        isVisible
          ? "section-main__counter-block_zero-visible"
          : "section-main__counter-block_zero-hidden",
      );
    }, DIGIT_TRANSITION_DURATION);
  };
  const dispatchTextStepChange = (stepIndex) => {
    document.dispatchEvent(
      new CustomEvent(TEXT_STEP_CHANGE_EVENT, {
        detail: { stepIndex },
      }),
    );
  };

  const addStyleWithPrefixes = function (element, styleName, value) {
    element.style.setProperty(`-webkit-${styleName}`, value);
    element.style.setProperty(`-moz-${styleName}`, value);
    element.style.setProperty(`-ms-${styleName}`, value);
    element.style.setProperty(`-o-${styleName}`, value);
    element.style.setProperty(styleName, value);
  };
  /* Side decoration animations temporarily disabled.
  let setMainCornerShown = function () {
    // initialized in createMainCornerAnimation
  };
  const setMainRightPlusShown = (isShown) => {
    document
      .querySelectorAll(
        ".section-main__decoration_plus-vert, .section-main__decoration_plus-hor",
      )
      .forEach((line) => {
        line.classList.toggle("section-main__decoration_plus-hidden", !isShown);
      });
  };
  const createMainCornerAnimation = function () {
    const EDGE_OFFSET = 18;
    const SIDE_OFFSET = 120;
    const ANIMATION_DURATION = 500;
    const horizontalLine = document.querySelector(
      ".decoration-line_hor_trackable",
    );
    const verticalLine = document.querySelector(
      ".decoration-line_vert_trackable",
    );

    let progress = 0;
    let targetProgress = 0;
    let frameId = null;
    let animationStart = 0;
    let startProgress = 0;

    const easeInOut = (value) =>
      value < 0.5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2;

    const applyProgress = (value) => {
      const lineSize = horizontalLine.offsetWidth;
      const startX = EDGE_OFFSET + lineSize;
      const startY = SIDE_OFFSET;
      const endX = SIDE_OFFSET;
      const endY = EDGE_OFFSET + lineSize;
      const radius = endX - startX;
      const revealPart = 0.32;
      const curvedProgress = easeInOut(value);
      const revealProgress = Math.min(curvedProgress / revealPart, 1);
      const arcProgress =
        curvedProgress <= revealPart
          ? 0
          : (curvedProgress - revealPart) / (1 - revealPart);
      const arcAngle = ((1 - arcProgress) * Math.PI) / 2;
      const movingTopX = startX + radius * Math.cos(arcAngle);
      const movingTopY = endY + radius * Math.sin(arcAngle);
      const lineAngle = -90 * (1 - arcProgress);

      horizontalLine.style.transform = "none";
      verticalLine.style.left = `${movingTopX}px`;
      verticalLine.style.bottom = `${movingTopY - lineSize}px`;
      verticalLine.style.transform = `rotate(${lineAngle}deg) scaleY(${revealProgress})`;
      verticalLine.style.opacity = revealProgress > 0.02 ? "1" : "0";
    };

    const step = (time) => {
      const elapsed = time - animationStart;
      const localProgress = Math.min(elapsed / ANIMATION_DURATION, 1);
      progress =
        startProgress +
        (targetProgress - startProgress) * easeInOut(localProgress);

      applyProgress(progress);

      if (localProgress < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    setMainCornerShown = (isShown) => {
      targetProgress = isShown ? 1 : 0;

      if (frameId) {
        cancelAnimationFrame(frameId);
      }

      startProgress = progress;
      animationStart = performance.now();
      frameId = requestAnimationFrame(step);
    };

    horizontalLine.style.left = `${EDGE_OFFSET}px`;
    horizontalLine.style.bottom = `${SIDE_OFFSET}px`;
    verticalLine.style.transformOrigin = "top center";
    applyProgress(progress);

    window.addEventListener("resize", () => {
      applyProgress(progress);
    });
  };
  */
  const createNumberIntersectionObserver = function (blocks) {
    const REGEX = /_\d+-\d+$/;
    const numberCont = document.getElementById("changing-number");
    const visibleBlocks = [];

    const settleNumberTransition = (event) => {
      const isEntering = event.animationName === "lcdDigitIn";
      const isExiting = event.animationName === "lcdDigitOut";

      if (!isEntering && !isExiting) {
        return;
      }

      const transition = numberCont.className.match(REGEX);
      if (!transition) {
        return;
      }

      const [from, to] = transition[0].slice(1).split("-").map(Number);
      const animatedDigit = numberCont.children[(isEntering ? to : from) - 1];

      if (
        from === to ||
        event.target !== animatedDigit ||
        (isEntering && to === 0) ||
        (isExiting && to !== 0)
      ) {
        return;
      }

      const settledDigit = isEntering ? to : 0;
      numberCont.className = numberCont.className.replace(
        REGEX,
        `_${settledDigit}-${settledDigit}`,
      );
    };

    const options = {
      root: scrollRoot,
      threshold: 0.5,
    };

    visibleBlocks.length = NUMBER_OF_BLOCKS;
    visibleBlocks.fill(false);
    numberCont.addEventListener("animationend", settleNumberTransition);

    let recount = true;
    const callback = (entries) => {
      entries.forEach((entry) => {
        if (!counterIsActive) {
          return;
        }

        const nextArrayIndex = Number(entry.target.dataset.num);
        const curArrayIndex = nextArrayIndex - 1;

        if (recount) {
          if (entry.isIntersecting) {
            visibleBlocks[curArrayIndex] = true;
            currentDigit = nextArrayIndex;
            numberCont.className = numberCont.className.replace(
              REGEX,
              `_0-${nextArrayIndex}`,
            );
            dispatchTextStepChange(nextArrayIndex - 1);
          }
          return;
        }

        if (nextArrayIndex === 1) {
          visibleBlocks[curArrayIndex] = entry.isIntersecting;
          return;
        }

        if (
          visibleBlocks[nextArrayIndex] === true ||
          (nextArrayIndex === NUMBER_OF_BLOCKS &&
            entry.target.getBoundingClientRect().top < 0)
        ) {
          return;
        }
        if (entry.isIntersecting) {
          visibleBlocks[curArrayIndex] = true;
          currentDigit = nextArrayIndex;
          numberCont.className = numberCont.className.replace(
            REGEX,
            `_${curArrayIndex}-${nextArrayIndex}`,
          );
          dispatchTextStepChange(nextArrayIndex - 1);
        } else {
          visibleBlocks[curArrayIndex] = false;
          currentDigit = curArrayIndex;
          numberCont.className = numberCont.className.replace(
            REGEX,
            `_${nextArrayIndex}-${curArrayIndex}`,
          );
          dispatchTextStepChange(curArrayIndex - 1);
        }
      });
      recount = false;
    };

    const observer = new IntersectionObserver(callback, options);

    blocks.forEach((block) => {
      observer.observe(block);
    });
  };
  const createPhoneAnimation = function (blocks) {
    const REGEX = /\d+-\d+$/;
    const ANCHORS_PER_ELEMENT = [1, 3, 2, 4, 2];
    const anchorElements = [];
    const insertAnchors = (elements, anchorsPerEl) => {
      const getAnchorContainer = (anchors, id) => {
        const anchorContainer = document.createElement("div");
        anchorContainer.classList.add("anchor", `anchor_${id}`);
        anchorContainer.append(...anchors);
        return anchorContainer;
      };
      const getAnchor = (containerId, anchorId, num) => {
        const anchor = document.createElement("div");
        anchor.dataset.num = num;
        anchor.dataset.id = `${containerId}-${anchorId}`;
        anchor.classList.add(
          `anchor__item`,
          `anchor__item_${containerId}-${anchorId}`,
        );
        return anchor;
      };

      let counter = 0;
      elements.forEach((el, ind) => {
        let anchors = [];
        for (let i = 0; i < anchorsPerEl[ind]; i++) {
          anchors[i] = getAnchor(ind, i, ++counter);
        }
        el.appendChild(getAnchorContainer(anchors, ind));
        anchorElements.push(anchors);
      });
      return anchorElements;
    };
    const createObserver = (anchors) => {
      const phone = document.getElementById("phone");
      const options = {
        root: scrollRoot,
        threshold: 0.5,
      };

      let first = true;
      const callback = (entries) => {
        entries.forEach((entry) => {
          const curNum = Number(entry.target.dataset.num);
          const prevNum = curNum - 1;

          if (first) {
            if (entry.isIntersecting) {
              phone.className = phone.className.replace(
                REGEX,
                anchors[prevNum].dataset.id,
              );
            }
            return;
          }

          //if intersection from above -> return
          const top = entry.target.getBoundingClientRect().top;
          if (top < measure100vh.clientHeight - top) {
            return;
          }

          if (entry.isIntersecting) {
            phone.className = phone.className.replace(
              REGEX,
              anchors[prevNum].dataset.id,
            );
          } else {
            phone.className = phone.className.replace(
              REGEX,
              anchors[prevNum - 1]?.dataset.id ?? "999-999",
            );
          }
        });
        first = false;
      };

      const observer = new IntersectionObserver(callback, options);

      anchors.forEach((el) => {
        observer.observe(el);
      });
    };

    insertAnchors(blocks, ANCHORS_PER_ELEMENT);
    createObserver(anchorElements.flat());
  };
  const createShuffleTextAnimation = function (blocks) {
    const mainSection = document.getElementById("section-main");
    const stage = mainSection.querySelector(".section-main__stage");
    const shuffleLayer = document.createElement("div");
    const shufflePanel = document.createElement("div");
    const lineNumbers = document.createElement("div");
    const lineNumberTrack = document.createElement("div");
    const divider = document.createElement("div");
    const codeArea = document.createElement("div");
    const shuffleText = document.createElement("h2");
    let textSteps = getScrollAnimationTextSteps();
    let activeStep = -1;
    let typingTimer = null;
    let hideTimer = null;
    let phraseCleanupTimer = null;
    let animationToken = 0;
    let activePhrase = null;
    let lastTextScrollTop = scrollRoot.scrollTop;
    let textScrollDirection = 1;

    shuffleLayer.classList.add("section-main__shuffle-layer");
    shufflePanel.classList.add("section-main__shuffle-panel");
    lineNumbers.classList.add("section-main__shuffle-line-numbers");
    lineNumberTrack.classList.add("section-main__shuffle-line-number-track");
    divider.classList.add("section-main__shuffle-divider");
    codeArea.classList.add("section-main__shuffle-code");
    lineNumberTrack.append(
      ...Array.from({ length: textSteps.length * 5 + 1 }, (_, index) => {
        const lineNumber = document.createElement("span");
        lineNumber.textContent = index + 1;
        return lineNumber;
      }),
    );
    lineNumbers.append(lineNumberTrack);
    shuffleText.classList.add(
      "section-main__shuffle-text",
      "section-main__shuffle-text_first-entry",
    );
    codeArea.appendChild(shuffleText);
    shufflePanel.append(lineNumbers, divider, codeArea);
    shuffleLayer.appendChild(shufflePanel);
    stage.appendChild(shuffleLayer);

    const updatePanelScale = () => {
      const layoutScale = Math.min(
        scrollRoot.clientWidth / 1980,
        scrollRoot.clientHeight / 960,
      );
      const layoutLeft =
        (scrollRoot.clientWidth - 1980 * layoutScale) / 2 +
        100 * layoutScale;

      shufflePanel.style.setProperty("--shuffle-layout-scale", layoutScale);
      shufflePanel.style.setProperty("--shuffle-layout-left", `${layoutLeft}px`);
    };

    window.addEventListener("resize", updatePanelScale);
    scrollRoot.addEventListener(
      "scroll",
      () => {
        const nextScrollTop = scrollRoot.scrollTop;
        if (nextScrollTop !== lastTextScrollTop) {
          textScrollDirection = Math.sign(nextScrollTop - lastTextScrollTop);
          lastTextScrollTop = nextScrollTop;
        }
      },
      { passive: true },
    );
    updatePanelScale();

    const isHighlighted = (ranges, index) =>
      ranges.some((range) => index >= range.start && index < range.end);
    const getShuffleAlphabet = (text) => {
      return [
        ...new Set(
          [...text.toLowerCase()].filter((char) => /[a-zа-яё]/i.test(char)),
        ),
      ];
    };

    const getRandomLetter = (alphabet) =>
      alphabet[Math.floor(Math.random() * alphabet.length)];

    const getShuffleChar = (char, alphabet) =>
      /[a-zа-яё]/i.test(char) && alphabet.length
        ? getRandomLetter(alphabet)
        : char;

    const render = (stepIndex, shouldShuffle) => {
      const step = textSteps[stepIndex];
      const ranges = highlightRanges[stepIndex];

      const shuffleAlphabet = getShuffleAlphabet(step.text);

      let word = null;

      const closeWord = () => {
        word = null;
      };
      const addSpace = () => {
        closeWord();
        shuffleText.appendChild(document.createTextNode(" "));
      };
      const addLineBreak = () => {
        closeWord();
        shuffleText.appendChild(document.createElement("br"));
      };
      const addLetter = (char, index) => {
        if (!word) {
          word = document.createElement("span");
          word.classList.add("section-main__shuffle-word");
          shuffleText.appendChild(word);
        }

        const letter = document.createElement("span");
        letter.classList.add("section-main__shuffle-letter");
        if (isHighlighted(ranges, index)) {
          letter.classList.add("section-main__shuffle-letter_highlight");
        }
        letter.textContent = shouldShuffle
          ? getShuffleChar(char, shuffleAlphabet)
          : char;
        word.appendChild(letter);
      };

      shuffleText.replaceChildren();
      [...step.text].forEach((char, index) => {
        if (char === "\n") {
          addLineBreak();
          return;
        }
        if (char === " ") {
          addSpace();
          return;
        }

        addLetter(char, index);
      });
    };
    const isLetter = (character) => /\p{L}/u.test(character);
    const isIndexInRanges = (ranges, index) =>
      ranges.some((range) => index >= range.start && index < range.end);
    const createShuffleSymbols = (text) => {
      const letters = [...text].filter(isLetter);
      const uniqueLetters = [...new Set(letters)];

      return uniqueLetters.length ? uniqueLetters : [...text].filter(Boolean);
    };
    const getTextMeasurer = (phraseElement) => {
      const styles = getComputedStyle(phraseElement);
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      context.font = `${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;

      return (text) => context.measureText(text).width;
    };
    const wrapLine = (line, maxWidth, measureText) => {
      const words = line.trim().split(/\s+/);
      const lines = [];
      let currentLine = "";

      words.forEach((word) => {
        const nextLine = currentLine ? `${currentLine} ${word}` : word;

        if (!currentLine || measureText(nextLine) <= maxWidth) {
          currentLine = nextLine;
          return;
        }

        lines.push(currentLine);
        currentLine = word;
      });

      if (currentLine) {
        lines.push(currentLine);
      }

      return lines.length ? lines : [line];
    };
    const wrapLineToCount = (line, lineCount, maxWidth, measureText) => {
      const words = line.trim().split(/\s+/);

      if (words.length < lineCount) {
        return wrapLine(line, maxWidth, measureText);
      }

      let bestLayout = null;
      let bestScore = Infinity;
      const visitLayouts = (startIndex, linesLeft, lines, widths) => {
        if (linesLeft === 1) {
          const lastLine = words.slice(startIndex).join(" ");
          const layout = [...lines, lastLine];
          const layoutWidths = [...widths, measureText(lastLine)];
          const widestLine = Math.max(...layoutWidths);
          const averageWidth =
            layoutWidths.reduce((sum, width) => sum + width, 0) / lineCount;
          const unevenness = layoutWidths.reduce(
            (sum, width) => sum + Math.pow(width - averageWidth, 2),
            0,
          );
          const overflow = layoutWidths.reduce(
            (sum, width) => sum + Math.max(width - maxWidth, 0),
            0,
          );
          const score = overflow * 1000 + widestLine + unevenness * 0.001;

          if (score < bestScore) {
            bestScore = score;
            bestLayout = layout;
          }
          return;
        }

        const lastEndIndex = words.length - linesLeft + 1;
        for (let endIndex = startIndex + 1; endIndex <= lastEndIndex; endIndex++) {
          const nextLine = words.slice(startIndex, endIndex).join(" ");
          visitLayouts(
            endIndex,
            linesLeft - 1,
            [...lines, nextLine],
            [...widths, measureText(nextLine)],
          );
        }
      };

      visitLayouts(0, lineCount, [], []);
      return bestLayout ?? wrapLine(line, maxWidth, measureText);
    };
    const capitalizeFirstLetter = (text) =>
      text.replace(/\p{L}/u, (letter) => letter.toLocaleUpperCase("ru"));
    const wrapPhraseText = (phraseElement, text) => {
      const maxWidth = phraseElement.clientWidth;
      const capitalizedText = capitalizeFirstLetter(text);

      if (!maxWidth) {
        return capitalizedText;
      }

      const measureText = getTextMeasurer(phraseElement);
      const sourceLines = capitalizedText.split("\n");

      return sourceLines
        .flatMap((line) =>
          sourceLines.length === 1
            ? wrapLineToCount(line, 4, maxWidth, measureText)
            : wrapLine(line, maxWidth, measureText),
        )
        .join("\n");
    };
    const createHighlightRanges = (phraseElement, phrase) => {
      const layoutText = wrapPhraseText(phraseElement, phrase.text);
      const highlights = Array.isArray(phrase.highlight)
        ? phrase.highlight
        : [phrase.highlight];
      const lowerLayoutText = layoutText.toLocaleLowerCase("ru");

      return highlights
        .filter(Boolean)
        .map((highlight) => {
          const start = lowerLayoutText.indexOf(
            highlight.toLocaleLowerCase("ru"),
          );

          return start < 0
            ? null
            : {
                start,
                end: start + highlight.length,
              };
        })
        .filter(Boolean);
    };
    const createLineCharacterGroups = (text) => {
      const lines = [];
      let line = [];

      [...text].forEach((character, index) => {
        if (character === "\n") {
          if (line.length) {
            lines.push(line);
          }
          line = [];
          return;
        }

        if (character !== " ") {
          line.push(index);
        }
      });

      if (line.length) {
        lines.push(line);
      }

      return lines;
    };
    const isSyncCharacterRevealed = (index, progress, lineGroups) => {
      const lineIndex = lineGroups.findIndex((line) => line.includes(index));
      const line = lineGroups[lineIndex];

      if (!line) {
        return true;
      }

      const characterPosition = line.indexOf(index);
      return progress >= (characterPosition + 1) / line.length;
    };
    const createAnimationAccentIndexes = (text, progress, excludedRanges) => {
      const words = [];
      let word = [];

      [...text].forEach((character, index) => {
        if (isLetter(character)) {
          word.push(index);
          return;
        }

        if (word.length) {
          words.push(word);
          word = [];
        }
      });

      if (word.length) {
        words.push(word);
      }

      const position = Math.min(5, Math.floor(progress * 6));

      return new Set(
        words
          .map((letters, wordIndex) => {
            const offset = (position + wordIndex * 2) % letters.length;
            return letters[offset];
          })
          .filter((index) => !isIndexInRanges(excludedRanges, index)),
      );
    };
    const appendHighlightedPhrase = (phraseElement, displayText, ranges) => {
      const fragment = document.createDocumentFragment();

      [...displayText].forEach((character, index) => {
        if (!isIndexInRanges(ranges, index)) {
          fragment.append(character);
          return;
        }

        const element = document.createElement("span");
        element.className = "section-main__shuffle-letter_highlight";
        element.textContent = character;
        fragment.append(element);
      });

      phraseElement.replaceChildren(fragment);
    };
    const renderPhrase = (
      phraseElement,
      displayText,
      phrase,
      accentIndexes = null,
      revealedIndexes = null,
    ) => {
      const highlightRanges = createHighlightRanges(phraseElement, phrase);

      if (!accentIndexes) {
        appendHighlightedPhrase(phraseElement, displayText, highlightRanges);
        return;
      }

      const fragment = document.createDocumentFragment();

      [...displayText].forEach((character, index) => {
        const isHighlight =
          isIndexInRanges(highlightRanges, index) && revealedIndexes.has(index);
        const isAccent = accentIndexes.has(index);

        if (!isHighlight && !isAccent) {
          fragment.append(character);
          return;
        }

        const element = document.createElement("span");
        element.className = isHighlight
          ? "section-main__shuffle-letter_highlight"
          : "section-main__shuffle-letter_accent";
        element.textContent = character;
        fragment.append(element);
      });

      phraseElement.replaceChildren(fragment);
    };
    const animateSyncText = (phraseElement, phrase, onComplete = () => {}) => {
      animationToken++;
      const currentToken = animationToken;
      const nextText = wrapPhraseText(phraseElement, phrase.text);
      const symbols = createShuffleSymbols(phrase.text);
      const startedAt = performance.now();
      const lineGroups = createLineCharacterGroups(nextText);
      const highlightRanges = createHighlightRanges(phraseElement, phrase);
      const settledHighlightIndexes = new Set();

      if (shuffleFrame) {
        cancelAnimationFrame(shuffleFrame);
      }

      const frame = (now) => {
        if (currentToken !== animationToken) {
          return;
        }

        const progress = Math.min((now - startedAt) / SHUFFLE_DURATION, 1);
        const revealedIndexes = new Set();
        const animatedText = [...nextText]
          .map((character, index) => {
            if (character === " " || character === "\n") {
              return character;
            }

            const isInHighlight = isIndexInRanges(highlightRanges, index);
            const isRevealed = isSyncCharacterRevealed(
              index,
              progress,
              lineGroups,
            );

            if (isInHighlight && isRevealed) {
              settledHighlightIndexes.add(index);
            }

            if (isRevealed || settledHighlightIndexes.has(index)) {
              revealedIndexes.add(index);
              return character;
            }

            return symbols[Math.floor(Math.random() * symbols.length)];
          })
          .join("");

        const accentIndexes = createAnimationAccentIndexes(
          nextText,
          progress,
          highlightRanges,
        );
        const activeAccentIndexes = new Set(
          [...accentIndexes].filter((index) => !revealedIndexes.has(index)),
        );

        renderPhrase(
          phraseElement,
          animatedText,
          phrase,
          activeAccentIndexes,
          revealedIndexes,
        );

        if (progress < 1) {
          shuffleFrame = requestAnimationFrame(frame);
          return;
        }

        renderPhrase(phraseElement, nextText, phrase);
        onComplete();
      };

      frame(performance.now());
    };
    const createTypedPhrase = (phrase) => {
      const phraseElement = document.createElement("span");
      const syntaxStart = document.createElement("span");
      const syntaxEnd = document.createElement("span");
      const layoutText = wrapPhraseText(shuffleText, phrase.text);
      const ranges = createHighlightRanges(shuffleText, phrase);
      let characterIndex = 0;

      phraseElement.className = "section-main__shuffle-phrase";
      syntaxStart.className = "section-main__shuffle-phrase-syntax";
      syntaxEnd.className = "section-main__shuffle-phrase-syntax";
      syntaxStart.textContent = "*{";
      syntaxEnd.textContent = "}";
      phraseElement.appendChild(syntaxStart);
      layoutText.split("\n").forEach((lineText, lineIndex) => {
        const line = document.createElement("span");
        line.className = "section-main__shuffle-line";
        line.style.setProperty("--line-index", lineIndex);

        [...lineText].forEach((character) => {
          const letter = document.createElement("span");
          letter.className = "section-main__shuffle-letter";
          if (isIndexInRanges(ranges, characterIndex)) {
            letter.classList.add("section-main__shuffle-letter_highlight");
          }
          letter.textContent = character === " " ? "\u00a0" : character;
          line.appendChild(letter);
          characterIndex++;
        });

        phraseElement.appendChild(line);
        characterIndex++;
      });
      phraseElement.appendChild(syntaxEnd);

      return phraseElement;
    };
    const typePhrase = (phrase, stepIndex) => {
      animationToken++;
      const currentToken = animationToken;
      const phraseElement = createTypedPhrase(phrase);
      const letters = Array.from(
        phraseElement.querySelectorAll(".section-main__shuffle-letter"),
      );
      let letterIndex = 0;

      clearTimeout(typingTimer);
      codeArea.classList.remove("section-main__shuffle-code_transitioning");
      phraseElement.dataset.step = stepIndex;
      shuffleText.appendChild(phraseElement);
      activePhrase = phraseElement;
      requestAnimationFrame(() => {
        phraseElement.classList.add("section-main__shuffle-phrase_active");
      });

      const revealNextLetter = () => {
        if (currentToken !== animationToken) {
          return;
        }

        letters[letterIndex]?.classList.add(
          "section-main__shuffle-letter_visible",
        );
        letterIndex++;
        if (letterIndex < letters.length) {
          typingTimer = setTimeout(revealNextLetter, TEXT_TYPE_DELAY);
        }
      };

      revealNextLetter();
    };
    const moveLineNumbers = (stepIndex) => {
      lineNumberTrack.style.transform = `translateY(${-stepIndex * 5 * 58}px)`;
    };
    const setStep = (stepIndex, forceRender = false) => {
      const nextStep = Math.max(0, Math.min(textSteps.length - 1, stepIndex));
      if (nextStep === activeStep && !forceRender) {
        return;
      }
      if (
        !forceRender &&
        activeStep !== -1 &&
        ((textScrollDirection > 0 && nextStep < activeStep) ||
          (textScrollDirection < 0 && nextStep > activeStep))
      ) {
        return;
      }

      const previousStep = activeStep;
      const outgoingPhrase = activePhrase;
      activeStep = nextStep;
      clearTimeout(hideTimer);
      clearTimeout(typingTimer);
      clearTimeout(phraseCleanupTimer);
      animationToken++;

      shuffleText
        .querySelectorAll(".section-main__shuffle-phrase")
        .forEach((phraseElement) => {
          if (phraseElement !== outgoingPhrase) {
            phraseElement.remove();
          }
        });

      if (outgoingPhrase) {
        const outgoingStep = Number(outgoingPhrase.dataset.step);
        const stepDistance = Number.isFinite(outgoingStep)
          ? nextStep - outgoingStep
          : nextStep - previousStep;

        outgoingPhrase.classList.remove(
          "section-main__shuffle-phrase_exit-up",
          "section-main__shuffle-phrase_exit-down",
        );
        outgoingPhrase.style.setProperty(
          "--shuffle-phrase-shift",
          `${-stepDistance * 5 * 58}px`,
        );
        outgoingPhrase.classList.add(
          nextStep >= previousStep
            ? "section-main__shuffle-phrase_exit-up"
            : "section-main__shuffle-phrase_exit-down",
        );
        codeArea.classList.add("section-main__shuffle-code_transitioning");
        phraseCleanupTimer = setTimeout(() => {
          outgoingPhrase.remove();
        }, TEXT_EXIT_DURATION);
      }

      moveLineNumbers(nextStep);
      typingTimer = setTimeout(
        () => typePhrase(textSteps[nextStep], nextStep),
        outgoingPhrase ? TEXT_PHASE_DELAY : 0,
      );
      shufflePanel.classList.add("section-main__shuffle-panel_visible");
      shuffleText.classList.add("section-main__shuffle-text_visible");
    };
    const hideText = () => {
      activeStep = -1;
      animationToken++;
      clearTimeout(typingTimer);
      clearTimeout(phraseCleanupTimer);
      activePhrase = null;
      codeArea.classList.remove("section-main__shuffle-code_transitioning");
      shufflePanel.classList.remove("section-main__shuffle-panel_visible");
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        if (activeStep === -1) {
          shuffleText.classList.remove("section-main__shuffle-text_visible");
          shuffleText.replaceChildren();
        }
      }, TEXT_EXIT_DURATION);
    };
    const updateTextLanguage = () => {
      textSteps = getScrollAnimationTextSteps();
      if (activeStep !== -1) {
        setStep(activeStep, true);
      }
    };
    const updateActiveStepFromNumber = (event) => {
      const { stepIndex } = event.detail;

      if (stepIndex < 0) {
        hideText();
        return;
      }

      setStep(stepIndex);
    };

    document.addEventListener(
      TEXT_STEP_CHANGE_EVENT,
      updateActiveStepFromNumber,
    );
    document.addEventListener(LANGUAGE_CHANGE_EVENT, updateTextLanguage);
  };
  const createMainIntersectionObserver = function () {
    const NUMBER_CLASS_REGEX = /_\d+-\d+$/;
    const coverSection = document.querySelector(".section-cover");
    const counterActiveZone = document.getElementById(
      "section-main__counter-active-zone",
    );
    const mainSection = document.getElementById("section-main");
    const footerSection = document.getElementById("section-footer");
    const longDecorationLine = document.getElementById("decoration-line-long");
    const counterBlock = document.getElementById("counter");
    const numberCont = document.getElementById("changing-number");
    const shuffleText = document.querySelector(".section-main__shuffle-text");
    const contentBlock = document.getElementById("section-main__content-block");
    let counterHideTimer = null;
    const options = {
      root: scrollRoot,
      threshold: 0,
    };
    const updateCounterActivationPoint = () => {
      const nextPhoneStateAnchor = document.querySelector(
        ".anchor__item_1-0",
      );

      if (!nextPhoneStateAnchor) {
        return;
      }

      const mainRect = mainSection.getBoundingClientRect();
      const anchorRect = nextPhoneStateAnchor.getBoundingClientRect();

      counterActiveZone.style.top = `${anchorRect.top - mainRect.top + anchorRect.height / 2}px`;
    };

    const callback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          counterIsActive = true;

          clearTimeout(counterHideTimer);
          numberCont.className = numberCont.className.replace(
            NUMBER_CLASS_REGEX,
            `_0-${currentDigit}`,
          );
          // coverSection.classList.add("section-cover_scrolled");
          // longDecorationLine.classList.add(
          //   "section-main__decoration_long_hidden",
          // );
          counterBlock.classList.add("section-main__counter-block_shown");
          animateZeroVisibility(true);
          shuffleText.classList.remove(
            "section-main__shuffle-text_first-entry",
          );
          dispatchTextStepChange(currentDigit - 1);
          contentBlock.classList.add("section-main__content-block_shown");
          if (footerSection.getBoundingClientRect().top < window.innerHeight) {
            return;
          }
          // setMainCornerShown(true);
          // setMainRightPlusShown(true);
        } else {
          counterIsActive = false;
          counterBlock.classList.remove(
            "section-main__counter-block_digits-waiting",
          );

          animateZeroVisibility(false);
          numberCont.className = numberCont.className.replace(
            NUMBER_CLASS_REGEX,
            `_${currentDigit}-0`,
          );
          // coverSection.classList.remove("section-cover_scrolled");
          // longDecorationLine.classList.remove(
          //   "section-main__decoration_long_hidden",
          // );
          clearTimeout(counterHideTimer);
          counterHideTimer = setTimeout(() => {
            counterBlock.classList.remove("section-main__counter-block_shown");
          }, DIGIT_TRANSITION_DURATION);
          contentBlock.classList.remove("section-main__content-block_shown");
          dispatchTextStepChange(-1);
          // setMainCornerShown(false);
          // setMainRightPlusShown(false);
        }
      });
    };

    const observer = new IntersectionObserver(callback, options);
    updateCounterActivationPoint();
    window.addEventListener("resize", updateCounterActivationPoint);
    observer.observe(counterActiveZone);
  };
  const createCounterBoundaryFade = function () {
    const APPEAR_FADE_DISTANCE_IN_VIEWPORTS = 0.3;
    const DISAPPEAR_FADE_DISTANCE_IN_VIEWPORTS = 0.9;
    const mainSection = document.getElementById("section-main");
    const counterBlock = document.getElementById("counter");
    const shuffleLayer = document.querySelector(
      ".section-main__shuffle-layer",
    );
    let frameId = null;
    let lastScrollTop = scrollRoot.scrollTop;
    let isScrollingDown = true;

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const updateOpacity = () => {
      frameId = null;
      const rootRect = scrollRoot.getBoundingClientRect();
      const sectionRect = mainSection.getBoundingClientRect();
      const sectionTop =
        scrollRoot.scrollTop + sectionRect.top - rootRect.top;
      const localScroll = scrollRoot.scrollTop - sectionTop;
      if (scrollRoot.scrollTop !== lastScrollTop) {
        isScrollingDown = scrollRoot.scrollTop > lastScrollTop;
        lastScrollTop = scrollRoot.scrollTop;
      }
      const stickyDistance = Math.max(
        mainSection.offsetHeight - scrollRoot.clientHeight,
        0,
      );
      const entryFadeDistance = Math.max(
        scrollRoot.clientHeight *
          (isScrollingDown
            ? APPEAR_FADE_DISTANCE_IN_VIEWPORTS
            : DISAPPEAR_FADE_DISTANCE_IN_VIEWPORTS),
        1,
      );
      const exitFadeDistance = Math.max(
        scrollRoot.clientHeight *
          (isScrollingDown
            ? DISAPPEAR_FADE_DISTANCE_IN_VIEWPORTS
            : APPEAR_FADE_DISTANCE_IN_VIEWPORTS),
        1,
      );
      const entryOpacity = localScroll / entryFadeDistance;
      const exitOpacity =
        (stickyDistance - localScroll) / exitFadeDistance;
      const opacity = clamp(Math.min(entryOpacity, exitOpacity), 0, 1);
      const textOpacity =
        currentDigit === NUMBER_OF_BLOCKS ? opacity : 1;

      counterBlock.style.setProperty("--counter-boundary-opacity", opacity);
      shuffleLayer.style.setProperty(
        "--shuffle-boundary-opacity",
        textOpacity,
      );
    };
    const requestOpacityUpdate = () => {
      if (!frameId) {
        frameId = requestAnimationFrame(updateOpacity);
      }
    };

    scrollRoot.addEventListener("scroll", requestOpacityUpdate, {
      passive: true,
    });
    window.addEventListener("resize", requestOpacityUpdate);
    updateOpacity();
  };
  const createEndIntersectionObserver = function () {
    const endBlock = document.getElementById("section-footer");
    const options = {
      root: scrollRoot,
      threshold: 0.1,
    };

    const callback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          endBlock.classList.add("section-footer_shown");
        } else {
          endBlock.classList.remove("section-footer_shown");
        }
      });
    };

    const observer = new IntersectionObserver(callback, options);
    observer.observe(endBlock);
  };
  const setNewScreenProps = function () {
    const textContainer = document.getElementById(
      "section-main__text-container",
    );
    const contentContainer = document.getElementById(
      "section-main__content-block",
    );
    const phone = document.getElementById("phone");
    const counter = document.getElementById("counter");
    const wrapper = document.getElementById("main-wrapper");
    // const arrowEl = document.querySelector(".section-main__arrow-block");
    const footerSection = document.getElementById("section-footer");
    const footerContainer = footerSection.querySelector(
      ".section-footer__footer-container",
    );
    const socialContainer = footerContainer.querySelector(
      ".section-footer__socials-container",
    );
    const centerPhone = () => {
      const scrollRootRect = scrollRoot.getBoundingClientRect();
      const wrapperRect = wrapper.getBoundingClientRect();
      const phoneBaseLeft = wrapperRect.left + contentContainer.offsetLeft;
      const viewportCenter = scrollRootRect.left + scrollRoot.clientWidth / 2;
      const phoneXOffset =
        viewportCenter - (phoneBaseLeft + contentContainer.offsetWidth / 2);

      contentContainer.style.setProperty(
        "--phone-x-offset",
        `${phoneXOffset}px`,
      );
    };

    const changeSmallerSocialsPosition = () => {
      if (socialContainer.parentNode === footerContainer) {
        socialContainer.classList.add(
          "section-footer__socials-container_mobile",
        );
        footerContainer.removeChild(socialContainer);
        footerSection.appendChild(socialContainer);
      }
    };
    const changeBiggerSocialsPosition = () => {
      if (socialContainer.parentNode === footerSection) {
        socialContainer.classList.remove(
          "section-footer__socials-container_mobile",
        );
        footerSection.removeChild(socialContainer);
        footerContainer.appendChild(socialContainer);
      }
    };
    const setSmallerScreenStyles = () => {
      textContainer.classList.add("section-main__text-container_small"); //must be executed first!
      requestAnimationFrame(() => {
        const gap_between_numbers = measure100vh.clientHeight * 0.1;
        const halfGap = gap_between_numbers * 0.5;
        const rect = contentContainer.getBoundingClientRect();
        const visibleSize = measure100vh.clientHeight - rect.height;
        const textContainerSize = visibleSize * (NUMBER_OF_BLOCKS + 1.4); //+1.4 as we have pseudo-elements;
        // addStyleWithPrefixes(
        //   arrowEl,
        //   "mask-size",
        //   `${rect.right - rect.width * 0.24}px`,
        // );
        wrapper.style.paddingBottom = "0";
        wrapper.style.height = "100%";
        textContainer.style.minHeight = `${textContainerSize}px`;

        centerPhone();
        const phoneRect = phone.getBoundingClientRect();
        const counterBottom = visibleSize - halfGap;
        let counterWidth = window.innerWidth - phoneRect.right + 8;

        if (
          measure100vh.clientHeight -
            (gap_between_numbers +
              counterBottom +
              counterWidth / COUNTER_RATIO) <
          20
        ) {
          counterWidth =
            (measure100vh.clientHeight -
              gap_between_numbers -
              counterBottom -
              20) *
            COUNTER_RATIO;
        }

        counter.style.width = `${counterWidth}px`;
        counter.style.height = `${counterWidth / COUNTER_RATIO}px`;
        counter.style.maxWidth = "";
        counter.style.maxHeight = "";
        counter.style.paddingTop = "";
        counter.style.paddingBottom = "";
        counter.style.paddingLeft = "";
        counter.style.removeProperty("--counter-shown-right");
        counter.style.removeProperty("--counter-scale");
        counter.style.top = "auto";
        counter.style.bottom = `${counterBottom}px`;
      });
    };
    const setBiggerScreenStyles = () => {
      textContainer.classList.remove("section-main__text-container_small"); //must be executed first!
      // addStyleWithPrefixes(arrowEl, "mask-size", "unset");
      wrapper.style.paddingBottom = "0";
      wrapper.style.height = `auto`;
      textContainer.style.minHeight = `100vh`;

      requestAnimationFrame(() => {
        const counterHost = document.querySelector(
          ".section-main__decoration-container",
        );
        const counterHostRect = counterHost.getBoundingClientRect();
        const counterBaseWidth = 1920;
        const counterBaseHeight = 960;
        const digitTop = -56;
        const digitHeight = 1027;
        const counterScale = Math.min(
          counterHostRect.width / counterBaseWidth,
          counterHostRect.height / counterBaseHeight,
        );
        const extraHeight = Math.max(
          counterHostRect.height - counterBaseHeight * counterScale,
          0,
        );
        const topOverflow = Math.max(-digitTop * counterScale, 0);
        const bottomOverflow = Math.max(
          (digitTop + digitHeight - counterBaseHeight) * counterScale,
          0,
        );
        const totalOverflow = topOverflow + bottomOverflow;
        const counterTopOffset =
          extraHeight <= totalOverflow
            ? extraHeight * (topOverflow / totalOverflow)
            : topOverflow + (extraHeight - totalOverflow) / 2;

        counter.style.width = `${counterBaseWidth}px`;
        counter.style.height = `${counterBaseHeight}px`;
        counter.style.maxWidth = `${counterBaseWidth}px`;
        counter.style.maxHeight = `${counterBaseHeight}px`;
        counter.style.paddingTop = "0";
        counter.style.paddingBottom = "0";
        counter.style.paddingLeft = "0";
        counter.style.top = `${counterTopOffset}px`;
        counter.style.bottom = `auto`;
        counter.style.setProperty("--counter-scale", counterScale);
        counter.style.setProperty("--counter-shown-right", "0px");
        centerPhone();
      });
    };
    const changeMode = () => {
      if (window.innerWidth <= 600 || window.innerWidth < window.innerHeight) {
        setSmallerScreenStyles();
        changeSmallerSocialsPosition();
      } else {
        setBiggerScreenStyles();
        changeBiggerSocialsPosition();
      }
    };
    window.addEventListener("resize", () => {
      setTimeout(changeMode, 250);
    });
    requestAnimationFrame(changeMode);
    return changeMode;
  };

  refreshSizes = setNewScreenProps();
  createNumberIntersectionObserver(blocks);
  createPhoneAnimation(blocks);
  createShuffleTextAnimation(blocks);
  // createMainCornerAnimation();
  createCounterBoundaryFade();
  createMainIntersectionObserver();
  createEndIntersectionObserver();
};

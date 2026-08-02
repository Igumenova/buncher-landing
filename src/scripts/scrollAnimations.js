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
  const SHUFFLE_FRAMES = 12;
  const SHUFFLE_FRAME_DELAY = 50;

  const measure100vh = document.querySelector(".section-footer");
  const blocks = document.querySelectorAll(".trackable");

  const addStyleWithPrefixes = function (element, styleName, value) {
    element.style.setProperty(`-webkit-${styleName}`, value);
    element.style.setProperty(`-moz-${styleName}`, value);
    element.style.setProperty(`-ms-${styleName}`, value);
    element.style.setProperty(`-o-${styleName}`, value);
    element.style.setProperty(styleName, value);
  };
  const createNumberIntersectionObserver = function (blocks) {
    const REGEX = /_\d+-\d+$/;
    const numberCont = document.getElementById("changing-number");
    const visibleBlocks = [];

    const options = {
      root: null,
      threshold: 0.5,
    };

    visibleBlocks.length = NUMBER_OF_BLOCKS;
    visibleBlocks.fill(false);

    let recount = true;
    const callback = (entries) => {
      entries.forEach((entry) => {
        const nextArrayIndex = Number(entry.target.dataset.num);
        const curArrayIndex = nextArrayIndex - 1;

        if (recount) {
          if (entry.isIntersecting) {
            visibleBlocks[curArrayIndex] = true;
            numberCont.className = numberCont.className.replace(
              REGEX,
              `_${nextArrayIndex}-${nextArrayIndex}`,
            );
          }
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
          numberCont.className = numberCont.className.replace(
            REGEX,
            `_${curArrayIndex}-${nextArrayIndex}`,
          );
        } else {
          visibleBlocks[curArrayIndex] = false;
          numberCont.className = numberCont.className.replace(
            REGEX,
            `_${nextArrayIndex}-${curArrayIndex}`,
          );
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
        root: null,
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
    const shuffleLayer = document.createElement("div");
    const shuffleText = document.createElement("h2");
    const getHighlightRanges = (steps) => steps.map((step) => {
      return step.highlight.reduce((ranges, word) => {
        const start = step.text.toLowerCase().indexOf(word.toLowerCase());
        if (start !== -1) {
          ranges.push({
            start,
            end: start + word.length,
          });
        }
        return ranges;
      }, []);
    });
    let textSteps = getScrollAnimationTextSteps();
    let highlightRanges = getHighlightRanges(textSteps);
    let activeStep = -1;
    let shuffleTimer = null;
    const visibleSteps = [];

    shuffleLayer.classList.add("section-main__shuffle-layer");
    shuffleText.classList.add("section-main__shuffle-text");
    shuffleLayer.appendChild(shuffleText);
    mainSection.appendChild(shuffleLayer);

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
    const setStep = (stepIndex, forceRender = false) => {
      const nextStep = Math.max(0, Math.min(textSteps.length - 1, stepIndex));
      if (nextStep === activeStep && !forceRender) {
        return;
      }

      activeStep = nextStep;
      shuffleText.classList.add("section-main__shuffle-text_visible");
      clearInterval(shuffleTimer);
      let frame = 0;
      render(nextStep, true);
      shuffleTimer = setInterval(() => {
        frame++;
        if (frame >= SHUFFLE_FRAMES) {
          clearInterval(shuffleTimer);
          render(nextStep, false);
          return;
        }
        render(nextStep, true);
      }, SHUFFLE_FRAME_DELAY);
    };
    const hideText = () => {
      activeStep = -1;
      clearInterval(shuffleTimer);
      shuffleText.replaceChildren();
      shuffleText.classList.remove("section-main__shuffle-text_visible");
    };
    const updateTextLanguage = () => {
      textSteps = getScrollAnimationTextSteps();
      highlightRanges = getHighlightRanges(textSteps);
      if (activeStep !== -1) {
        setStep(activeStep, true);
      }
    };
    const updateActiveStep = () => {
      const activeEntry = visibleSteps
        .map((isVisible, index) => {
          if (!isVisible) {
            return null;
          }

          const rect = blocks[index].getBoundingClientRect();
          const blockCenter = rect.top + rect.height / 2;
          const viewportCenter = window.innerHeight / 2;
          return {
            index,
            distance: Math.abs(blockCenter - viewportCenter),
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.distance - b.distance)[0];

      if (!activeEntry) {
        hideText();
        return;
      }

      setStep(activeEntry.index);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visibleSteps[Number(entry.target.dataset.num) - 1] =
            entry.isIntersecting;
        });
        updateActiveStep();
      },
      {
        root: null,
        threshold: 0.45,
      },
    );

    visibleSteps.length = blocks.length;
    visibleSteps.fill(false);
    blocks.forEach((block) => {
      observer.observe(block);
    });
    document.addEventListener(LANGUAGE_CHANGE_EVENT, updateTextLanguage);
  };
  const createMainIntersectionObserver = function () {
    const mainSection = document.getElementById("section-main");
    const longDecorationLine = document.getElementById("decoration-line-long");
    const counterBlock = document.getElementById("counter");
    const options = {
      root: null,
      threshold: 0.05,
    };

    const callback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          longDecorationLine.classList.add(
            "section-main__decoration_long_hidden",
          );
          counterBlock.classList.add("section-main__counter-block_shown");
        } else {
          longDecorationLine.classList.remove(
            "section-main__decoration_long_hidden",
          );
          counterBlock.classList.remove("section-main__counter-block_shown");
        }
      });
    };

    const observer = new IntersectionObserver(callback, options);
    observer.observe(mainSection);
  };
  const createEndIntersectionObserver = function () {
    const endBlock = document.getElementById("section-footer");
    const decorativeLine = document.querySelector(
      ".decoration-line_hor_trackable",
    );
    const decorativeMask = document.querySelector(
      ".section-main__mask_trackable ",
    );

    const options = {
      root: null,
      threshold: 0.1,
    };

    const callback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          decorativeLine.classList.add("section-main__decoration_hor_hidden");
          decorativeMask.classList.add("section-main__mask_hidden");
          decorativeMask.classList.add("section-main__mask_animated");
        } else {
          decorativeLine.classList.remove(
            "section-main__decoration_hor_hidden",
          );
          decorativeMask.classList.remove("section-main__mask_hidden");
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
    const arrowEl = document.querySelector(".section-main__arrow-block");
    const footerSection = document.getElementById("section-footer");
    const footerContainer = footerSection.querySelector(
      ".section-footer__footer-container",
    );
    const socialContainer = footerContainer.querySelector(
      ".section-footer__socials-container",
    );

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
        addStyleWithPrefixes(
          arrowEl,
          "mask-size",
          `${rect.right - rect.width * 0.24}px`,
        );
        wrapper.style.paddingBottom = `${visibleSize}px`;
        wrapper.style.height = `${rect.height + textContainerSize}px`;
        textContainer.style.minHeight = `${textContainerSize}px`;

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
        counter.style.top = "auto";
        counter.style.bottom = `${counterBottom}px`;
      });
    };
    const setBiggerScreenStyles = () => {
      textContainer.classList.remove("section-main__text-container_small"); //must be executed first!
      addStyleWithPrefixes(arrowEl, "mask-size", "unset");
      wrapper.style.paddingBottom = "0";
      wrapper.style.height = `auto`;
      textContainer.style.minHeight = `100vh`;

      requestAnimationFrame(() => {
        const gap_between_numbers = measure100vh.clientHeight * 0.1;
        const rect = contentContainer.getBoundingClientRect();
        const phoneRect = phone.getBoundingClientRect();
        let counterWidth = window.innerWidth - phoneRect.right + 10;
        const counterTop = phoneRect.top - rect.top - gap_between_numbers * 0.5;
        counter.style.width = `${counterWidth}px`;
        counter.style.height = `${counterWidth / COUNTER_RATIO}px`;
        counter.style.top = `${counterTop}px`;
        counter.style.bottom = `auto`;
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
  createMainIntersectionObserver();
  createEndIntersectionObserver();
};

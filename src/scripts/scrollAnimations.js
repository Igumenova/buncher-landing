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
  const PHASE_TRANSITION_DURATION = 500;
  const DIGIT_TRANSITION_DURATION = PHASE_TRANSITION_DURATION;
  const TEXT_EXIT_DURATION = PHASE_TRANSITION_DURATION;
  const INTRO_SEARCH_TRANSITION_DURATION = 500;
  const INTRO_SEARCH_SCROLL_GAP = 500;
  const WHEEL_GESTURE_END_DELAY = 120;
  const WHEEL_GESTURE_RESTART_MIN_AGE = 250;
  const WHEEL_GESTURE_RESTART_DELTA = 16;
  const WHEEL_GESTURE_RESTART_RATIO = 2.5;
  const WHEEL_INPUT_LOCK_MAX_DURATION = 3000;
  const FIRST_STAGE_GESTURE_END_DELAY = 180;
  const FIRST_SCREEN_FADE_DURATION = 120;
  const FIRST_SCREEN_SWAP_PAUSE_DURATION = 35;
  const INTRO_LOGO_REVEAL_DELAY = 200;
  const FIRST_STAGE_DIGIT_STAGGER_DELAY = 140;
  const FIRST_STAGE_VISUAL_TRANSITION_DURATION = 400;
  const REVERSE_WHEEL_SCROLL_MULTIPLIER = 2;
  const TEXT_PHASE_HOLD_SCROLL_DISTANCE = 200;
  const TEXT_STEP_CHANGE_EVENT = "buncher:text-step-change";
  const TEXT_TYPING_START_EVENT = "buncher:text-typing-start";
  const TEXT_TYPING_MIDPOINT_EVENT = "buncher:text-typing-midpoint";
  const TEXT_TYPING_COMPLETE_EVENT = "buncher:text-typing-complete";
  const PHONE_REVERSE_STEP_EVENT = "buncher:phone-reverse-step";
  const PHONE_REVERSE_CANCEL_EVENT = "buncher:phone-reverse-cancel";
  const INTRO_LOGO_VISIBILITY_EVENT = "buncher:intro-logo-visibility";
  const INTRO_SCAFFOLD_VISIBILITY_EVENT = "buncher:intro-scaffold-visibility";
  const INTRO_SEQUENCE_RESET_EVENT = "buncher:intro-sequence-reset";
  const FIRST_STAGE_DIGIT_SHOW_EVENT = "buncher:first-stage-digit-show";
  const FIRST_STAGE_DIGIT_HIDE_EVENT = "buncher:first-stage-digit-hide";
  const STAGE_CHANGE_POINT = 0.72;
  const PHONE_STATE_TEXT_STEPS = {
    "1-0": 0,
    "1-1": 0,
    "1-2": 1,
    "2-0": 1,
    "2-1": 2,
    "3-0": 2,
    "3-1": 2,
    "3-2": 3,
    "3-3": 3,
    "4-0": 3,
    "4-1": 4,
  };

  const measure100vh = document.querySelector(".section-footer");
  const scrollRoot = document.getElementById("custom-scrollbar");
  // Phase gestures belong to the viewport, not to whichever visual layer is
  // currently under the pointer. The actual scroll position still lives on
  // scrollRoot, while window guarantees identical wheel handling everywhere.
  const wheelEventTarget = window;
  const wheelGestureIds = new WeakMap();
  const wheelGestureStarts = new WeakMap();
  let introForwardWheelHandler = null;
  let introReverseWheelHandler = null;
  let reverseWheelHandler = null;
  let introReverseNativeScrollGestureId = null;
  let introReverseNativeScrollIsActive = false;
  let currentWheelGestureId = 0;
  let wheelGestureIsActive = false;
  let wheelGestureEndTimer = null;
  let wheelGestureStartedAt = 0;
  let wheelGestureDirection = 0;
  let previousWheelDelta = 0;
  let previousWheelDeltaY = 0;
  let oppositeWheelDirection = 0;
  let oppositeWheelDistance = 0;
  let oppositeWheelEventCount = 0;
  let wheelInputLock = null;
  let wheelInputLockTimer = null;
  let scrollDebugSequence = 0;
  let flushTypingProgress = null;
  let advanceTypingByWheel = null;
  let handleTypingWheelInput = null;
  let resetFirstStageTypingPosition = null;
  const scrollDebugBuffer = [];
  const logScrollDebug = (type, detail = {}) => {
    const activePhrase = document.querySelector(
      ".section-main__shuffle-phrase_active",
    );
    const visibleTextLetterCount = activePhrase?.querySelectorAll(
      ".section-main__shuffle-letter_visible",
    ).length;
    const totalTextLetterCount = activePhrase?.querySelectorAll(
      ".section-main__shuffle-letter",
    ).length;
    const entry = {
      sequence: ++scrollDebugSequence,
      time: Math.round(performance.now()),
      type,
      scrollTop: Math.round(scrollRoot.scrollTop),
      phoneState:
        document.getElementById("phone")?.className.match(/\d+-\d+$/)?.[0] ??
        null,
      digitState:
        document
          .getElementById("changing-number")
          ?.className.match(/_\d+-\d+$/)?.[0] ?? null,
      textStep: activePhrase?.dataset.step ?? null,
      visibleTextLetterCount: visibleTextLetterCount ?? 0,
      totalTextLetterCount: totalTextLetterCount ?? 0,
      ...detail,
    };

    scrollDebugBuffer.push(entry);
    if (scrollDebugBuffer.length > 500) {
      scrollDebugBuffer.shift();
    }
    console.info("[Buncher scroll]", JSON.stringify(entry));
  };

  window.__buncherScrollDebug = scrollDebugBuffer;
  window.getBuncherScrollDebug = () =>
    JSON.parse(JSON.stringify(scrollDebugBuffer));
  window.clearBuncherScrollDebug = () => {
    scrollDebugBuffer.length = 0;
    scrollDebugSequence = 0;
  };
  const getWheelGestureId = (event) =>
    wheelGestureIds.get(event) ?? currentWheelGestureId;
  const isWheelGestureStart = (event) => wheelGestureStarts.get(event) === true;
  const startIntroReverseNativeScroll = (gestureId) => {
    introReverseNativeScrollIsActive = true;
    introReverseNativeScrollGestureId = gestureId;
  };
  const stopIntroReverseNativeScroll = () => {
    introReverseNativeScrollIsActive = false;
    introReverseNativeScrollGestureId = null;
  };

  const releaseWheelInputIfReady = (
    nextGestureId = null,
    { allowActiveGesture = false } = {},
  ) => {
    const nextGestureHasStarted =
      nextGestureId !== null && wheelInputLock?.gestureId !== nextGestureId;
    // A touchpad momentum spike can be classified as a restarted gesture while
    // the screen-to-logo animation is finishing. Keep this boundary locked
    // until the input has actually gone quiet, then accept one fresh scroll.
    const introReverseMustReachIdle =
      wheelInputLock?.owner === "intro-screen-to-logo";
    if (
      !wheelInputLock ||
      !wheelInputLock.animationComplete ||
      (wheelGestureIsActive &&
        (introReverseMustReachIdle || !nextGestureHasStarted) &&
        !allowActiveGesture)
    ) {
      return;
    }

    logScrollDebug("wheel-input-unlocked", {
      owner: wheelInputLock.owner,
      gestureId: wheelInputLock.gestureId,
    });
    clearTimeout(wheelInputLockTimer);
    wheelInputLockTimer = null;
    wheelInputLock = null;
  };
  const lockWheelInput = (owner) => {
    if (wheelInputLock) {
      logScrollDebug("wheel-input-lock-skipped", {
        requestedOwner: owner,
        activeOwner: wheelInputLock.owner,
        gestureId: currentWheelGestureId,
      });
      return false;
    }

    wheelInputLock = {
      owner,
      gestureId: currentWheelGestureId,
      animationComplete: false,
      continuationEventCount: 0,
    };
    logScrollDebug("wheel-input-locked", {
      owner,
      gestureId: currentWheelGestureId,
    });
    clearTimeout(wheelInputLockTimer);
    wheelInputLockTimer = setTimeout(() => {
      if (!wheelInputLock || wheelInputLock.owner !== owner) {
        return;
      }

      logScrollDebug("wheel-input-watchdog", {
        owner,
        gestureId: wheelInputLock.gestureId,
      });
      completeWheelInputTransition(owner);
    }, WHEEL_INPUT_LOCK_MAX_DURATION);
    return true;
  };
  const completeWheelInputTransition = (owner) => {
    if (!wheelInputLock || wheelInputLock.owner !== owner) {
      return;
    }

    wheelInputLock.animationComplete = true;
    clearTimeout(wheelInputLockTimer);
    wheelInputLockTimer = null;
    logScrollDebug("wheel-input-animation-complete", {
      owner,
      gestureId: wheelInputLock.gestureId,
    });
    releaseWheelInputIfReady();
  };
  const completeFirstStageWheelInputTransition = () => {
    if (!wheelInputLock?.owner.startsWith("first-stage-")) {
      return;
    }

    completeWheelInputTransition(wheelInputLock.owner);
  };
  const resetWheelInputLock = () => {
    if (wheelInputLock) {
      logScrollDebug("wheel-input-reset", {
        owner: wheelInputLock.owner,
        gestureId: wheelInputLock.gestureId,
      });
    }
    clearTimeout(wheelInputLockTimer);
    wheelInputLockTimer = null;
    wheelInputLock = null;
  };

  const trackWheelGesture = (event) => {
    const now = performance.now();
    const delta = Math.abs(event.deltaY);
    const eventDirection = Math.sign(event.deltaY);
    const opposesActiveGesture =
      eventDirection !== 0 &&
      wheelGestureIsActive &&
      wheelGestureDirection !== 0 &&
      eventDirection !== wheelGestureDirection;
    if (opposesActiveGesture) {
      if (oppositeWheelDirection !== eventDirection) {
        oppositeWheelDirection = eventDirection;
        oppositeWheelDistance = 0;
        oppositeWheelEventCount = 0;
      }
      oppositeWheelDistance += delta;
      oppositeWheelEventCount += 1;
    } else {
      oppositeWheelDirection = 0;
      oppositeWheelDistance = 0;
      oppositeWheelEventCount = 0;
    }

    const confirmsDirectionChange =
      opposesActiveGesture &&
      oppositeWheelEventCount >= 2 &&
      (oppositeWheelDistance >= WHEEL_GESTURE_RESTART_DELTA * 3 ||
        (now - wheelGestureStartedAt >= WHEEL_GESTURE_RESTART_MIN_AGE &&
          delta >= WHEEL_GESTURE_RESTART_DELTA &&
          delta >= previousWheelDelta * WHEEL_GESTURE_RESTART_RATIO));

    // Some mouse drivers emit an opposite-sign momentum tail during one fast
    // wheel movement. It is not a new user gesture: routing it as one used to
    // start reverse navigation while the forward transition was still active,
    // which could jump several phases and then snap back to phase one.
    // Keep the first direction latched until the gesture has actually gone
    // quiet, and suppress both routing and native scrolling for these tails.
    if (opposesActiveGesture && !confirmsDirectionChange) {
      wheelGestureIds.set(event, currentWheelGestureId);
      wheelGestureStarts.set(event, false);
      logScrollDebug("wheel-direction-tail-suppressed", {
        gestureId: currentWheelGestureId,
        gestureDirection: wheelGestureDirection,
        deltaY: event.deltaY,
        deltaMode: event.deltaMode,
        eventTimeStamp: Math.round(event.timeStamp),
      });

      clearTimeout(wheelGestureEndTimer);
      const endingGestureId = currentWheelGestureId;
      wheelGestureEndTimer = setTimeout(() => {
        wheelGestureIsActive = false;
        wheelGestureDirection = 0;
        previousWheelDelta = 0;
        previousWheelDeltaY = 0;
        oppositeWheelDirection = 0;
        oppositeWheelDistance = 0;
        oppositeWheelEventCount = 0;
        logScrollDebug("gesture-end", { gestureId: endingGestureId });
        releaseWheelInputIfReady();
      }, WHEEL_GESTURE_END_DELAY);
      return true;
    }

    const restartsFromInertia =
      event.deltaY !== 0 &&
      wheelGestureIsActive &&
      now - wheelGestureStartedAt >= WHEEL_GESTURE_RESTART_MIN_AGE &&
      delta >= WHEEL_GESTURE_RESTART_DELTA &&
      delta >= previousWheelDelta * WHEEL_GESTURE_RESTART_RATIO;
    const startsNewGesture =
      event.deltaY !== 0 &&
      (!wheelGestureIsActive || restartsFromInertia || confirmsDirectionChange);
    const newGestureReason = !startsNewGesture
      ? null
      : confirmsDirectionChange
        ? "direction-change"
        : restartsFromInertia
          ? "inertia-restart"
          : "idle";

    if (startsNewGesture) {
      currentWheelGestureId += 1;
      wheelGestureIsActive = true;
      wheelGestureStartedAt = now;
      wheelGestureDirection = eventDirection;
      oppositeWheelDirection = 0;
      oppositeWheelDistance = 0;
      oppositeWheelEventCount = 0;
      // Decaying momentum stays in the current gesture and remains blocked.
      // A renewed, clearly stronger impulse is treated as intentional input,
      // so continuous scrolling can proceed without requiring a full pause.
      releaseWheelInputIfReady(currentWheelGestureId);
    }

    wheelGestureIds.set(event, currentWheelGestureId);
    wheelGestureStarts.set(event, startsNewGesture);
    logScrollDebug("wheel", {
      gestureId: currentWheelGestureId,
      startsNewGesture,
      newGestureReason,
      deltaY: event.deltaY,
      deltaMode: event.deltaMode,
      wheelDeltaY: event.wheelDeltaY ?? null,
      eventTimeStamp: Math.round(event.timeStamp),
      targetTag: event.target?.tagName ?? null,
      targetId: event.target?.id || null,
      targetClass:
        typeof event.target?.className === "string"
          ? event.target.className
          : null,
    });
    if (event.deltaY !== 0) {
      previousWheelDelta = delta;
      previousWheelDeltaY = event.deltaY;
      clearTimeout(wheelGestureEndTimer);
      const endingGestureId = currentWheelGestureId;
      wheelGestureEndTimer = setTimeout(() => {
        wheelGestureIsActive = false;
        wheelGestureDirection = 0;
        previousWheelDelta = 0;
        previousWheelDeltaY = 0;
        oppositeWheelDirection = 0;
        oppositeWheelDistance = 0;
        oppositeWheelEventCount = 0;
        logScrollDebug("gesture-end", { gestureId: endingGestureId });
        releaseWheelInputIfReady();
      }, WHEEL_GESTURE_END_DELAY);
    }
    return false;
  };
  const blocks = document.querySelectorAll(".trackable");
  let counterIsActive = false;
  let currentDigit = 1;
  let footerReturnTextPending = false;
  let zeroTransitionTimer = null;
  let zeroIsVisible = false;
  let firstStageSequenceState = "idle";
  let firstStageReverseTextTimer = null;
  let firstStageSequenceTimer = null;
  let firstStageForwardScreenTimer = null;
  let firstStageReverseScreenTimer = null;
  let firstStageScaffoldGestureTimer = null;
  let firstStageScaffoldGestureReady = false;
  let firstStageLastActionGestureId = null;
  let firstStagePinnedScrollTop = null;
  let phaseTransitionInputTimer = null;
  let reverseNavigationInputTimer = null;
  let completedTextStep = -1;
  let midpointTextStep = -1;
  let textTypingCompletionGestureId = null;
  let firstStageVisualSequenceLockOwner = null;
  const firstStageOwnsPinnedScrollPosition = () =>
    [
      "forward-screen",
      "forward-wait-scaffold",
      "forward-scaffold",
      "forward-wait-digit",
      "forward-digit",
      "forward-wait-text",
      "forward-phone",
      "reverse-phone",
      "reverse-wait-text",
      "reverse-text",
      "reverse-wait-digit",
      "reverse-digit",
      "reverse-wait-scaffold",
      "reverse-scaffold",
    ].includes(firstStageSequenceState);

  const waitForNextFirstStageGesture = () => {
    firstStageScaffoldGestureReady = false;
    clearTimeout(firstStageScaffoldGestureTimer);
    firstStageScaffoldGestureTimer = setTimeout(() => {
      firstStageScaffoldGestureReady = true;
    }, FIRST_STAGE_GESTURE_END_DELAY);
  };

  const scheduleFirstStageSequenceState = (
    expectedState,
    nextState,
    delay,
    inputLockOwner = null,
  ) => {
    clearTimeout(firstStageSequenceTimer);
    firstStageSequenceTimer = setTimeout(() => {
      if (firstStageSequenceState === expectedState) {
        firstStageSequenceState = nextState;
        if (inputLockOwner) {
          completeWheelInputTransition(inputLockOwner);
        }
        logScrollDebug("first-stage-step-ready", {
          firstStageSequenceState,
          firstStageLastActionGestureId,
          source: "fallback-timer",
        });
      }
    }, delay);
  };

  const getWheelDeltaInPixels = (event) => {
    if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
      return event.deltaY * 16;
    }

    if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
      return event.deltaY * scrollRoot.clientHeight;
    }

    return event.deltaY;
  };

  const getDigitForCurrentScroll = () => {
    const rootRect = scrollRoot.getBoundingClientRect();
    const viewportCenter = rootRect.top + scrollRoot.clientHeight / 2;
    let nextDigit = 1;

    blocks.forEach((block, index) => {
      if (index === 0) {
        return;
      }

      const blockRect = block.getBoundingClientRect();
      const stageMarker =
        blockRect.top +
        blockRect.height * STAGE_CHANGE_POINT +
        TEXT_PHASE_HOLD_SCROLL_DISTANCE;

      if (stageMarker <= viewportCenter) {
        nextDigit = index + 1;
      }
    });

    return nextDigit;
  };
  const getDigitBoundaryScrollTop = (nextDigit) => {
    const block = blocks[nextDigit - 1];
    if (!block || nextDigit <= 1) {
      return 0;
    }

    const getDocumentOffsetTop = (element) => {
      let offsetTop = 0;
      let currentElement = element;

      while (currentElement) {
        offsetTop += currentElement.offsetTop;
        currentElement = currentElement.offsetParent;
      }

      return offsetTop;
    };
    const blockOffsetTop =
      getDocumentOffsetTop(block) - getDocumentOffsetTop(scrollRoot);
    return (
      blockOffsetTop +
      block.offsetHeight * STAGE_CHANGE_POINT +
      TEXT_PHASE_HOLD_SCROLL_DISTANCE -
      scrollRoot.clientHeight / 2
    );
  };
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
      "section-main__counter-block_zero-scroll-controlled",
      "section-main__counter-block_zero-visible",
      "section-main__counter-block_zero-hidden",
    );
    counterBlock.classList.add(
      `section-main__counter-block_zero-${isVisible ? "entering" : "exiting"}`,
    );

    zeroTransitionTimer = setTimeout(() => {
      if (!isVisible) {
        const numberCont = document.getElementById("changing-number");
        const transition = numberCont.className.match(/_(\d+)-(\d+)$/);

        // Commit the hidden digit before removing firstDigitFadeOut from the
        // number window. Otherwise the special 1-0 rule can briefly restore
        // digit 1 until the scaffold exit finishes and settles it later.
        if (transition?.[2] === "0") {
          numberCont.className = numberCont.className.replace(
            /_\d+-\d+$/,
            "_0-0",
          );
        }
      }

      counterBlock.classList.remove(
        "section-main__counter-block_zero-entering",
        "section-main__counter-block_zero-exiting",
      );
      counterBlock.classList.add(
        isVisible
          ? "section-main__counter-block_zero-visible"
          : "section-main__counter-block_zero-hidden",
      );
      zeroTransitionTimer = null;
    }, FIRST_STAGE_VISUAL_TRANSITION_DURATION);
  };
  const hideActiveNumberDigit = () => {
    const numberCont = document.getElementById("changing-number");
    const transition = numberCont.className.match(/_(\d+)-(\d+)$/);

    if (!transition) {
      return;
    }

    const [, fromDigit, toDigit] = transition.map(Number);

    // Do not restart the 1 -> 0 fade after it has already finished. Several
    // observers can reach the intro boundary during the same reverse pass.
    if (toDigit === 0) {
      return;
    }

    const visibleDigit = toDigit || fromDigit || currentDigit;
    numberCont.className = numberCont.className.replace(
      /_\d+-\d+$/,
      `_${visibleDigit}-0`,
    );
  };
  const settleFirstStageDigitHidden = () => {
    const counterBlock = document.getElementById("counter");
    const numberCont = document.getElementById("changing-number");

    clearTimeout(zeroTransitionTimer);
    zeroTransitionTimer = null;
    zeroIsVisible = false;
    counterBlock.classList.remove(
      "section-main__counter-block_zero-entering",
      "section-main__counter-block_zero-exiting",
      "section-main__counter-block_zero-scroll-controlled",
      "section-main__counter-block_zero-visible",
    );
    counterBlock.classList.add("section-main__counter-block_zero-hidden");
    numberCont.className = numberCont.className.replace(/_\d+-\d+$/, "_0-0");
  };
  const dispatchTextStepChange = (stepIndex, transitionOptions = {}) => {
    document.dispatchEvent(
      new CustomEvent(TEXT_STEP_CHANGE_EVENT, {
        detail: { stepIndex, ...transitionOptions },
      }),
    );
  };
  const finishFirstStageReverseVisualSequence = () => {
    if (firstStageSequenceState !== "reverse-scaffold") {
      return;
    }

    clearTimeout(firstStageSequenceTimer);
    settleFirstStageDigitHidden();
    firstStageSequenceState = "reverse-complete";
    completeWheelInputTransition(firstStageVisualSequenceLockOwner);
    firstStageVisualSequenceLockOwner = null;
    logScrollDebug("first-stage-reverse-visuals-complete", {
      firstStageLastActionGestureId,
    });
    document.dispatchEvent(
      new CustomEvent(PHONE_REVERSE_STEP_EVENT, {
        detail: { state: "0-0" },
      }),
    );
  };
  const startFirstStageScaffoldOutSequence = () => {
    if (firstStageSequenceState !== "reverse-digit") {
      return;
    }

    clearTimeout(firstStageSequenceTimer);
    firstStageSequenceState = "reverse-scaffold";
    logScrollDebug("first-stage-scaffold-reverse-start", {
      gestureId: firstStageLastActionGestureId,
      source: "visual-sequence",
    });
    document.dispatchEvent(
      new CustomEvent(INTRO_SCAFFOLD_VISIBILITY_EVENT, {
        detail: { visible: false },
      }),
    );
    firstStageSequenceTimer = setTimeout(
      finishFirstStageReverseVisualSequence,
      FIRST_STAGE_VISUAL_TRANSITION_DURATION + 100,
    );
  };
  const startFirstStageDigitOutSequence = (gestureId) => {
    firstStageLastActionGestureId = gestureId;
    firstStageSequenceState = "reverse-digit";
    firstStageVisualSequenceLockOwner = "first-stage-visuals-out";
    lockWheelInput(firstStageVisualSequenceLockOwner);
    logScrollDebug("first-stage-digit-reverse-start", {
      gestureId,
      source: "visual-sequence",
    });
    document.dispatchEvent(new Event(FIRST_STAGE_DIGIT_HIDE_EVENT));
    clearTimeout(firstStageSequenceTimer);
    firstStageSequenceTimer = setTimeout(() => {
      if (firstStageSequenceState === "reverse-digit") {
        startFirstStageScaffoldOutSequence();
      }
    }, FIRST_STAGE_DIGIT_STAGGER_DELAY);
  };
  const startFirstStageDigitInSequence = () => {
    if (firstStageSequenceState !== "forward-scaffold") {
      return;
    }

    clearTimeout(firstStageSequenceTimer);
    firstStageSequenceState = "forward-digit";
    logScrollDebug("first-stage-digit-start", {
      gestureId: firstStageLastActionGestureId,
      source: "visual-sequence",
    });
    document.dispatchEvent(new Event(FIRST_STAGE_DIGIT_SHOW_EVENT));
    clearTimeout(firstStageSequenceTimer);
    firstStageSequenceTimer = setTimeout(() => {
      if (firstStageSequenceState === "forward-digit") {
        firstStageSequenceState = "forward-wait-text";
        completeWheelInputTransition(firstStageVisualSequenceLockOwner);
        firstStageVisualSequenceLockOwner = null;
        logScrollDebug("first-stage-step-ready", {
          firstStageSequenceState,
          firstStageLastActionGestureId,
          source: "fallback-timer",
        });
      }
    }, FIRST_STAGE_VISUAL_TRANSITION_DURATION + 100);
  };
  const startFirstStageScaffoldInSequence = (gestureId, inputLockOwner) => {
    firstStageLastActionGestureId = gestureId;
    firstStageVisualSequenceLockOwner = inputLockOwner;
    firstStageSequenceState = "forward-scaffold";
    logScrollDebug("first-stage-scaffold-start", {
      gestureId,
      source: "visual-sequence",
    });
    document.dispatchEvent(
      new CustomEvent(INTRO_SCAFFOLD_VISIBILITY_EVENT, {
        detail: { visible: true, force: true },
      }),
    );
    clearTimeout(firstStageSequenceTimer);
    firstStageSequenceTimer = setTimeout(() => {
      if (firstStageSequenceState === "forward-scaffold") {
        startFirstStageDigitInSequence();
      }
    }, FIRST_STAGE_DIGIT_STAGGER_DELAY);
  };
  const startFirstStageTextOutSequence = (
    gestureId,
    { inputLockOwner = "first-stage-text-out", lockInput = true } = {},
  ) => {
    firstStageLastActionGestureId = gestureId;
    firstStageSequenceState = "reverse-text";
    if (lockInput) {
      lockWheelInput(inputLockOwner);
    }
    resetFirstStageTypingPosition?.();
    dispatchTextStepChange(-1, {
      boundary: "search",
      direction: -1,
    });
    clearTimeout(firstStageReverseTextTimer);
    firstStageReverseTextTimer = setTimeout(() => {
      if (firstStageSequenceState === "reverse-text") {
        firstStageSequenceState = "reverse-wait-digit";
        completeWheelInputTransition(inputLockOwner);
        logScrollDebug("first-stage-step-ready", {
          firstStageSequenceState,
          firstStageLastActionGestureId,
          source: "reverse-text-timer",
        });
      }
    }, TEXT_EXIT_DURATION);
  };
  const firstStageTextIsFullyRendered = () => {
    const activePhrase = document.querySelector(
      '.section-main__shuffle-phrase_active[data-step="0"]',
    );
    const letters = activePhrase?.querySelectorAll(
      ".section-main__shuffle-letter",
    );

    return (
      activePhrase !== null &&
      letters.length > 0 &&
      Array.from(letters).every((letter) =>
        letter.classList.contains("section-main__shuffle-letter_visible"),
      )
    );
  };
  const handleFirstStageSequenceWheel = (event) => {
    if (
      event.ctrlKey ||
      event.target.closest(".modal-window_shown") ||
      event.deltaY === 0
    ) {
      return;
    }
    const gestureId = getWheelGestureId(event);
    const currentGestureAlreadyUsed =
      firstStageLastActionGestureId === gestureId;
    const currentGestureIsStart = isWheelGestureStart(event);

    if (
      scrollRoot.scrollTop <= 1 &&
      (firstStageSequenceState !== "idle" ||
        scrollRoot.dataset.introReverseSequence === "active")
    ) {
      document.dispatchEvent(new Event(INTRO_SEQUENCE_RESET_EVENT));
    }

    const renderedPhoneState = document
      .getElementById("phone")
      ?.className.match(/\d+-\d+$/)?.[0];

    // The logo controller owns both intro phone states. A stale phase-1 state
    // must never consume its wheel event before that controller sees it.
    if (renderedPhoneState === "999-999" || renderedPhoneState === "0-0") {
      return;
    }

    if (event.deltaY > 0) {
      if (
        firstStageSequenceState === "active" &&
        currentDigit === 1 &&
        completedTextStep < 0 &&
        firstStageTextIsFullyRendered()
      ) {
        // Returning from phase 2 can restore every letter before the typing
        // controller updates its completion marker. Treat the rendered text
        // as complete so forward input can leave phase 1 again.
        completedTextStep = 0;
        midpointTextStep = Math.max(midpointTextStep, 0);
      }

      if (firstStageSequenceState === "forward-screen") {
        event.preventDefault();
        return;
      }

      if (firstStageSequenceState === "forward-wait-scaffold") {
        event.preventDefault();
        if (
          !firstStageScaffoldGestureReady ||
          !currentGestureIsStart ||
          currentGestureAlreadyUsed
        ) {
          logScrollDebug("first-stage-step-hold", {
            gestureId,
            firstStageLastActionGestureId,
            firstStageSequenceState,
            reason: currentGestureAlreadyUsed
              ? "gesture-already-used"
              : !currentGestureIsStart
                ? "gesture-tail"
                : "step-not-ready",
          });
          return;
        }
        lockWheelInput("first-stage-visuals-in");
        startFirstStageScaffoldInSequence(
          gestureId,
          "first-stage-visuals-in",
        );
        return;
      }

      if (
        firstStageSequenceState === "reverse-phone" ||
        firstStageSequenceState === "reverse-wait-text"
      ) {
        event.preventDefault();
        if (!currentGestureIsStart || currentGestureAlreadyUsed) {
          return;
        }

        firstStageLastActionGestureId = gestureId;
        clearTimeout(firstStageSequenceTimer);
        firstStageSequenceState = "forward-phone";
        lockWheelInput("first-stage-phone-in");
        document.dispatchEvent(
          new CustomEvent(PHONE_REVERSE_STEP_EVENT, {
            detail: { state: "1-1" },
          }),
        );
        scheduleFirstStageSequenceState(
          "forward-phone",
          "active",
          PHASE_TRANSITION_DURATION + 100,
          "first-stage-phone-in",
        );
        return;
      }

      if (
        firstStageSequenceState === "reverse-text" ||
        firstStageSequenceState === "reverse-wait-digit"
      ) {
        event.preventDefault();
        if (!currentGestureIsStart || currentGestureAlreadyUsed) {
          return;
        }
        firstStageLastActionGestureId = gestureId;
        clearTimeout(firstStageReverseTextTimer);
        clearTimeout(firstStageSequenceTimer);
        firstStageSequenceState = "active";
        dispatchTextStepChange(0, {
          direction: 1,
          force: true,
          synchronizeDigit: true,
          activatePreparedTyping: true,
        });
        advanceTypingByWheel?.(event);
        return true;
      }

      if (
        firstStageSequenceState === "reverse-digit" ||
        firstStageSequenceState === "reverse-wait-scaffold"
      ) {
        event.preventDefault();
        if (!currentGestureIsStart || currentGestureAlreadyUsed) {
          return;
        }
        firstStageLastActionGestureId = gestureId;
        clearTimeout(firstStageSequenceTimer);
        firstStageSequenceState = "forward-digit";
        lockWheelInput("first-stage-digit-in");
        document.dispatchEvent(new Event(FIRST_STAGE_DIGIT_SHOW_EVENT));
        scheduleFirstStageSequenceState(
          "forward-digit",
          "forward-wait-text",
          FIRST_STAGE_VISUAL_TRANSITION_DURATION + 100,
          "first-stage-digit-in",
        );
        return;
      }

      if (
        firstStageSequenceState === "reverse-scaffold" ||
        (firstStageSequenceState === "reverse-complete" &&
          counterIsActive &&
          /phone__content_1-0(?:\s|$)/.test(
            document.getElementById("phone").className,
          ))
      ) {
        event.preventDefault();
        if (!currentGestureIsStart || currentGestureAlreadyUsed) {
          return;
        }
        clearTimeout(firstStageSequenceTimer);
        lockWheelInput("first-stage-visuals-in");
        startFirstStageScaffoldInSequence(
          gestureId,
          "first-stage-visuals-in",
        );
        return;
      }

      if (
        firstStageSequenceState === "forward-scaffold" ||
        firstStageSequenceState === "forward-digit" ||
        firstStageSequenceState === "forward-phone"
      ) {
        event.preventDefault();
        return;
      }

      if (firstStageSequenceState === "forward-wait-digit") {
        event.preventDefault();
        if (!currentGestureIsStart || currentGestureAlreadyUsed) {
          logScrollDebug("first-stage-step-hold", {
            gestureId,
            firstStageLastActionGestureId,
            firstStageSequenceState,
            reason: currentGestureAlreadyUsed
              ? "gesture-already-used"
              : "gesture-tail",
          });
          return;
        }
        firstStageLastActionGestureId = gestureId;
        firstStageSequenceState = "forward-digit";
        lockWheelInput("first-stage-digit-in");
        logScrollDebug("first-stage-digit-start", { gestureId });
        document.dispatchEvent(new Event(FIRST_STAGE_DIGIT_SHOW_EVENT));
        scheduleFirstStageSequenceState(
          "forward-digit",
          "forward-wait-text",
          FIRST_STAGE_VISUAL_TRANSITION_DURATION + 100,
          "first-stage-digit-in",
        );
        return;
      }

      if (firstStageSequenceState === "forward-wait-text") {
        if (!currentGestureIsStart || currentGestureAlreadyUsed) {
          event.preventDefault();
          logScrollDebug("first-stage-step-hold", {
            gestureId,
            firstStageLastActionGestureId,
            firstStageSequenceState,
            reason: currentGestureAlreadyUsed
              ? "gesture-already-used"
              : "gesture-tail",
          });
          return;
        }
        event.preventDefault();
        firstStageLastActionGestureId = gestureId;
        firstStageSequenceState = "active";
        logScrollDebug("first-stage-text-start", { gestureId });
        dispatchTextStepChange(0, {
          direction: 1,
          synchronizeDigit: true,
          activatePreparedTyping: true,
        });
        advanceTypingByWheel?.(event);
        return true;
      }

      if (
        firstStageSequenceState === "active" &&
        currentDigit === 1 &&
        completedTextStep < 0
      ) {
        event.preventDefault();
        advanceTypingByWheel?.(event);
        return true;
      }

      if (
        firstStageSequenceState === "active" &&
        currentDigit === 1 &&
        renderedPhoneState === "1-0" &&
        completedTextStep >= 0
      ) {
        event.preventDefault();
        if (!currentGestureIsStart || currentGestureAlreadyUsed) {
          return;
        }

        firstStageLastActionGestureId = gestureId;
        firstStageSequenceState = "forward-phone";
        lockWheelInput("first-stage-phone-in");
        logScrollDebug("first-stage-phone-forward-start", { gestureId });
        document.dispatchEvent(
          new CustomEvent(PHONE_REVERSE_STEP_EVENT, {
            detail: { state: "1-1" },
          }),
        );
        scheduleFirstStageSequenceState(
          "forward-phone",
          "active",
          PHASE_TRANSITION_DURATION + 100,
          "first-stage-phone-in",
        );
        return;
      }

      if (firstStageSequenceState === "active" && currentGestureAlreadyUsed) {
        return true;
      }

      return;
    }

    // The reverse navigator owns the complete physical gesture that brought
    // us from a later phase back to phase 1. Do not let trailing wheel events
    // from that same gesture immediately consume phase 1 as well.
    if (scrollRoot.dataset.reverseGesture === "active") {
      return;
    }

    if (firstStageSequenceState === "forward-wait-scaffold") {
      event.preventDefault();
      if (!currentGestureIsStart || currentGestureAlreadyUsed) {
        logScrollDebug("first-stage-step-hold", {
          gestureId,
          firstStageLastActionGestureId,
          firstStageSequenceState,
          reason: currentGestureAlreadyUsed
            ? "gesture-already-used"
            : "gesture-tail",
        });
        return;
      }

      firstStageLastActionGestureId = gestureId;
      firstStageSequenceState = "reverse-complete";
      logScrollDebug("first-stage-screen-reverse-start", { gestureId });
      document.dispatchEvent(
        new CustomEvent(PHONE_REVERSE_STEP_EVENT, {
          detail: { state: "0-0" },
        }),
      );
      return;
    }

    if (firstStageSequenceState === "active" && currentDigit === 1) {
      event.preventDefault();
      if (!currentGestureIsStart || currentGestureAlreadyUsed) {
        logScrollDebug("first-stage-step-hold", {
          gestureId,
          firstStageLastActionGestureId,
          firstStageSequenceState,
          reason: currentGestureAlreadyUsed
            ? "gesture-already-used"
            : "gesture-tail",
        });
        return;
      }
      firstStageLastActionGestureId = gestureId;

      if (renderedPhoneState === "1-1") {
        logScrollDebug("first-stage-phone-reverse-start", { gestureId });
        document.dispatchEvent(
          new CustomEvent(PHONE_REVERSE_STEP_EVENT, {
            detail: { state: "1-0" },
          }),
        );
        // The final screen of phase 1 and its text leave as one visual step.
        // Waiting for the phone transition first made reverse navigation feel
        // like two unrelated actions.
        startFirstStageTextOutSequence(gestureId);
        return;
      }

      startFirstStageTextOutSequence(gestureId);
      return;
    }

    if (firstStageSequenceState === "reverse-wait-text") {
      event.preventDefault();
      if (!currentGestureIsStart || currentGestureAlreadyUsed) {
        return;
      }

      startFirstStageTextOutSequence(gestureId);
      return;
    }

    if (
      firstStageSequenceState === "reverse-phone" ||
      firstStageSequenceState === "reverse-text" ||
      firstStageSequenceState === "reverse-digit" ||
      firstStageSequenceState === "reverse-scaffold"
    ) {
      event.preventDefault();
      return;
    }

    if (
      firstStageSequenceState === "reverse-wait-digit" ||
      firstStageSequenceState === "forward-wait-text"
    ) {
      event.preventDefault();
      if (!currentGestureIsStart || currentGestureAlreadyUsed) {
        logScrollDebug("first-stage-step-hold", {
          gestureId,
          firstStageLastActionGestureId,
          firstStageSequenceState,
          reason: currentGestureAlreadyUsed
            ? "gesture-already-used"
            : "gesture-tail",
        });
        return;
      }
      startFirstStageDigitOutSequence(gestureId);
      return;
    }

    if (
      firstStageSequenceState === "reverse-wait-scaffold" ||
      firstStageSequenceState === "forward-wait-digit"
    ) {
      event.preventDefault();
      if (!currentGestureIsStart || currentGestureAlreadyUsed) {
        logScrollDebug("first-stage-step-hold", {
          gestureId,
          firstStageLastActionGestureId,
          firstStageSequenceState,
          reason: currentGestureAlreadyUsed
            ? "gesture-already-used"
            : "gesture-tail",
        });
        return;
      }
      firstStageLastActionGestureId = gestureId;
      firstStageSequenceState = "reverse-scaffold";
      lockWheelInput("first-stage-scaffold-out");
      logScrollDebug("first-stage-scaffold-reverse-start", { gestureId });
      // The digit owns the preceding reverse step. Before the scaffold starts
      // leaving, commit its final hidden classes so a missed/cancelled CSS
      // animationend cannot leave the rendered digit behind.
      settleFirstStageDigitHidden();
      document.dispatchEvent(
        new CustomEvent(INTRO_SCAFFOLD_VISIBILITY_EVENT, {
          detail: { visible: false },
        }),
      );
      scheduleFirstStageSequenceState(
        "reverse-scaffold",
        "reverse-complete",
        FIRST_STAGE_VISUAL_TRANSITION_DURATION + 100,
        "first-stage-scaffold-out",
      );
    }
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
    const numberWindow = numberCont.closest(".counter-block__number-window");
    let stageFrameId = null;

    const settleNumberTransition = (event) => {
      const isFirstDigitEntering = event.animationName === "firstDigitFadeIn";
      const isFirstDigitExiting = event.animationName === "firstDigitFadeOut";
      const isEntering =
        event.animationName === "lcdDigitIn" || isFirstDigitEntering;
      const isExiting =
        event.animationName === "lcdDigitOut" || isFirstDigitExiting;

      if (!isEntering && !isExiting) {
        return;
      }

      const transition = numberCont.className.match(REGEX);
      if (!transition) {
        return;
      }

      const [from, to] = transition[0].slice(1).split("-").map(Number);
      const animatedDigit = numberCont.children[(isEntering ? to : from) - 1];
      const animationTarget =
        (isFirstDigitEntering || isFirstDigitExiting) &&
        event.target === numberWindow
          ? numberWindow
          : animatedDigit;

      if (
        from === to ||
        event.target !== animationTarget ||
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

      if (isFirstDigitEntering && firstStageSequenceState === "forward-digit") {
        clearTimeout(firstStageSequenceTimer);
        firstStageSequenceState = "forward-wait-text";
        completeWheelInputTransition(firstStageVisualSequenceLockOwner);
        firstStageVisualSequenceLockOwner = null;
        logScrollDebug("first-stage-step-ready", {
          firstStageSequenceState,
          firstStageLastActionGestureId,
          source: "digit-animation-end",
        });
      } else if (
        isFirstDigitExiting &&
        firstStageSequenceState === "reverse-digit"
      ) {
        startFirstStageScaffoldOutSequence();
      }
    };

    numberCont.addEventListener("animationend", settleNumberTransition);
    numberWindow.addEventListener("animationend", settleNumberTransition);
    const startDigitTransition = (nextDigit, { force = false } = {}) => {
      const transition = numberCont.className.match(REGEX);

      if (
        (!counterIsActive && !force) ||
        nextDigit !== currentDigit ||
        !transition
      ) {
        return;
      }

      const [, activeTarget] = transition[0].slice(1).split("-").map(Number);
      animateZeroVisibility(true);

      if (activeTarget === nextDigit) {
        return;
      }

      numberCont.className = numberCont.className.replace(
        REGEX,
        `_${activeTarget}-${nextDigit}`,
      );
    };

    document.addEventListener(TEXT_STEP_CHANGE_EVENT, (event) => {
      if (event.detail.stepIndex < 0) {
        return;
      }

      const nextDigit = event.detail.stepIndex + 1;
      if (event.detail.synchronizeDigit === true) {
        currentDigit = nextDigit;
      }
      requestAnimationFrame(() => {
        startDigitTransition(nextDigit, {
          force: event.detail.synchronizeDigit === true,
        });
      });
    });
    document.addEventListener(FIRST_STAGE_DIGIT_SHOW_EVENT, () => {
      currentDigit = 1;
      startDigitTransition(1, { force: true });
    });
    document.addEventListener(FIRST_STAGE_DIGIT_HIDE_EVENT, () => {
      animateZeroVisibility(false);
      hideActiveNumberDigit();
    });

    const updateCurrentDigit = () => {
      stageFrameId = null;

      // Scaffold and digit visibility change the sticky layout in both
      // directions. Ignore the synthetic scroll position produced by browser
      // anchoring while the explicit first-stage sequence owns the screen.
      if (firstStageOwnsPinnedScrollPosition()) {
        return;
      }

      // The number observer is registered before the typing observer. Flush
      // text progress here so a coarse mouse-wheel notch cannot jump across
      // the completion threshold before the phase gate sees it.
      flushTypingProgress?.();

      const scrollDigit = getDigitForCurrentScroll();
      const nextDigit =
        scrollDigit > currentDigit
          ? currentDigit + 1
          : scrollDigit < currentDigit
            ? currentDigit - 1
            : currentDigit;

      if (nextDigit === currentDigit) {
        return;
      }

      if (nextDigit > currentDigit) {
        const currentTextStep = currentDigit - 1;
        const textIsComplete = completedTextStep >= currentTextStep;

        // Text follows the physical scroll continuously. Once it is complete,
        // the same fast wheel pass may continue into the mockup transition;
        // the transition lock below absorbs the remaining momentum so it can
        // still commit at most one neighbouring phase.
        if (!textIsComplete) {
          return;
        }
      }

      const previousDigit = currentDigit;
      currentDigit = nextDigit;
      if (scrollDigit > nextDigit) {
        const boundaryScrollTop = getDigitBoundaryScrollTop(nextDigit);
        scrollRoot.scrollTop = boundaryScrollTop + 1;
        logScrollDebug("phase-overshoot-clamped", {
          previousDigit,
          requestedDigit: scrollDigit,
          committedDigit: nextDigit,
        });
      }
      const phaseLockWasAcquired = lockWheelInput("phase-transition");
      if (phaseLockWasAcquired) {
        clearTimeout(phaseTransitionInputTimer);
        phaseTransitionInputTimer = setTimeout(() => {
          completeWheelInputTransition("phase-transition");
        }, PHASE_TRANSITION_DURATION);
      }
      if (previousDigit > 1 && currentDigit === 1) {
        clearTimeout(firstStageReverseTextTimer);
        firstStageSequenceState = "active";
      }
      if (counterIsActive) {
        dispatchTextStepChange(currentDigit - 1, {
          synchronizeDigit: previousDigit > 1 && currentDigit === 1,
        });
      }
    };
    const requestStageUpdate = () => {
      if (!stageFrameId) {
        stageFrameId = requestAnimationFrame(updateCurrentDigit);
      }
    };

    scrollRoot.addEventListener("scroll", requestStageUpdate, {
      passive: true,
    });
    window.addEventListener("resize", requestStageUpdate);
    requestStageUpdate();
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
      const numberCont = document.getElementById("changing-number");
      const phoneStateOrder = new Map(
        anchors.map((anchor, index) => [anchor.dataset.id, index]),
      );
      const options = {
        root: scrollRoot,
        threshold: 0.5,
      };
      let pendingPhoneState = "999-999";
      let expectedTextStep = -1;
      let unlockedTextStep = -1;
      let phoneStageIsUnlocked = false;
      let reversePhoneState = null;
      let introReverseSequenceIsActive = false;
      let logoStageGestureId = null;
      let logoStageForwardStep = 0;
      let introReverseScreenTransitionIsActive = false;
      let introLogoRevealTimer = null;
      const phoneLogo = phone.querySelector(".phone__item_logo");
      const phoneShell = phone.closest(".phone");
      const clearDelayedIntroLogoReveal = () => {
        clearTimeout(introLogoRevealTimer);
        introLogoRevealTimer = null;
        phoneShell?.classList.remove("phone_intro-logo-delayed");
      };
      const revealIntroLogoWithDelay = () => {
        clearDelayedIntroLogoReveal();
        phoneShell?.classList.add("phone_intro-logo-delayed");
        commitPhoneState("0-0");
        introLogoRevealTimer = setTimeout(() => {
          introLogoRevealTimer = null;
          phoneShell?.classList.remove("phone_intro-logo-delayed");
        }, INTRO_LOGO_REVEAL_DELAY);
      };
      const clearFirstScreenTransitionClasses = () => {
        phoneShell?.classList.remove(
          "phone_first-screen-logo-exiting",
          "phone_first-screen-revealing",
          "phone_first-screen-reverse-exiting",
          "phone_first-screen-white",
          "phone_first-screen-logo-entering",
        );
      };
      const clearLogoAnimations = () => {
        phoneLogo.classList.remove(
          "phone__item_logo-entering",
          "phone__item_logo-exiting",
        );
      };
      const isIntroPhoneState = (state) =>
        state === "999-999" || state === "0-0";
      const getRequiredTextStep = (state) => {
        if (isIntroPhoneState(state)) {
          return -1;
        }

        return PHONE_STATE_TEXT_STEPS[state] ?? Infinity;
      };
      const getAnchorActivationScrollTop = (anchor) => {
        const rootRect = scrollRoot.getBoundingClientRect();
        const anchorRect = anchor.getBoundingClientRect();

        return (
          scrollRoot.scrollTop +
          anchorRect.top -
          rootRect.top +
          anchorRect.height / 2 -
          scrollRoot.clientHeight / 2
        );
      };
      const getMainStickyStartScrollTop = () => {
        const rootRect = scrollRoot.getBoundingClientRect();
        const mainRect = document
          .getElementById("section-main")
          .getBoundingClientRect();

        return scrollRoot.scrollTop + mainRect.top - rootRect.top;
      };
      const commitPhoneState = (state) => {
        if (state !== "0-0") {
          clearDelayedIntroLogoReveal();
        }

        phone.className = phone.className.replace(REGEX, state);

        if (isIntroPhoneState(state)) {
          clearLogoAnimations();
        } else if (!isIntroPhoneState(state)) {
          // Phone screen changes within stage 1 must not interrupt the
          // scaffold entrance that starts at the stage boundary.
          clearLogoAnimations();
        }
      };
      const cancelIntroReverseSequence = () => {
        const sequenceWasActive =
          introReverseSequenceIsActive || introReverseScreenTransitionIsActive;

        if (!sequenceWasActive) {
          return;
        }

        clearTimeout(firstStageReverseScreenTimer);
        introReverseScreenTransitionIsActive = false;
        clearFirstScreenTransitionClasses();
        introReverseSequenceIsActive = false;
        scrollRoot.dataset.introReverseSequence = "idle";

        if (sequenceWasActive) {
          completeWheelInputTransition("intro-screen-to-logo");
          logoStageGestureId = null;
          logoStageForwardStep = 0;
          firstStageVisualSequenceLockOwner = null;
          clearLogoAnimations();
          clearTimeout(firstStageSequenceTimer);
          firstStageSequenceState = "forward-wait-scaffold";
          commitPhoneState("1-0");
          waitForNextFirstStageGesture();
        }
      };
      const finishIntroReverseSequence = () => {
        completeWheelInputTransition("intro-screen-to-logo");
        // A fast reverse scroll can move the scroll root across the intro
        // boundary while a first-stage fallback timer is still pending. The
        // reset below cancels that timer, so finish its input lock as well.
        // It will still wait for the current physical gesture to end before
        // accepting another action.
        completeFirstStageWheelInputTransition();
        document.dispatchEvent(
          new CustomEvent(INTRO_SCAFFOLD_VISIBILITY_EVENT, {
            detail: { visible: false, immediate: true, force: true },
          }),
        );
        introReverseSequenceIsActive = false;
        introReverseScreenTransitionIsActive = false;
        clearFirstScreenTransitionClasses();
        clearTimeout(firstStageSequenceTimer);
        firstStageSequenceState = "idle";
        logoStageGestureId = null;
        logoStageForwardStep = 0;
        firstStageVisualSequenceLockOwner = null;
        scrollRoot.dataset.introReverseSequence = "idle";
        commitPhoneState("999-999");
      };
      const resetIntroSequenceAtStart = () => {
        resetWheelInputLock();
        logScrollDebug("intro-sequence-reset", {
          gestureId: currentWheelGestureId,
          logoStageGestureId,
          firstStageSequenceState,
        });
        clearTimeout(firstStageForwardScreenTimer);
        clearTimeout(firstStageReverseScreenTimer);
        clearTimeout(firstStageSequenceTimer);
        clearTimeout(firstStageScaffoldGestureTimer);
        clearTimeout(phaseTransitionInputTimer);
        clearTimeout(reverseNavigationInputTimer);
        introReverseScreenTransitionIsActive = false;
        introReverseSequenceIsActive = false;
        logoStageGestureId = null;
        logoStageForwardStep = 0;
        firstStageVisualSequenceLockOwner = null;
        reversePhoneState = null;
        stopIntroReverseNativeScroll();
        firstStageScaffoldGestureReady = false;
        firstStageLastActionGestureId = null;
        firstStagePinnedScrollTop = null;
        firstStageSequenceState = "idle";
        completedTextStep = -1;
        midpointTextStep = -1;
        textTypingCompletionGestureId = null;
        pendingPhoneState = "999-999";
        expectedTextStep = -1;
        scrollRoot.dataset.introReverseSequence = "idle";
        clearFirstScreenTransitionClasses();
        clearLogoAnimations();
        commitPhoneState("999-999");
        document.dispatchEvent(
          new CustomEvent(INTRO_SCAFFOLD_VISIBILITY_EVENT, {
            detail: { visible: false, immediate: true, force: true },
          }),
        );
        animateZeroVisibility(false);
        hideActiveNumberDigit();
      };
      document.addEventListener(
        INTRO_SEQUENCE_RESET_EVENT,
        resetIntroSequenceAtStart,
      );
      const startIntroReverseSequence = () => {
        if (introReverseSequenceIsActive) {
          return;
        }

        // The intro is the step after the first-stage reverse sequence. A
        // scroll/observer update must not skip text, digit, or scaffold exit
        // animations while one of those steps still owns the input.
        if (
          firstStageSequenceState !== "reverse-complete" &&
          firstStageSequenceState !== "idle"
        ) {
          logScrollDebug("intro-reverse-held", {
            gestureId: currentWheelGestureId,
            firstStageSequenceState,
            activeInputOwner: wheelInputLock?.owner ?? null,
          });
          return;
        }

        logScrollDebug("intro-reverse-start", {
          gestureId: currentWheelGestureId,
          firstStageSequenceState,
        });
        lockWheelInput("intro-screen-to-logo");
        clearDelayedIntroLogoReveal();

        introReverseSequenceIsActive = true;
        scrollRoot.scrollTop = getMainStickyStartScrollTop();
        clearTimeout(firstStageSequenceTimer);
        clearTimeout(firstStageReverseScreenTimer);
        firstStageSequenceState = "reverse-screen-transition";
        introReverseScreenTransitionIsActive = true;
        scrollRoot.dataset.introReverseSequence = "active";
        document.dispatchEvent(
          new CustomEvent(INTRO_SCAFFOLD_VISIBILITY_EVENT, {
            detail: { visible: false, immediate: true, force: true },
          }),
        );
        clearFirstScreenTransitionClasses();
        phoneShell?.classList.add("phone_first-screen-reverse-exiting");
        firstStageReverseScreenTimer = setTimeout(() => {
          if (!introReverseScreenTransitionIsActive) {
            return;
          }

          phoneShell?.classList.remove("phone_first-screen-reverse-exiting");
          commitPhoneState("999-999");
          firstStageReverseScreenTimer = setTimeout(() => {
            if (!introReverseScreenTransitionIsActive) {
              return;
            }

            commitPhoneState("0-0");
            phoneShell?.classList.add("phone_first-screen-logo-entering");
            firstStageReverseScreenTimer = setTimeout(() => {
              phoneShell?.classList.remove("phone_first-screen-logo-entering");
              if (!introReverseScreenTransitionIsActive) {
                return;
              }

              introReverseScreenTransitionIsActive = false;
              firstStageSequenceState = "reverse-complete";
              completeWheelInputTransition("intro-screen-to-logo");
              logoStageGestureId = currentWheelGestureId;
              logoStageForwardStep = 0;
            }, FIRST_SCREEN_FADE_DURATION);
          }, FIRST_SCREEN_SWAP_PAUSE_DURATION);
        }, FIRST_SCREEN_FADE_DURATION);

        if (expectedTextStep >= 0) {
          dispatchTextStepChange(-1, {
            boundary: "intro",
            direction: -1,
          });
        }

        animateZeroVisibility(false);
        hideActiveNumberDigit();
      };
      const applyPhoneState = (state) => {
        if (reversePhoneState && state !== reversePhoneState) {
          return;
        }

        pendingPhoneState = state;

        const currentState = phone.className.match(REGEX)?.[0];
        const currentStateIndex = phoneStateOrder.get(currentState);
        const nextStateIndex = phoneStateOrder.get(state);

        // IntersectionObserver callbacks are asynchronous. After a fast
        // forward pass an older anchor can arrive after the newer screen has
        // already been committed. Reverse navigation sets reversePhoneState
        // before changing the screen, so only unowned backward callbacks are
        // stale and must be ignored.
        if (
          !reversePhoneState &&
          scrollRoot.dataset.reverseGesture !== "active" &&
          Number.isInteger(currentStateIndex) &&
          Number.isInteger(nextStateIndex) &&
          nextStateIndex < currentStateIndex
        ) {
          logScrollDebug("stale-phone-state-regression-ignored", {
            currentState,
            requestedState: state,
          });
          return;
        }

        // The intro controller owns both empty and logo states during stage 0.
        if (isIntroPhoneState(state) && expectedTextStep < 0) {
          return;
        }

        if (
          isIntroPhoneState(state) &&
          !isIntroPhoneState(phone.className.match(REGEX)?.[0])
        ) {
          startIntroReverseSequence();
          return;
        }

        if (state === "1-0") {
          // IntersectionObserver may deliver the search anchor after the
          // typing midpoint already committed 1-1. Never regress the mockup
          // during a forward pass.
          if (
            currentState === "1-1" &&
            expectedTextStep === 0 &&
            phoneStageIsUnlocked &&
            !reversePhoneState
          ) {
            return;
          }

          const searchAnchor = anchors.find(
            (anchor) => anchor.dataset.id === state,
          );

          if (
            searchAnchor &&
            scrollRoot.scrollTop + 1 <
              getAnchorActivationScrollTop(searchAnchor)
          ) {
            return;
          }

          commitPhoneState(state);
          return;
        }

        if (
          !isIntroPhoneState(state) &&
          (!phoneStageIsUnlocked ||
            getRequiredTextStep(state) > unlockedTextStep)
        ) {
          return;
        }

        commitPhoneState(state);
      };

      document.addEventListener(PHONE_REVERSE_STEP_EVENT, (event) => {
        reversePhoneState = event.detail.state;
        pendingPhoneState = event.detail.state;

        if (
          isIntroPhoneState(event.detail.state) &&
          !isIntroPhoneState(phone.className.match(REGEX)?.[0])
        ) {
          startIntroReverseSequence();
          return;
        }

        cancelIntroReverseSequence();
        commitPhoneState(event.detail.state);
      });
      document.addEventListener(PHONE_REVERSE_CANCEL_EVENT, () => {
        const reverseIntroWasActive = introReverseSequenceIsActive;

        reversePhoneState = null;
        cancelIntroReverseSequence();

        if (reverseIntroWasActive) {
          commitPhoneState("1-0");
        }
      });
      document.addEventListener(INTRO_LOGO_VISIBILITY_EVENT, (event) => {
        if (
          introReverseSequenceIsActive ||
          firstStageOwnsPinnedScrollPosition()
        ) {
          return;
        }

        const currentState = phone.className.match(REGEX)?.[0];

        // The boundary observer only owns the empty/logo intro states. Near
        // the stage-1 boundary it can still report the logo as visible; that
        // must never overwrite an already rendered application screen.
        if (event.detail.visible && !isIntroPhoneState(currentState)) {
          return;
        }

        if (event.detail.visible) {
          logoStageGestureId = currentWheelGestureId;
          logoStageForwardStep = 0;
        } else {
          logoStageGestureId = null;
          logoStageForwardStep = 0;
        }
        logScrollDebug("logo-visibility", {
          visible: event.detail.visible,
          gestureId: currentWheelGestureId,
          logoStageGestureId,
          firstStageSequenceState,
        });
        if (event.detail.visible) {
          revealIntroLogoWithDelay();
        } else {
          commitPhoneState("999-999");
        }
      });

      document.addEventListener(TEXT_STEP_CHANGE_EVENT, (event) => {
        const nextTextStep = event.detail.stepIndex;

        if (nextTextStep === expectedTextStep && !event.detail.force) {
          return;
        }

        const previousTextStep = expectedTextStep;
        expectedTextStep = nextTextStep;
        phoneStageIsUnlocked = false;

        if (nextTextStep >= 0) {
          cancelIntroReverseSequence();
        }

        if (nextTextStep === 0 && pendingPhoneState === "1-0") {
          commitPhoneState(pendingPhoneState);
        }

        if (
          previousTextStep >= 0 &&
          nextTextStep < 0 &&
          event.detail.boundary !== "footer" &&
          event.detail.boundary !== "search"
        ) {
          startIntroReverseSequence();
        }
      });
      document.addEventListener(TEXT_TYPING_MIDPOINT_EVENT, (event) => {
        if (event.detail.stepIndex !== expectedTextStep) {
          return;
        }

        unlockedTextStep = expectedTextStep;
        phoneStageIsUnlocked = true;

        // The first phase changes its internal mockup state halfway through
        // typing. It is intentionally independent from the later phase change,
        // which still waits for complete text and a fresh gesture.
        if (expectedTextStep === 0) {
          commitPhoneState("1-1");
        }
      });

      let first = true;
      const callback = (entries) => {
        entries.forEach((entry) => {
          const curNum = Number(entry.target.dataset.num);
          const prevNum = curNum - 1;

          if (first) {
            if (entry.isIntersecting) {
              applyPhoneState(anchors[prevNum].dataset.id);
            }
            return;
          }

          //if intersection from above -> return
          const top = entry.target.getBoundingClientRect().top;
          if (top < measure100vh.clientHeight - top) {
            return;
          }

          if (entry.isIntersecting) {
            applyPhoneState(anchors[prevNum].dataset.id);
          } else {
            applyPhoneState(anchors[prevNum - 1]?.dataset.id ?? "999-999");
          }
        });
        first = false;
      };

      const observer = new IntersectionObserver(callback, options);

      anchors.forEach((el) => {
        observer.observe(el);
      });

      let lastForwardScrollTop = scrollRoot.scrollTop;
      let forwardSyncFrameId = null;
      const holdFirstForwardGestureAtSearch = (event) => {
        if (
          event.defaultPrevented ||
          event.deltaY <= 0 ||
          event.ctrlKey ||
          event.target.closest(".modal-window_shown")
        ) {
          return;
        }

        const currentState = phone.className.match(REGEX)?.[0];
        if (!isIntroPhoneState(currentState)) {
          return;
        }

        const gestureId = getWheelGestureId(event);
        logScrollDebug("intro-forward-wheel", {
          gestureId,
          logoStageGestureId,
          currentState,
          firstStageSequenceState,
          introReverseSequenceIsActive,
          reversePhoneState,
        });

        const reverseSequenceIsSettledAtLogo =
          introReverseSequenceIsActive &&
          !introReverseScreenTransitionIsActive &&
          firstStageSequenceState === "reverse-complete" &&
          currentState === "0-0";

        if (reverseSequenceIsSettledAtLogo) {
          introReverseSequenceIsActive = false;
          reversePhoneState = null;
          scrollRoot.dataset.introReverseSequence = "idle";
          completeWheelInputTransition("intro-screen-to-logo");
          logScrollDebug("intro-reverse-settled-for-forward", {
            gestureId,
            logoStageGestureId,
          });
        } else if (introReverseSequenceIsActive || reversePhoneState) {
          event.preventDefault();
          logScrollDebug("intro-forward-cancel-reverse", {
            gestureId,
            logoStageGestureId,
          });
          document.dispatchEvent(new Event(PHONE_REVERSE_CANCEL_EVENT));
          return;
        }

        if (logoStageGestureId === null) {
          if (scrollRoot.scrollTop + 1 < getMainStickyStartScrollTop()) {
            logScrollDebug("intro-forward-native-scroll", {
              gestureId,
              reason: "before-logo-boundary",
            });
            return;
          }

          event.preventDefault();
          revealIntroLogoWithDelay();
          logoStageGestureId = gestureId;
          logoStageForwardStep = 0;
          logScrollDebug("logo-stage-set", {
            gestureId,
            logoStageGestureId,
            reason: "reached-logo-boundary",
          });
          return;
        }

        if (gestureId === logoStageGestureId) {
          event.preventDefault();
          logScrollDebug("logo-stage-hold", {
            gestureId,
            logoStageGestureId,
            reason: "same-gesture",
          });
          return;
        }

        if (logoStageForwardStep === 0) {
          event.preventDefault();
          logoStageForwardStep = 1;
          logoStageGestureId = gestureId;
          logScrollDebug("logo-stage-step", {
            gestureId,
            logoStageForwardStep,
            reason: "first-logo-gesture",
          });
          return;
        }

        const searchAnchor = anchors.find(
          (anchor) => anchor.dataset.id === "1-0",
        );
        const searchBoundary = searchAnchor
          ? getAnchorActivationScrollTop(searchAnchor)
          : null;
        if (searchBoundary === null) {
          logScrollDebug("screen-transition-blocked", {
            gestureId,
            reason: "missing-search-boundary",
          });
          return;
        }

        event.preventDefault();
        logScrollDebug("screen-transition-start", {
          gestureId,
          previousLogoStageGestureId: logoStageGestureId,
          searchBoundary: Math.round(searchBoundary),
        });
        logoStageGestureId = null;
        logoStageForwardStep = 0;

        // Re-entering stage 1 owns its complete initial visual state. Do not
        // rely on IntersectionObserver firing again after a quick reversal.
        dispatchTextStepChange(-1, {
          boundary: "search",
          direction: 1,
          force: true,
        });
        firstStageLastActionGestureId = gestureId;
        firstStageSequenceState = "forward-screen";
        lockWheelInput("intro-logo-to-screen");
        document.dispatchEvent(
          new CustomEvent(INTRO_SCAFFOLD_VISIBILITY_EVENT, {
            detail: { visible: false, immediate: true, force: true },
          }),
        );
        firstStagePinnedScrollTop =
          searchBoundary + INTRO_SEARCH_SCROLL_GAP + 2;
        scrollRoot.scrollTop = firstStagePinnedScrollTop;
        clearTimeout(firstStageForwardScreenTimer);
        clearFirstScreenTransitionClasses();
        // Fade the splash out completely before fading the ready screen in.
        // The layers never overlap and neither one changes scale or position.
        phoneShell?.classList.add("phone_first-screen-logo-exiting");
        firstStageForwardScreenTimer = setTimeout(() => {
          if (firstStageSequenceState !== "forward-screen") {
            return;
          }

          phoneShell?.classList.remove("phone_first-screen-logo-exiting");
          commitPhoneState("999-999");
          firstStageForwardScreenTimer = setTimeout(() => {
            if (firstStageSequenceState !== "forward-screen") {
              return;
            }

            pendingPhoneState = "1-0";
            commitPhoneState("1-0");
            phoneShell?.classList.add("phone_first-screen-revealing");
            logScrollDebug("screen-transition-reveal", {
              gestureId,
              firstStageSequenceState,
            });
            firstStageForwardScreenTimer = setTimeout(() => {
              phoneShell?.classList.remove("phone_first-screen-revealing");
              if (firstStageSequenceState !== "forward-screen") {
                return;
              }

              startFirstStageScaffoldInSequence(
                gestureId,
                "intro-logo-to-screen",
              );
              logScrollDebug("screen-transition-complete", {
                gestureId,
                firstStageSequenceState,
              });
            }, FIRST_SCREEN_FADE_DURATION);
          }, FIRST_SCREEN_SWAP_PAUSE_DURATION);
        }, FIRST_SCREEN_FADE_DURATION);
      };
      const holdIntroReverseExitAtLogo = (event) => {
        if (
          event.deltaY >= 0 ||
          event.ctrlKey ||
          event.target.closest(".modal-window_shown") ||
          !introReverseSequenceIsActive
        ) {
          return;
        }

        if (introReverseScreenTransitionIsActive) {
          event.preventDefault();
          return;
        }

        const gestureId = getWheelGestureId(event);
        if (gestureId === logoStageGestureId) {
          event.preventDefault();
          logScrollDebug("intro-reverse-exit-held", {
            gestureId,
            logoStageGestureId,
            reason: "same-gesture",
          });
          return;
        }

        startIntroReverseNativeScroll(gestureId);
        finishIntroReverseSequence();
        logScrollDebug("intro-reverse-native-scroll-start", { gestureId });
        return true;
      };
      const synchronizeForwardPhoneState = () => {
        forwardSyncFrameId = null;
        const nextScrollTop = scrollRoot.scrollTop;
        const previousScrollTop = lastForwardScrollTop;
        const isMovingForward = nextScrollTop > previousScrollTop;
        lastForwardScrollTop = nextScrollTop;

        const renderedState = phone.className.match(REGEX)?.[0];
        const unexpectedJumpToIntro =
          !isMovingForward &&
          previousScrollTop - nextScrollTop > scrollRoot.clientHeight &&
          firstStageSequenceState === "active" &&
          !isIntroPhoneState(renderedState) &&
          !reversePhoneState &&
          scrollRoot.dataset.reverseGesture !== "active" &&
          !wheelInputLock;

        if (unexpectedJumpToIntro) {
          scrollRoot.scrollTop = previousScrollTop;
          lastForwardScrollTop = previousScrollTop;
          logScrollDebug("unexpected-forward-scroll-jump-restored", {
            displacedScrollTop: Math.round(nextScrollTop),
            restoredScrollTop: Math.round(previousScrollTop),
            firstStageSequenceState,
          });
          return;
        }

        // The explicit intro -> screen transition already placed the scroll
        // root at the phase-1 activation point. The generic synchronizer used
        // to snap it back to the logo, leaving the counter inactive and making
        // the following scaffold/digit gestures appear to do nothing.
        if (
          firstStageSequenceState === "forward-screen" ||
          firstStageSequenceState === "forward-wait-scaffold"
        ) {
          return;
        }

        if (introReverseSequenceIsActive) {
          if (isMovingForward) {
            document.dispatchEvent(new Event(PHONE_REVERSE_CANCEL_EVENT));
            return;
          }

          // Wheel routing owns this sequence. Scroll events can still arrive
          // from inertia or from the programmatic move to the phase boundary;
          // they must never advance the intro to the cover on their own.
          return;
        }

        if (!isMovingForward) {
          const currentState = phone.className.match(REGEX)?.[0];
          const searchAnchor = anchors.find(
            (anchor) => anchor.dataset.id === "1-0",
          );
          const searchBoundary = searchAnchor
            ? getAnchorActivationScrollTop(searchAnchor)
            : null;

          if (
            currentState === "1-0" &&
            searchBoundary !== null &&
            nextScrollTop <= searchBoundary + 1
          ) {
            scrollRoot.scrollTop = searchBoundary;
            lastForwardScrollTop = searchBoundary;
            startIntroReverseSequence();
          }
          return;
        }

        if (reversePhoneState || introReverseSequenceIsActive) {
          return;
        }

        const currentState = phone.className.match(REGEX)?.[0];
        const searchAnchor = anchors.find(
          (anchor) => anchor.dataset.id === "1-0",
        );
        const searchBoundary = searchAnchor
          ? getAnchorActivationScrollTop(searchAnchor)
          : null;

        // A large first wheel/touchpad delta must still stop on the logo. The
        // following gesture owns the complete transition into stage 1.
        if (
          isIntroPhoneState(currentState) &&
          searchBoundary !== null &&
          nextScrollTop > searchBoundary + 1
        ) {
          const stickyStartScrollTop = getMainStickyStartScrollTop();
          scrollRoot.scrollTop = stickyStartScrollTop;
          lastForwardScrollTop = stickyStartScrollTop;
          return;
        }

        let nextState = null;
        anchors.forEach((anchor) => {
          if (getAnchorActivationScrollTop(anchor) <= nextScrollTop + 1) {
            nextState = anchor.dataset.id;
          }
        });

        if (!nextState) {
          return;
        }

        if (
          isIntroPhoneState(currentState) &&
          !isIntroPhoneState(nextState) &&
          nextState !== "1-0"
        ) {
          commitPhoneState("1-0");
        }

        applyPhoneState(nextState);
      };
      introForwardWheelHandler = holdFirstForwardGestureAtSearch;
      introReverseWheelHandler = holdIntroReverseExitAtLogo;
      scrollRoot.addEventListener(
        "scroll",
        () => {
          // Showing the scaffold and digit changes the sticky section layout.
          // Chromium scroll anchoring can interpret either showing or hiding
          // them as a real scroll and move the root back to the logo without
          // input. Keep the boundary fixed until every owned step completes.
          if (
            firstStageOwnsPinnedScrollPosition() &&
            Number.isFinite(firstStagePinnedScrollTop) &&
            Math.abs(scrollRoot.scrollTop - firstStagePinnedScrollTop) > 1
          ) {
            logScrollDebug("first-stage-scroll-anchor-restored", {
              displacedScrollTop: Math.round(scrollRoot.scrollTop),
              pinnedScrollTop: Math.round(firstStagePinnedScrollTop),
              firstStageSequenceState,
            });
            scrollRoot.scrollTop = firstStagePinnedScrollTop;
            lastForwardScrollTop = firstStagePinnedScrollTop;
            return;
          }

          if (scrollRoot.scrollTop <= 1) {
            const currentState = phone.className.match(REGEX)?.[0];
            if (
              currentState !== "999-999" ||
              introReverseSequenceIsActive ||
              introReverseNativeScrollIsActive ||
              firstStageSequenceState !== "idle"
            ) {
              document.dispatchEvent(new Event(INTRO_SEQUENCE_RESET_EVENT));
            }
          }
          if (!forwardSyncFrameId) {
            forwardSyncFrameId = requestAnimationFrame(
              synchronizeForwardPhoneState,
            );
          }
        },
        { passive: true },
      );
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
    const phone = document.getElementById("phone");
    const counterBlock = document.getElementById("counter");
    const TYPING_COMPLETE_PHASE_PROGRESS = 0.82;
    const LINE_NUMBER_ROW_HEIGHT = 58;
    const LINES_PER_TEXT_STEP = 5;
    const TEXT_STEP_VERTICAL_OFFSET =
      LINE_NUMBER_ROW_HEIGHT * LINES_PER_TEXT_STEP;
    let textSteps = getScrollAnimationTextSteps();
    let activeStep = -1;
    let hideTimer = null;
    let phraseCleanupTimer = null;
    let animationToken = 0;
    let activePhrase = null;
    let activeLetters = [];
    let typingRanges = [];
    let typingFrameId = null;
    let lastVisibleLetterCount = -1;
    let typingStartedStep = -1;
    let typingIsLocked = false;
    let typingDirection = 1;
    let typingOriginScrollTop = null;
    let reverseVisibleLetterCount = null;
    let lastTextScrollTop = scrollRoot.scrollTop;
    let textScrollDirection = 1;
    let prepareTextStep = null;

    const clampProgress = (value) => Math.min(Math.max(value, 0), 1);
    const refreshTypingRanges = () => {
      const rootRect = scrollRoot.getBoundingClientRect();
      const blockElements = Array.from(blocks);
      const getScrollPoint = (element, ratio = 0) => {
        const rect = element.getBoundingClientRect();

        return (
          scrollRoot.scrollTop +
          rect.top -
          rootRect.top +
          rect.height * ratio -
          scrollRoot.clientHeight / 2
        );
      };
      const firstStageAnchor = document.querySelector(".anchor__item_1-0");
      const firstStageStart = firstStageAnchor
        ? getScrollPoint(firstStageAnchor, 0.5) + INTRO_SEARCH_SCROLL_GAP
        : getScrollPoint(blockElements[1]);
      const stageMarkers = blockElements
        .slice(1)
        .map((block) => getScrollPoint(block, STAGE_CHANGE_POINT));
      const stageStarts = [firstStageStart, ...stageMarkers];
      const finalStageEnd =
        stageStarts[stageStarts.length - 1] +
        blockElements[blockElements.length - 1].offsetHeight;

      typingRanges = stageStarts
        .slice(0, textSteps.length)
        .map((start, index) => ({
          start,
          end: stageMarkers[index] ?? finalStageEnd,
        }));
    };
    const updateTypingProgress = () => {
      typingFrameId = null;

      if (activeStep < 0 || !activeLetters.length) {
        return;
      }

      if (typingIsLocked && typingDirection > 0) {
        return;
      }

      const range = typingRanges[activeStep];
      if (!range) {
        return;
      }

      if (typingDirection > 0 && typingOriginScrollTop === null) {
        // Always measure from the phase's real start. Starting from the
        // current position made a phase entered by a large wheel delta unable
        // to ever reach 100% before its boundary.
        typingOriginScrollTop = range.start;
      }

      const phaseProgress =
        typingDirection > 0
          ? scrollRoot.scrollTop >= range.end
            ? 1
            : clampProgress(
                (scrollRoot.scrollTop - typingOriginScrollTop) /
                  Math.max(range.end - typingOriginScrollTop, 1),
              )
          : clampProgress(
              (scrollRoot.scrollTop - range.start) /
                Math.max(range.end - range.start, 1),
            );
      const typingProgress = clampProgress(
        phaseProgress / TYPING_COMPLETE_PHASE_PROGRESS,
      );
      const visibleLetterCount =
        typingDirection < 0
          ? (reverseVisibleLetterCount ?? activeLetters.length)
          : Math.floor(activeLetters.length * typingProgress);

      if (visibleLetterCount !== lastVisibleLetterCount) {
        activeLetters.forEach((letter, index) => {
          letter.classList.toggle(
            "section-main__shuffle-letter_visible",
            index < visibleLetterCount,
          );
        });
        lastVisibleLetterCount = visibleLetterCount;
      }

      if (
        !typingIsLocked &&
        visibleLetterCount > 0 &&
        typingStartedStep !== activeStep
      ) {
        const startedStep = activeStep;
        typingStartedStep = startedStep;
        document.dispatchEvent(
          new CustomEvent(TEXT_TYPING_START_EVENT, {
            detail: { stepIndex: startedStep },
          }),
        );
      }

      if (
        typingDirection > 0 &&
        typingProgress >= 0.5 &&
        midpointTextStep < activeStep
      ) {
        midpointTextStep = activeStep;
        document.dispatchEvent(
          new CustomEvent(TEXT_TYPING_MIDPOINT_EVENT, {
            detail: {
              stepIndex: activeStep,
              gestureId: currentWheelGestureId,
            },
          }),
        );
        logScrollDebug("text-typing-midpoint", {
          stepIndex: activeStep,
          gestureId: currentWheelGestureId,
          visibleLetterCount,
          totalLetterCount: activeLetters.length,
        });
      }

      if (
        typingDirection > 0 &&
        visibleLetterCount === activeLetters.length &&
        completedTextStep < activeStep
      ) {
        completedTextStep = activeStep;
        textTypingCompletionGestureId = currentWheelGestureId;
        document.dispatchEvent(
          new CustomEvent(TEXT_TYPING_COMPLETE_EVENT, {
            detail: {
              stepIndex: activeStep,
              gestureId: currentWheelGestureId,
            },
          }),
        );
        logScrollDebug("text-typing-complete", {
          stepIndex: activeStep,
          gestureId: currentWheelGestureId,
        });
      }
    };
    const requestTypingProgressUpdate = () => {
      if (!typingFrameId) {
        typingFrameId = requestAnimationFrame(updateTypingProgress);
      }
    };
    flushTypingProgress = () => {
      if (typingFrameId) {
        cancelAnimationFrame(typingFrameId);
        typingFrameId = null;
      }
      updateTypingProgress();
    };
    advanceTypingByWheel = (event) => {
      if (activeStep < 0 || !activeLetters.length) {
        return;
      }

      const range = typingRanges[activeStep];
      if (!range || typingOriginScrollTop === null) {
        return;
      }

      const physicalTypingDistance = Math.max(
        (range.end - typingOriginScrollTop) *
          TYPING_COMPLETE_PHASE_PROGRESS,
        1,
      );
      const referenceTypingDistance = Math.max(
        ...typingRanges.map(
          (typingRange) =>
            (typingRange.end - typingRange.start) *
            TYPING_COMPLETE_PHASE_PROGRESS,
        ),
        1,
      );
      const longestStepCharacterCount = Math.max(
        ...textSteps.map((step) => [...step.text].length),
        activeLetters.length,
        1,
      );
      // Keep scroll-per-character constant across phases. The longest phrase
      // retains the previous input distance; shorter phrases finish sooner in
      // direct proportion to their rendered character count.
      const inputTypingDistance = Math.max(
        referenceTypingDistance *
          (activeLetters.length / longestStepCharacterCount),
        1,
      );
      const rawDelta = Math.max(getWheelDeltaInPixels(event), 0);
      const controlledInputDelta = Math.min(
        rawDelta,
        referenceTypingDistance * 0.28,
      );
      const controlledPhysicalDelta =
        controlledInputDelta *
        (physicalTypingDistance / inputTypingDistance);
      const completionScrollTop =
        typingOriginScrollTop + physicalTypingDistance + 1;

      scrollRoot.scrollTop = Math.min(
        scrollRoot.scrollTop + controlledPhysicalDelta,
        completionScrollTop,
      );
      flushTypingProgress?.();
    };
    handleTypingWheelInput = (event) => {
      if (
        event.deltaY <= 0 ||
        event.ctrlKey ||
        event.target.closest(".modal-window_shown") ||
        activeStep < 0 ||
        typingIsLocked ||
        typingDirection < 0 ||
        completedTextStep >= activeStep
      ) {
        return;
      }

      event.preventDefault();
      advanceTypingByWheel(event);
      return true;
    };

    shuffleLayer.classList.add("section-main__shuffle-layer");
    shufflePanel.classList.add(
      "section-main__shuffle-panel",
      "section-main__shuffle-panel_intro-pending",
    );
    let introScaffoldIsVisible = false;
    document.addEventListener(INTRO_SCAFFOLD_VISIBILITY_EVENT, (event) => {
      const isVisible = event.detail.visible;
      const isImmediate = event.detail.immediate === true;
      const isForced = event.detail.force === true;

      // A delayed intersection update must not reveal the phase-1 scaffold
      // after the intro reverse transition has taken ownership.
      if (scrollRoot.dataset.introReverseSequence === "active" && isVisible) {
        return;
      }

      if (introScaffoldIsVisible === isVisible && !isForced && !isImmediate) {
        return;
      }

      if (isVisible) {
        prepareTextStep?.(0);
      }

      introScaffoldIsVisible = isVisible;
      shufflePanel.classList.remove(
        "section-main__shuffle-panel_intro-pending",
        "section-main__shuffle-panel_intro-entering",
        "section-main__shuffle-panel_intro-exiting",
      );
      shufflePanel.style.removeProperty("clip-path");
      shufflePanel.style.removeProperty("opacity");

      if (isImmediate) {
        shufflePanel.style.setProperty("clip-path", "inset(0 0 100% 0)");
        shufflePanel.style.setProperty("opacity", "0");
        return;
      }

      void shufflePanel.offsetWidth;
      shufflePanel.classList.add(
        `section-main__shuffle-panel_intro-${
          isVisible ? "entering" : "exiting"
        }`,
      );
    });
    shufflePanel.addEventListener("animationend", (event) => {
      if (event.target !== shufflePanel) {
        return;
      }

      if (
        event.animationName === "introScaffoldIn" &&
        firstStageSequenceState === "forward-scaffold"
      ) {
        startFirstStageDigitInSequence();
      } else if (
        event.animationName === "introScaffoldOut" &&
        firstStageSequenceState === "reverse-scaffold"
      ) {
        finishFirstStageReverseVisualSequence();
      }
    });
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
        scrollRoot.clientWidth / 1920,
        scrollRoot.clientHeight / 960,
      );
      const layoutLeft = 50 * layoutScale;

      shufflePanel.style.setProperty("--shuffle-layout-scale", layoutScale);
      shufflePanel.style.setProperty(
        "--shuffle-layout-left",
        `${layoutLeft}px`,
      );
    };

    window.addEventListener("resize", updatePanelScale);
    scrollRoot.addEventListener(
      "scroll",
      () => {
        const nextScrollTop = scrollRoot.scrollTop;
        if (nextScrollTop !== lastTextScrollTop) {
          textScrollDirection = Math.sign(nextScrollTop - lastTextScrollTop);
          lastTextScrollTop = nextScrollTop;
          if (textScrollDirection < 0 && !typingIsLocked) {
            if (typingDirection >= 0) {
              reverseVisibleLetterCount = Math.max(lastVisibleLetterCount, 0);
            }
            typingDirection = -1;
            typingOriginScrollTop = null;
          } else if (
            textScrollDirection > 0 &&
            !typingIsLocked &&
            typingDirection < 0
          ) {
            // A user may reverse only part of a phase and immediately move
            // forward again. Re-arm forward typing so midpoint/completion
            // events fire again and unlock that phase's mockup states.
            typingDirection = 1;
            typingOriginScrollTop =
              typingRanges[activeStep]?.start ?? scrollRoot.scrollTop;
            reverseVisibleLetterCount = null;
          }
        }
        requestTypingProgressUpdate();
      },
      { passive: true },
    );
    updatePanelScale();
    refreshTypingRanges();
    window.addEventListener("resize", () => {
      refreshTypingRanges();
      requestTypingProgressUpdate();
    });
    requestAnimationFrame(() => {
      refreshTypingRanges();
      requestTypingProgressUpdate();
    });

    const updateScaffoldVisibility = () => {
      const isBeforeLogo = phone.classList.contains("phone__content_999-999");
      const isLogoStage = phone.classList.contains("phone__content_0-0");
      const isIntroVisualStage = isBeforeLogo || isLogoStage;
      shufflePanel.classList.add("section-main__shuffle-panel_visible");

      if (isIntroVisualStage) {
        counterBlock.classList.add("section-main__counter-block_intro");
        counterBlock.classList.add("section-main__counter-block_shown");
      } else {
        counterBlock.classList.remove("section-main__counter-block_intro");
      }
    };

    const phoneStageObserver = new MutationObserver(updateScaffoldVisibility);
    phoneStageObserver.observe(phone, {
      attributes: true,
      attributeFilter: ["class"],
    });
    updateScaffoldVisibility();

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
        for (
          let endIndex = startIndex + 1;
          endIndex <= lastEndIndex;
          endIndex++
        ) {
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
      if (
        bestLayout &&
        bestLayout.every((layoutLine) => measureText(layoutLine) <= maxWidth)
      ) {
        return bestLayout;
      }

      return wrapLine(line, maxWidth, measureText);
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
    const createPhraseRanges = (phraseElement, phrase, property) => {
      const layoutText = wrapPhraseText(phraseElement, phrase.text);
      const highlights = Array.isArray(phrase[property])
        ? phrase[property]
        : [phrase[property]];
      const lowerLayoutText = layoutText
        .toLocaleLowerCase("ru")
        .replace(/\s/g, " ");

      return highlights
        .filter(Boolean)
        .map((highlight) => {
          const start = lowerLayoutText.indexOf(
            highlight.toLocaleLowerCase("ru").replace(/\s/g, " "),
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
    const createHighlightRanges = (phraseElement, phrase) =>
      createPhraseRanges(phraseElement, phrase, "highlight");
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
      const layoutText = wrapPhraseText(shuffleText, phrase.text);
      const layoutLines = layoutText.split("\n");
      const ranges = createHighlightRanges(shuffleText, phrase);
      let characterIndex = 0;

      phraseElement.className = "section-main__shuffle-phrase";
      layoutLines.forEach((lineText, lineIndex) => {
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

      return phraseElement;
    };
    const typePhrase = (phrase, stepIndex, entryShift = 0) => {
      animationToken++;
      const phraseElement = createTypedPhrase(phrase);

      codeArea.classList.remove("section-main__shuffle-code_transitioning");
      phraseElement.dataset.step = stepIndex;
      if (entryShift) {
        phraseElement.style.setProperty(
          "--shuffle-phrase-entry-shift",
          `${entryShift}px`,
        );
        phraseElement.classList.add("section-main__shuffle-phrase_entering");
      }
      shuffleText.appendChild(phraseElement);
      activePhrase = phraseElement;
      activeLetters = Array.from(
        phraseElement.querySelectorAll(
          ".section-main__shuffle-line .section-main__shuffle-letter",
        ),
      );
      reverseVisibleLetterCount =
        typingDirection < 0 ? activeLetters.length : null;
      lastVisibleLetterCount = -1;
      typingStartedStep = -1;
      updateTypingProgress();
      if (entryShift) {
        phraseElement.getBoundingClientRect();
      }

      return phraseElement;
    };
    const moveLineNumbers = (stepIndex) => {
      lineNumberTrack.style.transform = `translateY(${
        -stepIndex * TEXT_STEP_VERTICAL_OFFSET
      }px)`;
    };
    const updatePanelRowCount = (phrase) => {
      const visibleLineNumberCount = 6;
      const layoutText = wrapPhraseText(shuffleText, phrase.text);
      const contentRowCount = layoutText.split("\n").length;
      const rowWindowHeight = visibleLineNumberCount * 58;
      const panelHeight = rowWindowHeight + 4;

      shufflePanel.style.setProperty(
        "--shuffle-content-height",
        `${contentRowCount * 58}px`,
      );
      shufflePanel.style.setProperty(
        "--shuffle-row-window-height",
        `${rowWindowHeight}px`,
      );
      shufflePanel.style.setProperty(
        "--shuffle-current-panel-height",
        `${panelHeight}px`,
      );
      shufflePanel.style.setProperty(
        "--shuffle-max-panel-height",
        `${panelHeight}px`,
      );
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
      let outgoingTransitionClass = null;
      let stepDistance = nextStep - previousStep;

      // Returning to an earlier phase must re-arm that phase's midpoint and
      // completion events. Otherwise a second forward pass renders the text
      // but never unlocks the mockup states again.
      if (previousStep >= 0 && nextStep < previousStep) {
        completedTextStep = Math.min(completedTextStep, nextStep - 1);
        midpointTextStep = Math.min(midpointTextStep, nextStep - 1);
        textTypingCompletionGestureId = null;
      }

      activeStep = nextStep;
      clearTimeout(hideTimer);
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
        stepDistance = Number.isFinite(outgoingStep)
          ? nextStep - outgoingStep
          : nextStep - previousStep;

        typingIsLocked = true;
        typingDirection =
          stepDistance === 0 ? textScrollDirection : Math.sign(stepDistance);
        typingOriginScrollTop = null;
        shufflePanel.style.setProperty(
          "--shuffle-phase-duration",
          `${TEXT_EXIT_DURATION}ms`,
        );

        outgoingPhrase.classList.remove(
          "section-main__shuffle-phrase_exit-up",
          "section-main__shuffle-phrase_exit-down",
        );
        outgoingPhrase.style.setProperty(
          "--shuffle-phrase-shift",
          `${-stepDistance * TEXT_STEP_VERTICAL_OFFSET}px`,
        );
        outgoingTransitionClass =
          stepDistance >= 0
            ? "section-main__shuffle-phrase_exit-up"
            : "section-main__shuffle-phrase_exit-down";
        codeArea.classList.add("section-main__shuffle-code_transitioning");
        phraseCleanupTimer = setTimeout(() => {
          outgoingPhrase.remove();
          typingOriginScrollTop =
            typingDirection > 0
              ? scrollRoot.scrollTop
              : null;
          typingIsLocked = false;
          lastVisibleLetterCount = -1;
          updateTypingProgress();
        }, TEXT_EXIT_DURATION);
      } else if (previousStep === -1) {
        typingIsLocked = nextStep !== 0;
        typingDirection = textScrollDirection || 1;
        typingOriginScrollTop =
          nextStep === 0
            ? (typingRanges[nextStep]?.start ?? scrollRoot.scrollTop)
            : null;
        phraseCleanupTimer = setTimeout(
          () => {
            typingIsLocked = false;
            if (typingOriginScrollTop === null) {
              typingOriginScrollTop =
                typingRanges[activeStep]?.start ?? scrollRoot.scrollTop;
            }
            lastVisibleLetterCount = -1;
            updateTypingProgress();
          },
          nextStep === 0 ? 0 : TEXT_EXIT_DURATION,
        );
      } else {
        typingIsLocked = false;
        typingDirection = textScrollDirection || 1;
        typingOriginScrollTop =
          typingDirection > 0
            ? (typingRanges[nextStep]?.start ?? scrollRoot.scrollTop)
            : null;
      }

      if (!outgoingPhrase) {
        shufflePanel.style.setProperty(
          "--shuffle-phase-duration",
          `${TEXT_EXIT_DURATION}ms`,
        );
      }

      updatePanelRowCount(textSteps[nextStep]);
      const incomingPhrase = typePhrase(
        textSteps[nextStep],
        nextStep,
        outgoingPhrase ? stepDistance * TEXT_STEP_VERTICAL_OFFSET : 0,
      );
      requestAnimationFrame(() => {
        if (activeStep === nextStep) {
          if (outgoingTransitionClass) {
            outgoingPhrase.classList.add(outgoingTransitionClass);
          }
          incomingPhrase.classList.remove(
            "section-main__shuffle-phrase_entering",
          );
          incomingPhrase.classList.add("section-main__shuffle-phrase_active");
          moveLineNumbers(nextStep);
        }
      });
      shuffleText.classList.remove("section-main__shuffle-text_phase-exit");
      shuffleText.classList.add("section-main__shuffle-text_visible");
    };
    prepareTextStep = (stepIndex) => {
      completedTextStep = Math.min(completedTextStep, stepIndex - 1);
      midpointTextStep = Math.min(midpointTextStep, stepIndex - 1);
      textTypingCompletionGestureId = null;

      if (activeStep !== stepIndex) {
        setStep(stepIndex, true);
      }

      activeLetters.forEach((letter) => {
        letter.classList.remove("section-main__shuffle-letter_visible");
      });
      shuffleText.classList.remove("section-main__shuffle-text_visible");
      typingIsLocked = true;
      typingDirection = 1;
      typingOriginScrollTop = null;
      reverseVisibleLetterCount = null;
      lastVisibleLetterCount = 0;
      typingStartedStep = -1;
    };
    const activatePreparedTyping = (stepIndex) => {
      completedTextStep = Math.min(completedTextStep, stepIndex - 1);
      midpointTextStep = Math.min(midpointTextStep, stepIndex - 1);
      textTypingCompletionGestureId = null;

      if (activeStep !== stepIndex) {
        setStep(stepIndex, true);
      }

      activeLetters.forEach((letter) => {
        letter.classList.remove("section-main__shuffle-letter_visible");
      });
      typingIsLocked = false;
      typingDirection = 1;
      const range = typingRanges[stepIndex];
      const remainingTypingDistance = Math.max(
        (range?.end ?? scrollRoot.scrollTop) - scrollRoot.scrollTop,
        1,
      );
      const firstLetterLead =
        activeLetters.length > 0
          ? (remainingTypingDistance * TYPING_COMPLETE_PHASE_PROGRESS * 1.05) /
            Math.max(
              activeLetters.length - TYPING_COMPLETE_PHASE_PROGRESS,
              1,
            )
          : 0;
      typingOriginScrollTop = scrollRoot.scrollTop - firstLetterLead;
      reverseVisibleLetterCount = null;
      lastVisibleLetterCount = 0;
      typingStartedStep = -1;
      shuffleText.classList.remove("section-main__shuffle-text_phase-exit");
      shuffleText.classList.add("section-main__shuffle-text_visible");
      updateTypingProgress();
    };
    resetFirstStageTypingPosition = () => {
      const firstStageStart = typingRanges[0]?.start;

      if (!Number.isFinite(firstStageStart)) {
        return;
      }

      firstStagePinnedScrollTop = firstStageStart;
      scrollRoot.scrollTop = firstStageStart;
      lastTextScrollTop = firstStageStart;
    };
    const hideText = () => {
      activeStep = -1;
      animationToken++;
      clearTimeout(phraseCleanupTimer);
      activePhrase = null;
      activeLetters = [];
      lastVisibleLetterCount = -1;
      typingStartedStep = -1;
      typingIsLocked = false;
      typingOriginScrollTop = null;
      codeArea.classList.remove("section-main__shuffle-code_transitioning");
      clearTimeout(hideTimer);
      shufflePanel.style.setProperty(
        "--shuffle-phase-duration",
        `${TEXT_EXIT_DURATION}ms`,
      );
      shuffleText.classList.add("section-main__shuffle-text_phase-exit");
      shuffleText.classList.remove("section-main__shuffle-text_visible");
      hideTimer = setTimeout(() => {
        if (activeStep === -1) {
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
      const { stepIndex, direction } = event.detail;

      if (direction) {
        textScrollDirection = direction;
      }

      if (stepIndex < 0) {
        hideText();
        return;
      }

      if (event.detail.activatePreparedTyping === true) {
        activatePreparedTyping(stepIndex);
        return;
      }

      setStep(stepIndex, event.detail.force === true);
    };

    document.addEventListener(
      TEXT_STEP_CHANGE_EVENT,
      updateActiveStepFromNumber,
    );
    document.addEventListener(LANGUAGE_CHANGE_EVENT, updateTextLanguage);
    updatePanelRowCount(textSteps[0]);
  };
  const createReverseWheelAcceleration = function () {
    const PHONE_STATE_REGEX = /\d+-\d+$/;
    const phone = document.getElementById("phone");
    const counterBlock = document.getElementById("counter");
    const numberCont = document.getElementById("changing-number");
    const shuffleText = document.querySelector(".section-main__shuffle-text");
    const REVERSE_GESTURE_END_DELAY = 140;
    const FORWARD_DIRECTION_CONFIRM_DISTANCE = 24;
    const FOOTER_ASSETS_TRANSITION_DURATION = 400;
    const mainSection = document.getElementById("section-main");
    let reverseGestureIsActive = false;
    let reverseGestureAllowsNativeScroll = false;
    let reverseGestureEndTimer = null;
    let reverseGestureCount = 0;
    let forwardIntentDistance = 0;
    let footerReverseSequenceIsActive = false;
    let footerReverseWasRestored = false;
    let footerReverseSequenceTimers = [];
    let footerForwardStage = "idle";
    let footerSequencePinnedScrollTop = null;
    let footerTextExitGestureId = null;
    let footerAssetsExitGestureId = null;
    let footerReverseApproachGestureId = null;
    let footerReverseAssetsGestureId = null;
    let reverseTextHoldStep = null;
    let reverseTextHoldRemaining = 0;
    scrollRoot.dataset.reverseGesture = "idle";
    scrollRoot.dataset.reverseTarget = "—";
    scrollRoot.dataset.reverseFrom = "—";
    scrollRoot.dataset.reverseGestureCount = "0";
    scrollRoot.dataset.reverseMode = "—";

    const scheduleReverseGestureEnd = () => {
      clearTimeout(reverseGestureEndTimer);
      reverseGestureEndTimer = setTimeout(() => {
        reverseGestureIsActive = false;
        reverseGestureAllowsNativeScroll = false;
        scrollRoot.dataset.reverseGesture = "idle";
      }, REVERSE_GESTURE_END_DELAY);
    };
    const clearFooterReverseSequence = () => {
      footerReverseSequenceTimers.forEach(clearTimeout);
      footerReverseSequenceTimers = [];
      footerReverseSequenceIsActive = false;
      footerReverseWasRestored = false;
      footerReturnTextPending = false;
      footerForwardStage = "idle";
      footerSequencePinnedScrollTop = null;
      footerTextExitGestureId = null;
      footerAssetsExitGestureId = null;
      footerReverseApproachGestureId = null;
      footerReverseAssetsGestureId = null;
      mainSection.classList.remove(
        "section-main_footer-sequence-controlled",
        "section-main_footer-assets-hidden",
        "section-main_footer-digit-hidden",
        "section-main_footer-scaffold-hidden",
        "section-main_footer-screen-hidden",
      );
      completeWheelInputTransition("footer-forward-assets-out");
      completeWheelInputTransition("footer-forward-text-out");
      completeWheelInputTransition("footer-reverse-sequence");
      completeWheelInputTransition("footer-reverse-text-in");
    };
    const getFooterSequenceTriggerScrollTop = () => {
      const rootRect = scrollRoot.getBoundingClientRect();
      const mainRect = mainSection.getBoundingClientRect();
      const sectionTop = scrollRoot.scrollTop + mainRect.top - rootRect.top;
      const stickyDistance = Math.max(
        mainSection.offsetHeight - scrollRoot.clientHeight,
        0,
      );
      const fadeDistance = Math.max(scrollRoot.clientHeight * 0.9, 1);

      return (
        sectionTop +
        stickyDistance -
        fadeDistance +
        TEXT_PHASE_HOLD_SCROLL_DISTANCE
      );
    };
    const getFooterReverseTriggerScrollTop = () => {
      const rootRect = scrollRoot.getBoundingClientRect();
      const mainRect = mainSection.getBoundingClientRect();
      const sectionTop = scrollRoot.scrollTop + mainRect.top - rootRect.top;
      const stickyDistance = Math.max(
        mainSection.offsetHeight - scrollRoot.clientHeight,
        0,
      );

      return sectionTop + stickyDistance;
    };
    const finalPhoneStageIsRendered = () => {
      const renderedState = phone.className.match(PHONE_STATE_REGEX)?.[0];
      const lastPhoneState = Object.keys(PHONE_STATE_TEXT_STEPS).at(-1);

      return (
        currentDigit === 5 &&
        renderedState === lastPhoneState &&
        completedTextStep >= currentDigit - 1
      );
    };
    const pinFooterSequenceToBoundary = () => {
      footerSequencePinnedScrollTop ??= getFooterSequenceTriggerScrollTop();
      if (
        Math.abs(scrollRoot.scrollTop - footerSequencePinnedScrollTop) > 0.5
      ) {
        scrollRoot.scrollTop = footerSequencePinnedScrollTop;
      }
    };
    const enforceFooterSequenceBoundary = () => {
      if (footerForwardStage === "complete") {
        footerSequencePinnedScrollTop = null;
        return;
      }

      const triggerScrollTop = getFooterSequenceTriggerScrollTop();
      if (footerForwardStage === "reverse-approach") {
        const reverseTriggerScrollTop = getFooterReverseTriggerScrollTop();
        footerSequencePinnedScrollTop = null;
        if (scrollRoot.scrollTop <= reverseTriggerScrollTop + 0.5) {
          footerSequencePinnedScrollTop = reverseTriggerScrollTop;
          footerForwardStage = "reverse-assets-ready";
          scrollRoot.scrollTop = reverseTriggerScrollTop;
        }
        return;
      }
      const sequenceOwnsScroll = footerForwardStage !== "idle";
      const finalStageWouldOvershoot =
        finalPhoneStageIsRendered() &&
        scrollRoot.scrollTop > triggerScrollTop + 0.5;

      if (!sequenceOwnsScroll && !finalStageWouldOvershoot) {
        return;
      }

      footerSequencePinnedScrollTop ??= triggerScrollTop;
      if (
        Math.abs(scrollRoot.scrollTop - footerSequencePinnedScrollTop) > 0.5
      ) {
        scrollRoot.scrollTop = footerSequencePinnedScrollTop;
      }
    };
    scrollRoot.addEventListener("scroll", enforceFooterSequenceBoundary, {
      passive: true,
    });
    document.addEventListener(
      TEXT_TYPING_COMPLETE_EVENT,
      enforceFooterSequenceBoundary,
    );
    const startFooterForwardTextExit = () => {
      const owner = "footer-forward-text-out";
      lockWheelInput(owner);
      footerForwardStage = "text-exiting";
      footerTextExitGestureId = currentWheelGestureId;
      pinFooterSequenceToBoundary();
      mainSection.classList.add("section-main_footer-sequence-controlled");
      dispatchTextStepChange(-1, {
        boundary: "footer",
        direction: 1,
      });
      scrollRoot.dataset.reverseMode = "исчезновение текста";
      footerReverseSequenceTimers.push(
        setTimeout(() => {
          footerForwardStage = "text-hidden";
          footerReverseSequenceTimers = [];
          completeWheelInputTransition(owner);
        }, FOOTER_ASSETS_TRANSITION_DURATION),
      );
    };
    const startFooterForwardAssetsExit = () => {
      const owner = "footer-forward-assets-out";
      lockWheelInput(owner);
      footerForwardStage = "assets-exiting";
      footerAssetsExitGestureId = currentWheelGestureId;
      pinFooterSequenceToBoundary();
      mainSection.classList.add(
        "section-main_footer-sequence-controlled",
        "section-main_footer-assets-hidden",
        "section-main_footer-digit-hidden",
        "section-main_footer-scaffold-hidden",
        "section-main_footer-screen-hidden",
      );
      scrollRoot.dataset.reverseMode =
        "одновременное исчезновение скриншота, скелета и цифры";
      footerReverseSequenceTimers.push(
        setTimeout(() => {
          // Keep the empty mockup pinned. Releasing it is a separate scroll
          // action after this transition has fully finished.
          footerForwardStage = "assets-hidden";
          footerReverseSequenceTimers = [];
          completeWheelInputTransition(owner);
        }, FOOTER_ASSETS_TRANSITION_DURATION),
      );
    };
    const handleFooterForwardWheel = (event) => {
      if (
        footerForwardStage === "reverse-approach" ||
        footerForwardStage === "reverse-assets-ready"
      ) {
        // The user can change direction before starting the gesture that
        // restores the footer assets. In that case the footer is still in its
        // fully hidden (forward-complete) visual state, so release the reverse
        // boundary and let this same wheel event continue towards the footer.
        footerForwardStage = "complete";
        footerSequencePinnedScrollTop = null;
        footerReverseApproachGestureId = null;
        footerReturnTextPending = false;
        scrollRoot.dataset.reverseGesture = "idle";
        scrollRoot.dataset.reverseMode = "—";
        return false;
      }

      if (footerForwardStage === "reverse-text-ready") {
        // Assets have already returned, but the text has not. A direction
        // change back toward the footer should hide those assets directly;
        // restarting the text-exit step leaves the footer state half-restored.
        event.preventDefault();
        footerForwardStage = "text-hidden";
        footerTextExitGestureId = null;
        startFooterForwardAssetsExit();
        return true;
      }

      if (footerForwardStage.endsWith("-exiting")) {
        event.preventDefault();
        return true;
      }

      if (footerForwardStage === "text-hidden") {
        event.preventDefault();

        if (getWheelGestureId(event) === footerTextExitGestureId) {
          return true;
        }

        footerTextExitGestureId = null;
        startFooterForwardAssetsExit();
        return true;
      }

      if (footerForwardStage === "assets-hidden") {
        event.preventDefault();

        if (getWheelGestureId(event) === footerAssetsExitGestureId) {
          return true;
        }

        // The second forward gesture releases the empty mockup. Apply its
        // delta manually only after removing the pin, so the page continues
        // naturally without reusing the gesture that hid the assets.
        footerForwardStage = "complete";
        footerSequencePinnedScrollTop = null;
        footerAssetsExitGestureId = null;
        scrollRoot.scrollTop += Math.max(getWheelDeltaInPixels(event), 0);
        return true;
      }

      if (
        footerForwardStage === "complete"
      ) {
        return false;
      }

      if (!finalPhoneStageIsRendered()) {
        return false;
      }

      const wheelDelta = Math.max(getWheelDeltaInPixels(event), 0);
      const triggerScrollTop = getFooterSequenceTriggerScrollTop();

      if (scrollRoot.scrollTop + wheelDelta < triggerScrollTop) {
        return false;
      }

      event.preventDefault();
      footerSequencePinnedScrollTop = triggerScrollTop;
      scrollRoot.scrollTop = triggerScrollTop;
      mainSection.classList.remove(
        "section-main_footer-assets-hidden",
        "section-main_footer-digit-hidden",
        "section-main_footer-scaffold-hidden",
        "section-main_footer-screen-hidden",
      );
      startFooterForwardTextExit();
      return true;
    };
    const getPhoneTimeline = () => {
      const rootRect = scrollRoot.getBoundingClientRect();
      return Array.from(
        document.querySelectorAll(".anchor__item[data-id]"),
      ).map((anchor) => {
        const anchorRect = anchor.getBoundingClientRect();

        return {
          anchor,
          state: anchor.dataset.id,
          activationScrollTop:
            scrollRoot.scrollTop +
            anchorRect.top -
            rootRect.top -
            scrollRoot.clientHeight / 2 +
            anchorRect.height / 2,
        };
      });
    };
    const getLogicalTimelineIndex = (timeline) => {
      let logicalIndex = -1;

      timeline.forEach((item, index) => {
        if (item.activationScrollTop <= scrollRoot.scrollTop + 1) {
          logicalIndex = index;
        }
      });

      return logicalIndex;
    };
    const getPreviousPhaseLastIndex = (timeline, currentIndex) => {
      const currentTextStep =
        PHONE_STATE_TEXT_STEPS[timeline[currentIndex]?.state] ?? -1;

      for (let index = currentIndex - 1; index >= 0; index--) {
        const textStep = PHONE_STATE_TEXT_STEPS[timeline[index].state] ?? -1;

        if (textStep < currentTextStep) {
          return index;
        }
      }

      return -1;
    };
    const firstPhaseTextIsActuallyVisible = () => {
      const activePhrase = shuffleText?.querySelector(
        ".section-main__shuffle-phrase_active",
      );

      return (
        currentDigit === 1 &&
        activePhrase?.dataset.step === "0" &&
        shuffleText.classList.contains("section-main__shuffle-text_visible")
      );
    };
    const getReverseTextTransitionStep = () => {
      const renderedState = phone.className.match(PHONE_STATE_REGEX)?.[0];
      const renderedTextStep = PHONE_STATE_TEXT_STEPS[renderedState];
      const firstPhaseTextIsVisible =
        renderedTextStep === 0 && firstPhaseTextIsActuallyVisible();

      if (firstPhaseTextIsVisible) {
        return 0;
      }

      const timeline = getPhoneTimeline();
      const pinnedIndex = timeline.findIndex(
        (item) => item.state === scrollRoot.dataset.reverseTarget,
      );
      const logicalIndex = getLogicalTimelineIndex(timeline);
      const currentIndex = pinnedIndex >= 0 ? pinnedIndex : logicalIndex;

      if (currentIndex < 0) {
        return null;
      }

      const currentTextStep =
        PHONE_STATE_TEXT_STEPS[timeline[currentIndex].state] ?? -1;
      const previousTextStep =
        PHONE_STATE_TEXT_STEPS[timeline[currentIndex - 1]?.state] ?? -1;

      return previousTextStep < currentTextStep ? currentTextStep : null;
    };
    const getPhaseBoundaryScrollTop = (textStep) => {
      const rootRect = scrollRoot.getBoundingClientRect();
      const phaseBoundaryElement =
        textStep === 0
          ? document.querySelector(".anchor__item_1-0")
          : blocks[textStep];

      if (!phaseBoundaryElement) {
        return null;
      }

      const phaseBoundaryRect = phaseBoundaryElement.getBoundingClientRect();
      const phaseBoundaryRatio = textStep === 0 ? 0.5 : STAGE_CHANGE_POINT;

      return (
        scrollRoot.scrollTop +
        phaseBoundaryRect.top -
        rootRect.top +
        phaseBoundaryRect.height * phaseBoundaryRatio -
        scrollRoot.clientHeight / 2
      );
    };
    const getIntroStickyStartScrollTop = () => {
      const rootRect = scrollRoot.getBoundingClientRect();
      const mainRect = mainSection.getBoundingClientRect();

      return scrollRoot.scrollTop + mainRect.top - rootRect.top;
    };
    const commitReverseNavigation = (
      fromState,
      targetState,
      targetScrollTop,
      synchronizedTextStep = null,
    ) => {
      if (fromState !== targetState && lockWheelInput("reverse-navigation")) {
        clearTimeout(reverseNavigationInputTimer);
        reverseNavigationInputTimer = setTimeout(() => {
          completeWheelInputTransition("reverse-navigation");
        }, PHASE_TRANSITION_DURATION);
      }

      if (Number.isFinite(targetScrollTop)) {
        scrollRoot.scrollTop = Math.max(targetScrollTop, 0);
      }

      if (Number.isFinite(synchronizedTextStep)) {
        currentDigit = synchronizedTextStep + 1;
        if (synchronizedTextStep === 0) {
          clearTimeout(firstStageReverseTextTimer);
          firstStageSequenceState = "active";
        }
        dispatchTextStepChange(synchronizedTextStep, {
          direction: -1,
          synchronizeDigit: true,
        });
      }

      scrollRoot.dataset.reverseFrom = fromState;
      scrollRoot.dataset.reverseTarget = targetState;
      document.dispatchEvent(
        new CustomEvent(PHONE_REVERSE_STEP_EVENT, {
          detail: { state: targetState },
        }),
      );
    };
    const restoreLastStageFromFooter = () => {
      const timeline = getPhoneTimeline();
      const logicalIndex = getLogicalTimelineIndex(timeline);
      const lastIndex = timeline.length - 1;

      if (logicalIndex !== lastIndex || lastIndex < 0) {
        return false;
      }

      const lastItem = timeline[lastIndex];
      const phaseBoundary = getPhaseBoundaryScrollTop(
        PHONE_STATE_TEXT_STEPS[lastItem.state],
      );
      const targetScrollTop = Math.max(
        lastItem.activationScrollTop + 2,
        (phaseBoundary ?? lastItem.activationScrollTop) + 2,
      );

      if (targetScrollTop >= scrollRoot.scrollTop - 1) {
        return false;
      }

      const finalDigit = PHONE_STATE_TEXT_STEPS[lastItem.state] + 1;
      currentDigit = finalDigit;
      zeroIsVisible = true;
      clearTimeout(zeroTransitionTimer);
      counterBlock.classList.remove(
        "section-main__counter-block_zero-entering",
        "section-main__counter-block_zero-exiting",
        "section-main__counter-block_zero-scroll-controlled",
        "section-main__counter-block_zero-visible",
        "section-main__counter-block_zero-hidden",
      );
      counterBlock.classList.add("section-main__counter-block_zero-visible");
      numberCont.className = numberCont.className.replace(
        /_\d+-\d+$/,
        `_${finalDigit}-${finalDigit}`,
      );
      commitReverseNavigation(
        phone.className.match(PHONE_STATE_REGEX)?.[0] ?? "—",
        lastItem.state,
        null,
      );
      return true;
    };
    const startFooterReverseAssetsSequence = () => {
      if (footerReverseSequenceIsActive) {
        return true;
      }

      const owner = "footer-reverse-sequence";
      footerReverseSequenceIsActive = true;
      lockWheelInput(owner);
      footerForwardStage = "reverse-assets-entering";
      footerReverseAssetsGestureId = currentWheelGestureId;
      pinFooterSequenceToBoundary();
      counterBlock.classList.add("section-main__counter-block_shown");
      mainSection.classList.remove(
        "section-main_footer-assets-hidden",
        "section-main_footer-digit-hidden",
        "section-main_footer-scaffold-hidden",
        "section-main_footer-screen-hidden",
      );
      scrollRoot.dataset.reverseGesture = "active";
      scrollRoot.dataset.reverseMode =
        "одновременный возврат скриншота, скелета и цифры";
      footerReverseSequenceTimers.push(
        setTimeout(() => {
          footerReverseSequenceIsActive = false;
          footerReverseSequenceTimers = [];
          footerForwardStage = "reverse-text-ready";
          footerReverseApproachGestureId = null;
          scrollRoot.dataset.reverseGesture = "idle";
          completeWheelInputTransition(owner);
        }, FOOTER_ASSETS_TRANSITION_DURATION),
      );
      return true;
    };
    const startFooterReverseTextSequence = () => {
      if (footerReverseSequenceIsActive) {
        return true;
      }

      const owner = "footer-reverse-text-in";
      footerReverseSequenceIsActive = true;
      lockWheelInput(owner);
      footerForwardStage = "reverse-text-entering";
      pinFooterSequenceToBoundary();
      footerReturnTextPending = false;
      dispatchTextStepChange(currentDigit - 1, {
        direction: -1,
      });
      scrollRoot.dataset.reverseGesture = "active";
      scrollRoot.dataset.reverseMode = "возврат текста";
      footerReverseSequenceTimers.push(
        setTimeout(() => {
          footerReverseSequenceIsActive = false;
          footerReverseSequenceTimers = [];
          footerForwardStage = "reverse-ready";
          scrollRoot.dataset.reverseGesture = "idle";
          completeWheelInputTransition(owner);
        }, FOOTER_ASSETS_TRANSITION_DURATION),
      );
      return true;
    };
    const startFooterReverseApproach = () => {
      if (footerReverseSequenceIsActive) {
        return true;
      }

      // Validate the footer position before changing visual state or taking
      // the global input lock. This function can be reached from the generic
      // reverse router, including while phase 1 is at its sticky boundary.
      if (!restoreLastStageFromFooter()) {
        return false;
      }

      footerReturnTextPending = true;
      footerReverseWasRestored = false;
      footerReverseApproachGestureId = currentWheelGestureId;
      mainSection.classList.add(
        "section-main_footer-sequence-controlled",
        "section-main_footer-assets-hidden",
        "section-main_footer-digit-hidden",
        "section-main_footer-scaffold-hidden",
        "section-main_footer-screen-hidden",
      );
      dispatchTextStepChange(-1, {
        boundary: "footer",
        direction: -1,
      });
      const triggerScrollTop = getFooterReverseTriggerScrollTop();
      footerSequencePinnedScrollTop = null;
      footerForwardStage =
        scrollRoot.scrollTop <= triggerScrollTop + 0.5
          ? "reverse-assets-ready"
          : "reverse-approach";
      scrollRoot.dataset.reverseMode =
        footerForwardStage === "reverse-approach"
          ? "ручной возврат к мокапу"
          : "возврат экрана";
      if (footerForwardStage === "reverse-assets-ready") {
        footerSequencePinnedScrollTop = triggerScrollTop;
      }
      return true;
    };
    const moveToPreviousPhoneState = () => {
      const timeline = getPhoneTimeline();
      const renderedState = phone.className.match(PHONE_STATE_REGEX)?.[0];
      const firstPhaseTextIsVisible =
        PHONE_STATE_TEXT_STEPS[renderedState] === 0 &&
        firstPhaseTextIsActuallyVisible();

      if (firstPhaseTextIsVisible) {
        const searchBoundaryScrollTop = getPhaseBoundaryScrollTop(0);
        const searchHoldScrollTop =
          searchBoundaryScrollTop === null
            ? null
            : searchBoundaryScrollTop + INTRO_SEARCH_SCROLL_GAP - 2;

        animateZeroVisibility(false);
        hideActiveNumberDigit();
        dispatchTextStepChange(-1, {
          boundary: "search",
          direction: -1,
        });
        commitReverseNavigation(renderedState, "1-0", searchHoldScrollTop);
        return true;
      }

      const pinnedState = scrollRoot.dataset.reverseTarget;
      const pinnedIndex = timeline.findIndex(
        (item) => item.state === pinnedState,
      );
      const logicalIndex = getLogicalTimelineIndex(timeline);
      const currentIndex = pinnedIndex >= 0 ? pinnedIndex : logicalIndex;

      if (currentIndex < 0) {
        return false;
      }

      const currentItem = timeline[currentIndex];
      // Reverse navigation is phase-based: skip all intermediate mockup
      // screens and land on the final screen of the previous phase.
      const previousPhaseLastIndex = getPreviousPhaseLastIndex(
        timeline,
        currentIndex,
      );
      const previousItem = timeline[previousPhaseLastIndex];
      const nextItemAfterPreviousPhase = timeline[previousPhaseLastIndex + 1];
      const currentState = currentItem.state;
      const previousState = previousItem?.state ?? "999-999";
      const currentTextStep = PHONE_STATE_TEXT_STEPS[currentState] ?? -1;
      const previousTextStep = PHONE_STATE_TEXT_STEPS[previousState] ?? -1;
      const isReturningToSearch =
        previousState === "1-0" && currentState !== "1-0";
      let previousStateScrollTop =
        nextItemAfterPreviousPhase?.activationScrollTop - 2;

      if (previousTextStep < currentTextStep) {
        const phaseBoundaryScrollTop =
          getPhaseBoundaryScrollTop(currentTextStep);

        if (phaseBoundaryScrollTop !== null) {
          previousStateScrollTop = Math.min(
            previousStateScrollTop,
            phaseBoundaryScrollTop - 2,
          );
        }
      }

      if (currentState === "1-0" && previousTextStep < 0) {
        previousStateScrollTop = getIntroStickyStartScrollTop();
      }

      if (previousStateScrollTop >= scrollRoot.scrollTop - 1) {
        previousStateScrollTop = previousItem
          ? previousItem.activationScrollTop + scrollRoot.clientHeight / 2
          : scrollRoot.scrollTop - scrollRoot.clientHeight;
      }

      if (isReturningToSearch) {
        animateZeroVisibility(false);
        hideActiveNumberDigit();
        dispatchTextStepChange(-1, {
          boundary: "search",
          direction: -1,
        });
      }

      commitReverseNavigation(
        renderedState ?? currentState,
        previousState,
        previousStateScrollTop,
        previousTextStep < currentTextStep && previousTextStep >= 0
          ? previousTextStep
          : null,
      );
      return true;
    };
    document.addEventListener(INTRO_SEQUENCE_RESET_EVENT, () => {
      clearTimeout(reverseGestureEndTimer);
      reverseGestureIsActive = false;
      reverseGestureAllowsNativeScroll = false;
      forwardIntentDistance = 0;
      reverseTextHoldStep = null;
      reverseTextHoldRemaining = 0;
      clearFooterReverseSequence();
      scrollRoot.dataset.reverseGesture = "idle";
      scrollRoot.dataset.reverseTarget = "—";
      scrollRoot.dataset.reverseFrom = "—";
      scrollRoot.dataset.reverseMode = "—";
    });

    const handleReverseWheel = (event) => {
      if (event.defaultPrevented) {
        return;
      }

      if (event.deltaY > 0) {
        reverseTextHoldStep = null;
        reverseTextHoldRemaining = 0;
        footerReverseWasRestored = false;
        if (footerReverseSequenceIsActive) {
          clearFooterReverseSequence();
        }

        if (handleFooterForwardWheel(event)) {
          return;
        }

        forwardIntentDistance += Math.max(getWheelDeltaInPixels(event), 0);

        if (
          reverseGestureIsActive &&
          forwardIntentDistance < FORWARD_DIRECTION_CONFIRM_DISTANCE
        ) {
          event.preventDefault();
          scheduleReverseGestureEnd();
          return;
        }

        clearTimeout(reverseGestureEndTimer);
        reverseGestureIsActive = false;
        reverseGestureAllowsNativeScroll = false;
        forwardIntentDistance = 0;
        scrollRoot.dataset.reverseGesture = "idle";
        scrollRoot.dataset.reverseTarget = "—";
        scrollRoot.dataset.reverseFrom = "—";
        scrollRoot.dataset.reverseMode = "—";
        document.dispatchEvent(new Event(PHONE_REVERSE_CANCEL_EVENT));
        return;
      }

      if (event.deltaY === 0) {
        return;
      }

      forwardIntentDistance = 0;

      if (event.ctrlKey || event.target.closest(".modal-window_shown")) {
        return;
      }

      if (footerReverseSequenceIsActive) {
        event.preventDefault();
        return;
      }

      if (footerForwardStage === "reverse-approach") {
        const triggerScrollTop = getFooterReverseTriggerScrollTop();
        const nextScrollTop =
          scrollRoot.scrollTop + getWheelDeltaInPixels(event);

        if (nextScrollTop <= triggerScrollTop) {
          event.preventDefault();
          footerSequencePinnedScrollTop = triggerScrollTop;
          footerForwardStage = "reverse-assets-ready";
          scrollRoot.scrollTop = triggerScrollTop;
        }
        return;
      }

      if (footerForwardStage === "reverse-assets-ready") {
        event.preventDefault();

        if (getWheelGestureId(event) === footerReverseApproachGestureId) {
          return;
        }

        startFooterReverseAssetsSequence();
        return;
      }

      if (footerForwardStage === "reverse-text-ready") {
        event.preventDefault();

        if (getWheelGestureId(event) === footerReverseAssetsGestureId) {
          return;
        }

        footerReverseAssetsGestureId = null;
        startFooterReverseTextSequence();
        return;
      }

      if (
        footerForwardStage.endsWith("-exiting") ||
        footerForwardStage.endsWith("-entering")
      ) {
        event.preventDefault();
        return;
      }

      const footerSequenceWasRestored =
        footerForwardStage === "reverse-ready";
      if (footerSequenceWasRestored) {
        footerReverseWasRestored = true;
        footerForwardStage = "idle";
        footerSequencePinnedScrollTop = null;
        mainSection.classList.remove(
          "section-main_footer-sequence-controlled",
          "section-main_footer-assets-hidden",
          "section-main_footer-digit-hidden",
          "section-main_footer-scaffold-hidden",
          "section-main_footer-screen-hidden",
        );
      }

      if (scrollRoot.dataset.introReverseSequence === "active") {
        clearTimeout(reverseGestureEndTimer);
        reverseGestureIsActive = false;
        reverseGestureAllowsNativeScroll = false;
        scrollRoot.dataset.reverseGesture = "idle";
        scrollRoot.dataset.reverseMode = "управляется скроллом";
        return;
      }

      const boundaryOpacity = Number.parseFloat(
        counterBlock.style.getPropertyValue("--boundary-opacity"),
      );
      const lastPhoneState = Object.keys(PHONE_STATE_TEXT_STEPS).at(-1);
      const renderedPhoneState = phone.className.match(PHONE_STATE_REGEX)?.[0];
      const lastStageIsRendered = renderedPhoneState === lastPhoneState;
      const isFooterReturn =
        !footerReverseWasRestored &&
        (footerForwardStage === "complete" ||
          footerForwardStage === "text-hidden" ||
          footerForwardStage === "assets-hidden" ||
          (!footerSequenceWasRestored &&
            lastStageIsRendered &&
            (!Number.isFinite(boundaryOpacity) || boundaryOpacity < 0.999)));
      const reverseTransitionStep =
        counterIsActive && !isFooterReturn
          ? getReverseTextTransitionStep()
          : null;

      if (reverseTransitionStep !== null) {
        if (reverseTextHoldStep !== reverseTransitionStep) {
          reverseTextHoldStep = reverseTransitionStep;
          reverseTextHoldRemaining = TEXT_PHASE_HOLD_SCROLL_DISTANCE;
        }

        event.preventDefault();
        reverseTextHoldRemaining = Math.max(
          reverseTextHoldRemaining - Math.abs(getWheelDeltaInPixels(event)),
          0,
        );
        scrollRoot.dataset.reverseMode = "удержание текста 200px";

        if (reverseTextHoldRemaining > 0) {
          return;
        }

        reverseTextHoldStep = null;
      } else {
        reverseTextHoldStep = null;
        reverseTextHoldRemaining = 0;
      }

      if (reverseGestureIsActive) {
        if (!reverseGestureAllowsNativeScroll) {
          event.preventDefault();
        }
        scheduleReverseGestureEnd();
        return;
      }

      const navigationWasHandled = isFooterReturn
        ? startFooterReverseApproach()
        : moveToPreviousPhoneState();

      if (navigationWasHandled) {
        if (isFooterReturn) {
          if (footerForwardStage !== "reverse-approach") {
            event.preventDefault();
          }
          reverseGestureCount++;
          scrollRoot.dataset.reverseGestureCount = String(reverseGestureCount);
          return;
        }

        event.preventDefault();
        footerReverseWasRestored = false;

        if (scrollRoot.dataset.introReverseSequence === "active") {
          clearTimeout(reverseGestureEndTimer);
          reverseGestureIsActive = false;
          reverseGestureAllowsNativeScroll = false;
          footerReturnTextPending = false;
          scrollRoot.dataset.reverseGesture = "idle";
          scrollRoot.dataset.reverseMode = "управляется скроллом";
          return;
        }

        reverseGestureIsActive = true;
        reverseGestureAllowsNativeScroll = false;
        footerReturnTextPending = false;
        reverseGestureCount++;
        scrollRoot.dataset.reverseGesture = "active";
        scrollRoot.dataset.reverseMode = isFooterReturn
          ? "плавный возврат"
          : "один шаг";
        scrollRoot.dataset.reverseGestureCount = String(reverseGestureCount);
        scheduleReverseGestureEnd();
        return;
      }

      if (!counterIsActive) {
        return;
      }

      scrollRoot.scrollTop +=
        getWheelDeltaInPixels(event) * (REVERSE_WHEEL_SCROLL_MULTIPLIER - 1);
    };
    reverseWheelHandler = handleReverseWheel;
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
    const options = {
      root: scrollRoot,
      threshold: 0,
    };
    const updateCounterActivationPoint = () => {
      const nextPhoneStateAnchor = document.querySelector(".anchor__item_1-0");

      if (!nextPhoneStateAnchor) {
        return;
      }

      const mainRect = mainSection.getBoundingClientRect();
      const anchorRect = nextPhoneStateAnchor.getBoundingClientRect();

      counterActiveZone.style.top = `${
        anchorRect.top -
        mainRect.top +
        anchorRect.height / 2 +
        scrollRoot.clientHeight / 2 +
        INTRO_SEARCH_SCROLL_GAP
      }px`;
    };

    const callback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          counterIsActive = true;
          currentDigit = getDigitForCurrentScroll();
          const shouldRunFirstStageSequence =
            currentDigit === 1 && !footerReturnTextPending;
          const firstStageScreenIsVisible = /phone__content_1-0(?:\s|$)/.test(
            document.getElementById("phone").className,
          );
          const isWaitingForFirstScaffold =
            shouldRunFirstStageSequence &&
            (!firstStageScreenIsVisible ||
              firstStageSequenceState === "forward-screen" ||
              firstStageSequenceState === "forward-wait-scaffold");
          const shouldInitializeFirstStageSequence =
            shouldRunFirstStageSequence &&
            !isWaitingForFirstScaffold &&
            (firstStageSequenceState === "idle" ||
              firstStageSequenceState === "reverse-complete");

          // Entering phase 1 from phase 2 already synchronizes the sequence
          // to "active". Preserve it here; resetting it to a forward entrance
          // made the rest of phase 1 collapse into the intro on the same pass.
          if (shouldInitializeFirstStageSequence) {
            lockWheelInput("first-stage-visuals-in");
            startFirstStageScaffoldInSequence(
              currentWheelGestureId,
              "first-stage-visuals-in",
            );
          }
          if (
            !isWaitingForFirstScaffold &&
            !shouldInitializeFirstStageSequence
          ) {
            document.dispatchEvent(
              new CustomEvent(INTRO_SCAFFOLD_VISIBILITY_EVENT, {
                detail: { visible: true },
              }),
            );
          }

          // coverSection.classList.add("section-cover_scrolled");
          // longDecorationLine.classList.add(
          //   "section-main__decoration_long_hidden",
          // );
          counterBlock.classList.add("section-main__counter-block_shown");
          shuffleText.classList.remove(
            "section-main__shuffle-text_first-entry",
          );
          if (!footerReturnTextPending && !shouldRunFirstStageSequence) {
            dispatchTextStepChange(currentDigit - 1);
          }
          contentBlock.classList.add("section-main__content-block_shown");
          if (footerSection.getBoundingClientRect().top < window.innerHeight) {
            return;
          }
          // setMainCornerShown(true);
          // setMainRightPlusShown(true);
        } else {
          const rootRect = scrollRoot.getBoundingClientRect();
          const activeZoneRect = entry.target.getBoundingClientRect();
          const activeZoneIsCurrentlyVisible =
            activeZoneRect.bottom > rootRect.top &&
            activeZoneRect.top < rootRect.bottom;
          const isReturningToIntro = activeZoneRect.top >= rootRect.bottom;

          // The callback describes the geometry captured when the observer
          // queued it, not necessarily the current layout. A phase/text
          // transition can move this marker out and back before delivery. If
          // it is visible now, tearing the counter down would shrink the main
          // section, jump scrollTop by several phases and then re-enter with a
          // stale digit.
          if (activeZoneIsCurrentlyVisible) {
            counterIsActive = true;
            logScrollDebug("stale-counter-exit-ignored", {
              entryTop: Math.round(entry.boundingClientRect.top),
              currentTop: Math.round(activeZoneRect.top),
              currentBottom: Math.round(activeZoneRect.bottom),
            });
            return;
          }

          // Layout changes during the reverse text/digit/scaffold sequence can
          // briefly push the activation marker outside the viewport. That is
          // not a real exit and must not let this generic observer tear down
          // the remaining visuals or re-show a digit from another phase.
          if (
            isReturningToIntro &&
            firstStageOwnsPinnedScrollPosition()
          ) {
            counterIsActive = true;
            logScrollDebug("first-stage-boundary-exit-held", {
              firstStageSequenceState,
              displacedScrollTop: Math.round(scrollRoot.scrollTop),
              pinnedScrollTop: Number.isFinite(firstStagePinnedScrollTop)
                ? Math.round(firstStagePinnedScrollTop)
                : null,
            });
            if (
              Number.isFinite(firstStagePinnedScrollTop) &&
              Math.abs(scrollRoot.scrollTop - firstStagePinnedScrollTop) > 1
            ) {
              scrollRoot.scrollTop = firstStagePinnedScrollTop;
            }
            return;
          }

          const wasCounterActive = counterIsActive;
          counterIsActive = false;
          counterBlock.classList.remove(
            "section-main__counter-block_digits-waiting",
          );

          if (isReturningToIntro) {
            document.dispatchEvent(
              new CustomEvent(INTRO_SCAFFOLD_VISIBILITY_EVENT, {
                detail: { visible: false },
              }),
            );
            animateZeroVisibility(false);
            if (wasCounterActive) {
              hideActiveNumberDigit();
            } else {
              numberCont.className = numberCont.className.replace(
                NUMBER_CLASS_REGEX,
                "_0-0",
              );
            }
          }
          // coverSection.classList.remove("section-cover_scrolled");
          // longDecorationLine.classList.remove(
          //   "section-main__decoration_long_hidden",
          // );
          // Keep the counter layer mounted at the footer boundary. Its digits,
          // the phone screenshot and the scaffold now use the same
          // scroll-controlled opacity in both directions.
          contentBlock.classList.remove("section-main__content-block_shown");
          dispatchTextStepChange(-1, {
            boundary: isReturningToIntro ? "intro" : "footer",
          });
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
    const BOUNDARY_FADE_DISTANCE_IN_VIEWPORTS = 0.9;
    const mainSection = document.getElementById("section-main");
    const counterBlock = document.getElementById("counter");
    const shuffleLayer = document.querySelector(".section-main__shuffle-layer");
    const shuffleText = document.querySelector(".section-main__shuffle-text");
    const phone = document.getElementById("phone");
    let frameId = null;
    let sectionTop = 0;
    let stickyDistance = 0;
    let fadeDistance = 1;
    let lastOpacity = null;
    let logoIsVisible = false;

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const refreshMetrics = () => {
      const rootRect = scrollRoot.getBoundingClientRect();
      const sectionRect = mainSection.getBoundingClientRect();

      sectionTop = scrollRoot.scrollTop + sectionRect.top - rootRect.top;
      stickyDistance = Math.max(
        mainSection.offsetHeight - scrollRoot.clientHeight,
        0,
      );
      fadeDistance = Math.max(
        scrollRoot.clientHeight * BOUNDARY_FADE_DISTANCE_IN_VIEWPORTS,
        1,
      );
    };
    const updateOpacity = () => {
      frameId = null;
      const localScroll = scrollRoot.scrollTop - sectionTop;
      const exitOpacity = (stickyDistance - localScroll) / fadeDistance;
      const exitProgress = clamp(exitOpacity, 0, 1);
      const outroProgress = 1 - exitProgress;
      const textHoldProgress = clamp(
        TEXT_PHASE_HOLD_SCROLL_DISTANCE / fadeDistance,
        0,
        1,
      );
      const textOpacity =
        1 - clamp((outroProgress - textHoldProgress) / 0.22, 0, 1);
      const scaffoldOpacity = 1 - clamp((outroProgress - 0.58) / 0.24, 0, 1);
      // Fractional layout pixels can leave the sticky stage just below zero.
      // Treat that position as settled so the logo never needs an extra wheel.
      const introIsVisible = localScroll >= -1;
      const introIsActive = localScroll <= scrollRoot.clientHeight;

      if (introIsActive && logoIsVisible !== introIsVisible) {
        logoIsVisible = introIsVisible;
        document.dispatchEvent(
          new CustomEvent(INTRO_LOGO_VISIBILITY_EVENT, {
            detail: { visible: logoIsVisible },
          }),
        );
      }

      if (
        lastOpacity === null ||
        Math.abs(scaffoldOpacity - lastOpacity) > 0.0001
      ) {
        const opacityValue = scaffoldOpacity.toFixed(4);

        counterBlock.style.setProperty("--boundary-opacity", opacityValue);
        shuffleLayer.style.setProperty("--boundary-opacity", opacityValue);
        lastOpacity = scaffoldOpacity;
      }

      shuffleText.style.setProperty(
        "--outro-text-opacity",
        textOpacity.toFixed(4),
      );
      phone.style.setProperty(
        "--outro-phone-content-opacity",
        scaffoldOpacity.toFixed(4),
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
    const phoneStateObserver = new MutationObserver(requestOpacityUpdate);
    phoneStateObserver.observe(phone, {
      attributes: true,
      attributeFilter: ["class"],
    });
    window.addEventListener("resize", () => {
      refreshMetrics();
      requestOpacityUpdate();
    });
    refreshMetrics();
    updateOpacity();
    requestAnimationFrame(() => {
      refreshMetrics();
      requestOpacityUpdate();
    });
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
        const introStageScrollMultiplier = 0.4;
        const stageScrollMultiplier = 4.4;
        const textContainerSize =
          visibleSize *
          (introStageScrollMultiplier +
            (NUMBER_OF_BLOCKS - 1) * stageScrollMultiplier +
            4.6); //+4.6 includes intro, final hold, and opacity tail;
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

      centerPhone();
    };
    window.addEventListener("resize", () => {
      setTimeout(changeMode, 250);
    });
    changeMode();
    window.addEventListener("load", centerPhone, { once: true });
    return changeMode;
  };

  refreshSizes = setNewScreenProps();
  createNumberIntersectionObserver(blocks);
  createPhoneAnimation(blocks);
  createShuffleTextAnimation(blocks);
  // createMainCornerAnimation();
  createCounterBoundaryFade();
  createMainIntersectionObserver();
  createReverseWheelAcceleration();
  createEndIntersectionObserver();

  const wheelRoutes = [
    ["first-stage", handleFirstStageSequenceWheel],
    ["intro-forward", introForwardWheelHandler],
    ["intro-reverse", introReverseWheelHandler],
    ["typing", handleTypingWheelInput],
    ["phase-navigation", reverseWheelHandler],
  ];
  const handleWheelInput = (event) => {
    const previousDeltaBeforeTracking = previousWheelDelta;
    const directionTailWasSuppressed = trackWheelGesture(event);
    if (directionTailWasSuppressed) {
      event.preventDefault();
      return;
    }
    const gestureId = getWheelGestureId(event);

    if (
      introReverseNativeScrollIsActive &&
      event.deltaY < 0 &&
      scrollRoot.scrollTop > 1
    ) {
      logScrollDebug("intro-reverse-native-scroll", {
        gestureId,
        sourceGestureId: introReverseNativeScrollGestureId,
        deltaY: event.deltaY,
      });
      return;
    }

    if (introReverseNativeScrollIsActive) {
      logScrollDebug("intro-reverse-native-scroll-stop", {
        gestureId,
        sourceGestureId: introReverseNativeScrollGestureId,
        deltaY: event.deltaY,
        reason: scrollRoot.scrollTop <= 1 ? "start-boundary" : "direction-change",
      });
      stopIntroReverseNativeScroll();
    }

    if (
      wheelInputLock?.owner === "phase-transition" &&
      wheelInputLock.animationComplete &&
      event.deltaY > 0
    ) {
      const currentDelta = Math.abs(event.deltaY);
      const inputIsNotDecaying =
        currentDelta >= WHEEL_GESTURE_RESTART_DELTA &&
        (previousDeltaBeforeTracking === 0 ||
          currentDelta >= previousDeltaBeforeTracking * 0.85);

      wheelInputLock.continuationEventCount = inputIsNotDecaying
        ? wheelInputLock.continuationEventCount + 1
        : 0;

      if (wheelInputLock.continuationEventCount >= 2) {
        logScrollDebug("wheel-input-forward-renewed", {
          gestureId,
          owner: wheelInputLock.owner,
          currentDelta,
          previousDelta: previousDeltaBeforeTracking,
        });
        releaseWheelInputIfReady(gestureId, { allowActiveGesture: true });
      }
    }

    if (wheelInputLock) {
      event.preventDefault();
      logScrollDebug("wheel-input-held", {
        gestureId,
        owner: wheelInputLock.owner,
        animationComplete: wheelInputLock.animationComplete,
        firstStageSequenceState,
      });
      return;
    }

    for (const [owner, handler] of wheelRoutes) {
      if (!handler) {
        continue;
      }

      const routeWasHandled = handler(event) === true;
      if (routeWasHandled || event.defaultPrevented) {
        logScrollDebug("wheel-consumed", {
          gestureId: getWheelGestureId(event),
          owner,
          firstStageSequenceState,
          nativeScrollAllowed: routeWasHandled && !event.defaultPrevented,
        });
        return;
      }
    }
  };

  // The page has one wheel listener. Phase controllers are plain functions
  // called in a fixed priority order, and routing stops after one consumes the
  // event. This keeps a single physical gesture from reaching two timelines.
  wheelEventTarget.addEventListener("wheel", handleWheelInput, {
    capture: true,
    passive: false,
  });
};

import { refreshSizes } from "@/scripts/scrollAnimations";

export const LANGUAGE_CHANGE_EVENT = "buncher:language-change";

let currentLanguage = "en";

const scrollAnimationTextSteps = {
  ru: [
    {
      text: "общие вызовы, идеи и интересы внутри поиска",
      highlight: ["внутри"],
    },
    {
      text: "Адаптивный и понятный личный мессенджер",
      highlight: ["понятный"],
    },
    {
      text: "поддержка проектного комьюнити и рабочих команд",
      highlight: ["поддержка"],
    },
    {
      text: "нативные и безопасные интеракции с git",
      highlight: ["безопасные"],
    },
    {
      text: "удобная подписочная фримиум модель",
      highlight: ["фримиум"],
    },
  ],
  en: [
    {
      text: "common challenges, ideas and interests inside search",
      highlight: ["inside"],
    },
    {
      text: "Adaptive and clear personal messenger",
      highlight: ["clear"],
    },
    {
      text: "support for project communities and working teams",
      highlight: ["support"],
    },
    {
      text: "native and secure interactions with git",
      highlight: ["secure"],
    },
    {
      text: "convenient subscription freemium model",
      highlight: ["freemium"],
    },
  ],
};

export const getCurrentLanguage = () => currentLanguage;

export const getScrollAnimationTextSteps = () =>
  scrollAnimationTextSteps[currentLanguage] ?? scrollAnimationTextSteps.en;

export const setLanguageSelectorBehavior = function () {
  const LANG_ANIM_LENGTH = 300;
  const LANGUAGES = {
    RU: "ru",
    EN: "en",
  };

  const lang = {
    lang: {
      ru: "РУ",
      en: "EN",
    },
    coverText: {
      ru: "Знакомьтесь с новыми проектами и людьми в IT так, как вы этого хотите",
      en: "Meet new IT projects and people the way you want",
    },
    article1: {
      ru: "управляйте карьерой через профессиональные знакомства без лишнего стресса",
      en: "manage your career through professional dating without unnecessary stress",
    },
    article2: {
      ru: "персонализируйте ожидания и находите\u00A0точные профессиональные совпадения",
      en: "personalize your expectations and find exact professional matches",
    },
    article3: {
      ru: `управляйте контактами согласно\u00A0своим профессиональным потребностям`,
      en: "manage contacts according to your professional needs",
    },
    article4: {
      ru: "настройте опции приложения и получите лучшие контакты",
      en: "customize app options and get the best contacts",
    },
    article5: {
      ru: "общайтесь, находите для себя общие вызовы, идеи и интересы",
      en: "chat, find common professional challenges, ideas and\u00A0interests",
    },

    footerHeader: {
      ru: "Начать с Buncher",
      en: "Start with Buncher",
    },
    footerDescription: {
      ru: "И создать свой экспертный вайб",
      en: "And create your expert vibe",
    },
    policy: {
      ru: "Политика конфиденциальности",
      en: "Privacy policy",
    },
    termsOfUse: {
      ru: "Условия использования",
      en: "Terms and conditions",
    },
    linkedIn: {
      ru: "https://www.linkedin.com/showcase/buncher-app-ru",
      en: "https://www.linkedin.com/company/buncher-app",
    },
  };
  const langContainersMap = {
    policy: {
      en: undefined,
      ru: undefined,
    },
    termsOfUse: {
      en: undefined,
      ru: undefined,
    },
  };

  const changeInlineLanguage = (language, elements) => {
    elements.forEach((el) => {
      const key = el.dataset.key;
      try {
        el.textContent = lang[key][language];
      } catch (err) {
        console.error(err);
      }
    });
  };
  const changeBlockLanguage = (language, blocks) => {
    blocks.forEach((el) => {
      if (el.dataset.lang === language) {
        el.classList.remove("modal-window__content_hidden");
      } else {
        el.classList.add("modal-window__content_hidden");
      }
    });
  };

  const changeImageLanguage = (language, images) => {
    const reg = /(.*\/)([^\/]+)(\/[^\/]*)$/; //first folder from the end. Second group is target

    function replacer(match, p1, p2, p3) {
      return [p1, language, p3].join("");
    }

    images.forEach((img) => {
      img.src = img.src.replace(reg, replacer);
    });
  };

  const changeLinks = (language, elements) => {
    elements.forEach((el) => {
      const key = el.dataset.key;
      try {
        el.setAttribute("href", lang[key][language]);
      } catch (err) {
        console.error(err);
      }
    });
  };

  const changeLanguage = (language, elements, blocks, images, links) => {
    currentLanguage = language;
    document.documentElement.lang = language;
    changeInlineLanguage(language, elements);
    changeBlockLanguage(language, blocks);
    changeImageLanguage(language, images);
    changeLinks(language, links);
    document.dispatchEvent(
      new CustomEvent(LANGUAGE_CHANGE_EVENT, {
        detail: { language },
      }),
    );
    refreshSizes();
  };

  const langElements = document.querySelectorAll(".lang");
  const langContainers = document.querySelectorAll(".lang-container");
  const phoneImages = document.querySelectorAll(".lang-img");
  const langLinks = document.querySelectorAll(".lang-link");
  langContainers.forEach(
    (el) => (langContainersMap[el.dataset.key][el.dataset.lang] = el),
  );

  const customDropdown = document.getElementById("languageSelector");
  const options = document.querySelector(".header__language-options");
  const optionElements = document.querySelectorAll(".header__language-option");
  let selectedIndex = -1;

  let initialLanguage;
  const browserPref = navigator.language.split("-")[0];

  switch (browserPref) {
    case LANGUAGES.RU:
      initialLanguage = LANGUAGES.RU;
      break;
    default:
      initialLanguage = LANGUAGES.EN;
  }

  const hideDropdown = () => {
    selectedIndex = -1;
    options.classList.add("header__language-options_closed");
    setTimeout(() => {
      updateSelection();
      options.style.display = "none";
    }, LANG_ANIM_LENGTH);
  };
  const showDropdown = () => {
    options.classList.remove("header__language-options_closed");
    options.style.display = "block";
  };

  const open = (e) => {
    if (options.style.display !== "block") {
      e.stopPropagation();
      showDropdown();
    }
  };

  const close = (e) => {
    if (!options.contains(e.target)) {
      hideDropdown();
    }
  };

  const chooseOption = (curOption) => {
    changeLanguage(
      curOption.dataset.lang,
      langElements,
      langContainers,
      phoneImages,
      langLinks,
    );
    hideDropdown();

    setTimeout(() => {
      optionElements.forEach((option) => {
        if (option === curOption) {
          option.classList.add("header__language-option_selected");
        } else {
          option.classList.remove("header__language-option_selected");
        }
      });
    }, LANG_ANIM_LENGTH);
  };

  const updateSelection = () => {
    optionElements.forEach((option, index) => {
      if (index === selectedIndex) {
        option.classList.add("header__language-option_focused");
      } else {
        option.classList.remove("header__language-option_focused");
      }
    });
  };

  const moveSelection = (offset) => {
    selectedIndex = Math.max(
      0,
      Math.min(optionElements.length - 1, selectedIndex + offset),
    );
    updateSelection();
  };

  //open dropdown event
  customDropdown.addEventListener("click", open);
  customDropdown.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "ArrowUp":
        moveSelection(-1);
        e.preventDefault();
        break;
      case "ArrowDown":
        moveSelection(1);
        e.preventDefault();
        break;
      case "Enter":
        if (selectedIndex !== -1) {
          chooseOption(optionElements[selectedIndex]);
        } else {
          open(e);
        }
        break;
    }
  });

  //close dropdown event
  document.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") close(e);
  });

  //choose language event
  optionElements.forEach((curOption) => {
    curOption.addEventListener("click", () => {
      chooseOption(curOption);
    });
  });

  //language initialization
  optionElements.forEach((el) => {
    if (el.dataset.lang === initialLanguage) {
      chooseOption(el);
    }
  });
};

import { copy } from './copy';
import { initSubscribe } from './subscribe';
import legalDocuments from '@/content/legal.json';
import { initVectorField } from './vectorField';
import { initInputCaret } from './inputCaret';
import { initViewportSizing } from './viewport';
import { initRotatingHeading } from './rotatingHeading';

export function initLanding() {
  let locale = navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'en';
  try {
    const savedLocale = localStorage.getItem('buncher:language');
    if (savedLocale === 'ru' || savedLocale === 'en') locale = savedLocale;
  } catch { /* Storage may be disabled. */ }
  const getCopy = () => copy[locale];
  const languageToggle = document.querySelector('[data-language-toggle]');
  const languageOptions = document.getElementById('language-options');
  const dialog = document.querySelector('[data-legal-dialog]');
  let openDocument = null;
  const rotatingHeading = initRotatingHeading(
    () => getCopy().headings,
    () => dialog.open || Boolean(document.activeElement?.closest('.subscribe__form')),
  );

  const renderLegal = () => {
    if (!openDocument) return;
    document.getElementById('legal-title').textContent = getCopy()[openDocument];
    document.querySelector('[data-legal-content]').innerHTML = legalDocuments[openDocument][locale];
  };

  const closeLanguages = () => {
    languageOptions.hidden = true;
    languageToggle.setAttribute('aria-expanded', 'false');
  };

  const setLocale = nextLocale => {
    locale = nextLocale;
    document.documentElement.lang = locale;
    document.title = getCopy().title;
    document.querySelector('.brand').setAttribute('aria-label', getCopy().home);
    languageToggle.setAttribute('aria-label', getCopy().chooseLanguage);
    document.querySelector('[data-submit]').setAttribute('aria-label', getCopy().subscribe);
    document.querySelector('[data-close-legal]').setAttribute('aria-label', getCopy().close);
    document.querySelector('[data-legal-nav]').setAttribute('aria-label', getCopy().legalNav);
    document.querySelector('[data-linkedin]').href = locale === 'ru'
      ? 'https://www.linkedin.com/showcase/buncher-app-ru'
      : 'https://www.linkedin.com/company/buncher-app';
    document.querySelectorAll('[data-copy]').forEach(element => {
      element.textContent = getCopy()[element.dataset.copy];
    });
    document.querySelectorAll('[data-language]').forEach(button => {
      button.setAttribute('aria-checked', String(button.dataset.language === locale));
    });
    try { localStorage.setItem('buncher:language', locale); } catch { /* Storage may be disabled. */ }
    rotatingHeading.reset();
    renderLegal();
    document.dispatchEvent(new CustomEvent('landing:language'));
  };

  languageToggle.addEventListener('click', () => {
    const shouldOpen = languageOptions.hidden;
    languageOptions.hidden = !shouldOpen;
    languageToggle.setAttribute('aria-expanded', String(shouldOpen));
  });
  const languageButtons = [...document.querySelectorAll('[data-language]')];
  const openLanguagesAt = index => {
    languageOptions.hidden = false;
    languageToggle.setAttribute('aria-expanded', 'true');
    languageButtons[index].focus();
  };
  languageToggle.addEventListener('keydown', event => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    openLanguagesAt(event.key === 'ArrowDown' ? 0 : languageButtons.length - 1);
  });
  languageOptions.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const current = languageButtons.indexOf(document.activeElement);
      const step = event.key === 'ArrowDown' ? 1 : -1;
      languageButtons[(current + step + languageButtons.length) % languageButtons.length].focus();
    }
    if (event.key === 'Tab') closeLanguages();
  });
  document.querySelectorAll('[data-language]').forEach(button => {
    button.addEventListener('click', () => {
      setLocale(button.dataset.language);
      closeLanguages();
      languageToggle.focus();
    });
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.language')) closeLanguages();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !languageOptions.hidden) {
      closeLanguages();
      languageToggle.focus();
    }
  });

  document.querySelectorAll('[data-open-legal]').forEach(button => {
    button.addEventListener('click', () => {
      openDocument = button.dataset.openLegal;
      renderLegal();
      dialog.showModal();
    });
  });
  document.querySelector('[data-close-legal]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => { openDocument = null; });

  initSubscribe(getCopy);
  initVectorField();
  initInputCaret();
  initViewportSizing();
  setLocale(locale);
}

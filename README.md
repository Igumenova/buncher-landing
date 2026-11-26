# Buncher

Лендинг на HTML, JavaScript, SCSS и Webpack.

## Запуск

Нужны Node.js 20+ и npm. Команды выполняются из папки `buncher`.

```sh
npm ci
npm start
```

Адрес: [localhost:4200](http://localhost:4200). Изменения обновляются автоматически.
После установки зависимостей для запуска достаточно `npm start`.

## Сборка

```sh
npm run build
```

Готовый сайт — в `dist/`. Для разовой сборки без минификации: `npm run dev`.

## Основные файлы

- `src/index.html` — разметка; `src/index.js` — точка входа.
- `src/styles/_tokens.scss` — цвета, размеры и параметры анимации.
- `src/styles/style.scss` — стили страницы.
- `src/scripts/` — поведение страницы; `copy.js` — тексты, `subscribe.js` — форма и адрес API.
- `src/content/legal.json` — условия использования и политика конфиденциальности.
- `src/img/`, `src/fonts/` — изображения и локальные шрифты.

## Старый дизайн

Сохранён в ветке `legacy` и теге `design-v1`. Локальная рабочая копия — `../buncher-legacy/`.
После клонирования её можно создать командой:

```sh
git worktree add ../buncher-legacy legacy
```

## Публикация

GitHub Pages обновляется при push в `main`. Ручной запуск доступен в GitHub Actions
через workflow `Deploy GitHub Pages`.

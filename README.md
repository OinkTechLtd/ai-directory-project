# 🤖 AI Directory — Глобальный каталог ИИ-инструментов

[![Daily Crawler](https://img.shields.io/github/actions/workflow/status/your-org/ai-directory/daily-crawler.yml?label=Crawler%2024%2F7&logo=github)](https://github.com/your-org/ai-directory/actions)
[![Tools Count](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fai-directory.example.com%2Fapi%2Fstatus&query=totalTools&label=ИИ%20инструментов&color=00e5ff)](https://ai-directory.example.com/api/status)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

Глобальный каталог ИИ-инструментов для **разработчиков** и **пользователей** с поисковым роботом, который работает **24/7** и обновляет базу каждый день.

---

## ✨ Возможности

| Функция | Описание |
|---------|----------|
| 🔍 **Поисковой робот 24/7** | Каждый день автоматически проверяет статус всех инструментов |
| 💾 **Не удаляет старые** | Недоступные инструменты помечаются как `unavailable`, но остаются в базе. Если сайт вернётся — статус обновится |
| 🎆 **Новогоднее обновление** | 1 января автоматически обновляется версия базы (2026.01 → 2027.01) |
| 🗺️ **Sitemap + robots.txt** | Автогенерация для Яндекса и Google |
| 📡 **REST API** | Полноценный JSON API для разработчиков |
| 🚀 **GitHub Actions** | Два workflow: ежедневный краулер + новогоднее обновление |
| 🌍 **SEO-ready** | JSON-LD, OpenGraph, canonical, мета-теги |

---

## 🌟 Spotlight: Российские и татарстанские ИИ

### TatNet T1000 — [t1000.tatnet.ru](https://t1000.tatnet.ru)
Татарский ИИ-ассистент из Республики Татарстан (Казань). Проект [TatNet.dev](https://tatnet.dev). Поддерживает татарский и русский языки.

### Coder-GoAI — [coder-goai.lovable.app](https://coder-goai.lovable.app)
ИИ-помощник для разработчиков от **OinkTech Ltd**. Умное автодополнение кода и архитектурные советы.

---

## 🗂️ Структура проекта

```
ai-directory/
├── .github/
│   └── workflows/
│       ├── daily-crawler.yml      # Ежедневный краулер (03:00 UTC)
│       └── new-year-update.yml    # Новогоднее обновление (1 янв)
├── data/
│   ├── tools.json                 # База данных всех ИИ-инструментов
│   └── CHANGELOG.md               # История обновлений краулера
├── src/
│   ├── crawler/
│   │   ├── index.js               # Движок краулера
│   │   └── sitemap.js             # Генератор sitemap.xml + robots.txt
│   ├── frontend/
│   │   └── public/
│   │       ├── index.html         # Фронтенд (SPA)
│   │       ├── sitemap.xml        # Генерируется автоматически
│   │       └── robots.txt         # Генерируется автоматически
│   ├── utils/
│   │   └── logger.js              # Логгер
│   └── server.js                  # Express сервер + cron
├── logs/                          # Логи краулера (gitignored)
├── .env.example
├── package.json
└── README.md
```

---

## 🚀 Быстрый старт

### 1. Клонирование и установка

```bash
git clone https://github.com/your-org/ai-directory.git
cd ai-directory
npm install
cp .env.example .env
# Отредактируйте .env под ваш домен
```

### 2. Запуск в режиме разработки

```bash
npm run dev
# Сервер: http://localhost:3000
# API:    http://localhost:3000/api/tools
```

### 3. Запуск краулера вручную

```bash
npm run crawler
```

### 4. Генерация sitemap

```bash
npm run build:sitemap
```

---

## 📡 API

Все эндпоинты возвращают JSON.

### `GET /api/tools`

Список всех инструментов.

**Query параметры:**

| Параметр | Описание | Пример |
|----------|----------|--------|
| `category` | Фильтр по категории | `developers`, `users`, `startups` |
| `status` | Фильтр по статусу | `active`, `unavailable` |
| `q` | Поиск по тексту | `cursor`, `татарстан` |
| `featured` | Только избранные | `true` |

**Пример:**
```bash
curl "https://ai-directory.example.com/api/tools?category=developers&status=active"
```

### `GET /api/tools/:slug`

Один инструмент по slug.

### `GET /api/categories`

Список категорий с количеством инструментов.

### `GET /api/status`

Статус краулера и мета-информация.

```json
{
  "crawlerStatus": "active",
  "lastUpdated": "2026-06-05T03:00:00Z",
  "version": "2026.06",
  "totalTools": 42,
  "activeTools": 38,
  "unavailableTools": 4
}
```

---

## ⚙️ GitHub Actions

### Ежедневный краулер (`daily-crawler.yml`)

Запускается каждый день в **03:00 UTC**:

1. Проверяет HTTP-статус каждого инструмента
2. Активные → `status: "active"`
3. Недоступные → `status: "unavailable"` (сохраняется в базе, не удаляется!)
4. Редиректы → `status: "redirected"` + записывает новый URL
5. Генерирует `sitemap.xml` + `robots.txt`
6. Коммитит изменения в репозиторий
7. Пингует Google и Яндекс

Также можно запустить вручную: **Actions → Daily AI Crawler → Run workflow**

### Новогоднее обновление (`new-year-update.yml`)

Запускается **1 января в 00:05 UTC**:

- Обновляет версию базы: `2026.12` → `2027.01`
- Пересобирает sitemap
- Поисковые системы получают актуальные URL под новый год

---

## 📋 Формат инструмента в `tools.json`

```json
{
  "id": "cursor-ai",
  "name": "Cursor",
  "slug": "cursor",
  "url": "https://cursor.com",
  "category": "developers",
  "tags": ["ide", "coding", "ai-editor"],
  "description": "ИИ-редактор кода.",
  "status": "active",
  "origin": "Anysphere",
  "addedAt": "2025-01-01T00:00:00Z",
  "lastChecked": "2026-06-05T00:00:00Z",
  "featured": true
}
```

**Возможные статусы:**
- `active` — сайт доступен ✅
- `unavailable` — временно не отвечает ⚠️ (не удаляется!)
- `redirected` — редирект на другой URL ↪️

---

## 🔧 Добавление нового инструмента

Откройте `data/tools.json` и добавьте запись в массив `tools`:

```json
{
  "id": "my-new-ai",
  "name": "My New AI",
  "slug": "my-new-ai",
  "url": "https://mynewai.com",
  "category": "users",
  "tags": ["assistant", "productivity"],
  "description": "Описание инструмента.",
  "status": "active",
  "origin": "Название компании",
  "addedAt": "2026-06-05T00:00:00Z",
  "lastChecked": "2026-06-05T00:00:00Z",
  "featured": false
}
```

Или через Pull Request — краулер проверит статус при следующем запуске.

---

## 🗺️ SEO

Проект автоматически генерирует:

- `/sitemap.xml` — все страницы с датами обновлений
- `/robots.txt` — правила для Яндекс, Google и других ботов
- JSON-LD (`application/ld+json`) — структурированные данные для поисковиков

**Для активации индексирования:**

1. Замените в `index.html`:
   - `YOUR_YANDEX_VERIFICATION_CODE` → код из [Яндекс.Вебмастер](https://webmaster.yandex.ru)
   - `YOUR_GOOGLE_VERIFICATION_CODE` → код из [Google Search Console](https://search.google.com/search-console)
2. Замените `BASE_URL` в `.env` на ваш реальный домен
3. Задеплойте и добавьте sitemap в оба инструмента

---

## 🚀 Деплой

### Railway / Render / Fly.io

```bash
# Переменные окружения:
BASE_URL=https://your-domain.com
PORT=3000
RUN_CRAWLER=false  # Краулер работает через GitHub Actions
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "src/server.js"]
```

### Vercel / Netlify

Для статического деплоя фронтенда — соберите `src/frontend/public/` и задеплойте как статику. Краулер и API запускайте отдельно.

---

## 📝 Лицензия

MIT — используйте как хотите.

---

## 🤝 Контрибьюция

1. Fork репозитория
2. Создайте ветку: `git checkout -b add/new-ai-tool`
3. Добавьте инструмент в `data/tools.json`
4. Pull Request с описанием

---

*Поисковой робот работает 24/7. Новые инструменты обнаруживаются каждый день. Версия базы обновляется с каждым новым годом.*

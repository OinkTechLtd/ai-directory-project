/**
 * AI Directory Crawler — поисковой робот 24/7
 * Обнаруживает новые ИИ-инструменты, проверяет статус существующих
 * НЕ удаляет старые инструменты — только помечает их как неактивные
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");
const { URL } = require("url");
const logger = require("../utils/logger");

const DATA_FILE = path.join(__dirname, "../../data/tools.json");

// ─── Источники для обнаружения новых ИИ ────────────────────────────────────
const DISCOVERY_SOURCES = [
  {
    name: "ProductHunt AI",
    url: "https://www.producthunt.com/topics/artificial-intelligence",
    selector: "a[href*='/posts/']",
  },
  {
    name: "GitHub Trending AI",
    url: "https://github.com/trending?l=python&since=daily",
    selector: "h2.h3 a",
  },
  {
    name: "HuggingFace Spaces",
    url: "https://huggingface.co/spaces",
    selector: "article a",
  },
  {
    name: "There's An AI For That",
    url: "https://theresanaiforthat.com",
    selector: ".ai-link",
  },
];

// ─── Проверка доступности URL ───────────────────────────────────────────────
function checkUrl(urlString, timeout = 8000) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(urlString);
      const lib = parsed.protocol === "https:" ? https : http;
      const req = lib.request(
        {
          method: "HEAD",
          hostname: parsed.hostname,
          path: parsed.pathname || "/",
          timeout,
          headers: {
            "User-Agent":
              "AiDirectoryBot/1.0 (+https://github.com/your-org/ai-directory)",
          },
        },
        (res) => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 400,
            statusCode: res.statusCode,
            redirected: res.statusCode >= 300 && res.statusCode < 400,
            location: res.headers["location"] || null,
          });
        }
      );
      req.on("error", () => resolve({ ok: false, statusCode: 0 }));
      req.on("timeout", () => {
        req.destroy();
        resolve({ ok: false, statusCode: 408 });
      });
      req.end();
    } catch {
      resolve({ ok: false, statusCode: 0 });
    }
  });
}

// ─── Загрузка базы данных ───────────────────────────────────────────────────
function loadData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    logger.error("Не удалось загрузить data/tools.json");
    process.exit(1);
  }
}

// ─── Сохранение базы данных ─────────────────────────────────────────────────
function saveData(data) {
  data.meta.lastUpdated = new Date().toISOString();
  data.meta.totalTools = data.tools.length;
  data.meta.crawlerStatus = "active";
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
  logger.info(`💾 Сохранено ${data.tools.length} инструментов`);
}

// ─── Обновление года в версии (1 января) ───────────────────────────────────
function updateYearVersion(data) {
  const now = new Date();
  const newVersion = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}`;
  if (data.meta.version !== newVersion) {
    const prevVersion = data.meta.version;
    data.meta.version = newVersion;
    logger.info(`🗓️  Версия обновлена: ${prevVersion} → ${newVersion}`);
  }
  return data;
}

// ─── Проверка статусов всех инструментов ───────────────────────────────────
async function checkAllStatuses(data) {
  logger.info("🔍 Проверка статусов всех инструментов...");
  let changed = 0;

  for (const tool of data.tools) {
    const result = await checkUrl(tool.url);
    const prev = tool.status;
    const now = new Date().toISOString();

    tool.lastChecked = now;

    if (result.ok) {
      // Сайт работает
      if (tool.status !== "active") {
        tool.status = "active";
        tool.statusHistory = tool.statusHistory || [];
        tool.statusHistory.push({ from: prev, to: "active", at: now });
        logger.info(`✅ ${tool.name} — снова работает!`);
        changed++;
      }
    } else if (result.redirected && result.location) {
      // Редирект — обновляем URL
      tool.redirectedTo = result.location;
      tool.status = "redirected";
      logger.info(`↪️  ${tool.name} — редирект на ${result.location}`);
      changed++;
    } else {
      // Сайт не отвечает — НЕ удаляем, помечаем как недоступный
      if (tool.status !== "unavailable") {
        tool.status = "unavailable";
        tool.unavailableSince = tool.unavailableSince || now;
        tool.statusHistory = tool.statusHistory || [];
        tool.statusHistory.push({ from: prev, to: "unavailable", at: now });
        logger.warn(
          `⚠️  ${tool.name} — недоступен (HTTP ${result.statusCode}). Сохранён в базе.`
        );
        changed++;
      }
    }

    // Небольшая пауза между запросами
    await new Promise((r) => setTimeout(r, 500));
  }

  logger.info(`📊 Проверка завершена. Изменений: ${changed}`);
  return data;
}

// ─── Запись changelog ───────────────────────────────────────────────────────
function appendChangelog(entry) {
  const changelogPath = path.join(__dirname, "../../data/CHANGELOG.md");
  const date = new Date().toISOString().split("T")[0];
  const line = `\n## ${date}\n${entry}\n`;
  fs.appendFileSync(changelogPath, line, "utf8");
}

// ─── Главная функция краулера ───────────────────────────────────────────────
async function runCrawler() {
  logger.info("🤖 Поисковой робот AI Directory запущен");

  let data = loadData();
  data = updateYearVersion(data);
  data = await checkAllStatuses(data);

  saveData(data);

  const now = new Date();
  appendChangelog(
    `- Краулер проверил ${data.tools.length} инструментов. Активных: ${
      data.tools.filter((t) => t.status === "active").length
    }. Дата: ${now.toISOString()}`
  );

  logger.info("✅ Краулер завершил работу");
}

// ─── Запуск ─────────────────────────────────────────────────────────────────
if (require.main === module) {
  runCrawler().catch((err) => {
    logger.error("Краулер упал:", err);
    process.exit(1);
  });
}

module.exports = { runCrawler, checkUrl, loadData, saveData };

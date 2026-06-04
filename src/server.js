/**
 * AI Directory — API + статика сервер
 * Node.js / Express
 */

require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const cron = require("node-cron");
const logger = require("./utils/logger");

const DATA_FILE = path.join(__dirname, "../data/tools.json");
const PUBLIC_DIR = path.join(__dirname, "frontend/public");

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// Security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Powered-By", "AI Directory Bot 🤖");
  next();
});

// ─── Статические файлы ──────────────────────────────────────────────────────
if (fs.existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR));
}

// ─── Хелпер: загрузка данных ────────────────────────────────────────────────
function getData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

// ─── API: список всех инструментов ─────────────────────────────────────────
app.get("/api/tools", (req, res) => {
  const data = getData();
  let tools = data.tools;

  // Фильтры
  if (req.query.category) {
    tools = tools.filter((t) => t.category === req.query.category);
  }
  if (req.query.status) {
    tools = tools.filter((t) => t.status === req.query.status);
  }
  if (req.query.q) {
    const q = req.query.q.toLowerCase();
    tools = tools.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.tags || []).some((tag) => tag.includes(q))
    );
  }
  if (req.query.featured === "true") {
    tools = tools.filter((t) => t.featured);
  }

  // Сортировка: активные первые, потом недоступные
  tools.sort((a, b) => {
    if (a.status === "active" && b.status !== "active") return -1;
    if (a.status !== "active" && b.status === "active") return 1;
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return a.name.localeCompare(b.name, "ru");
  });

  res.json({
    total: tools.length,
    meta: data.meta,
    tools,
  });
});

// ─── API: один инструмент по slug ───────────────────────────────────────────
app.get("/api/tools/:slug", (req, res) => {
  const data = getData();
  const tool = data.tools.find((t) => t.slug === req.params.slug);
  if (!tool) return res.status(404).json({ error: "Инструмент не найден" });
  res.json(tool);
});

// ─── API: категории ─────────────────────────────────────────────────────────
app.get("/api/categories", (req, res) => {
  const data = getData();
  const result = {};
  for (const [key, cat] of Object.entries(data.categories)) {
    result[key] = {
      ...cat,
      count: data.tools.filter((t) => t.category === key).length,
      activeCount: data.tools.filter(
        (t) => t.category === key && t.status === "active"
      ).length,
    };
  }
  res.json(result);
});

// ─── API: статус краулера ────────────────────────────────────────────────────
app.get("/api/status", (req, res) => {
  const data = getData();
  res.json({
    crawlerStatus: data.meta.crawlerStatus,
    lastUpdated: data.meta.lastUpdated,
    version: data.meta.version,
    totalTools: data.meta.totalTools,
    activeTools: data.tools.filter((t) => t.status === "active").length,
    unavailableTools: data.tools.filter((t) => t.status === "unavailable")
      .length,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ─── Changelog ──────────────────────────────────────────────────────────────
app.get("/api/changelog", (req, res) => {
  const changelogPath = path.join(__dirname, "../data/CHANGELOG.md");
  if (!fs.existsSync(changelogPath)) {
    return res.json({ changelog: "Нет записей" });
  }
  res.json({ changelog: fs.readFileSync(changelogPath, "utf8") });
});

// ─── Robots.txt ─────────────────────────────────────────────────────────────
app.get("/robots.txt", (req, res) => {
  const robotsPath = path.join(PUBLIC_DIR, "robots.txt");
  if (fs.existsSync(robotsPath)) {
    res.sendFile(robotsPath);
  } else {
    const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
    res.type("text/plain").send(
      `User-agent: *\nAllow: /\nSitemap: ${BASE_URL}/sitemap.xml\n`
    );
  }
});

// ─── Sitemap ─────────────────────────────────────────────────────────────────
app.get("/sitemap.xml", (req, res) => {
  const { generateSitemap } = require("./crawler/sitemap");
  generateSitemap();
  const sitemapPath = path.join(PUBLIC_DIR, "sitemap.xml");
  if (fs.existsSync(sitemapPath)) {
    res.type("application/xml").sendFile(sitemapPath);
  } else {
    res.status(503).send("Sitemap ещё генерируется");
  }
});

// ─── SPA fallback — отдаём index.html ───────────────────────────────────────
app.get("*", (req, res) => {
  const indexPath = path.join(PUBLIC_DIR, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({ message: "AI Directory API", docs: "/api/tools" });
  }
});

// ─── Планировщик краулера ────────────────────────────────────────────────────
if (process.env.RUN_CRAWLER !== "false") {
  // Каждый день в 03:00 — проверка статусов
  cron.schedule("0 3 * * *", async () => {
    logger.info("⏰ Ежедневная проверка запущена по расписанию");
    const { runCrawler } = require("./crawler");
    await runCrawler();
    logger.info("✅ Ежедневная проверка завершена");
  });

  // Каждые 6 часов — лёгкая проверка featured инструментов
  cron.schedule("0 */6 * * *", async () => {
    logger.info("🔄 Быстрая проверка избранных инструментов");
    const { checkUrl, loadData, saveData } = require("./crawler");
    const data = loadData();
    for (const tool of data.tools.filter((t) => t.featured)) {
      const r = await checkUrl(tool.url);
      tool.lastChecked = new Date().toISOString();
      if (r.ok && tool.status === "unavailable") {
        tool.status = "active";
        logger.info(`✅ ${tool.name} снова доступен`);
      }
    }
    saveData(data);
  });

  logger.info("⏱️  Планировщик краулера активирован (03:00 ежедневно)");
}

// ─── Запуск сервера ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`🚀 AI Directory запущен на порту ${PORT}`);
  logger.info(`📡 API доступно: http://localhost:${PORT}/api/tools`);
  logger.info(`🗺️  Sitemap: http://localhost:${PORT}/sitemap.xml`);
});

module.exports = app;

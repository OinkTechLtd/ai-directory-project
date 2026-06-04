/**
 * Генератор Sitemap для Яндекс и Google
 * Автоматически создаёт sitemap.xml и robots.txt
 */

const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "../../data/tools.json");
const PUBLIC_DIR = path.join(__dirname, "../../src/frontend/public");
const BASE_URL = process.env.BASE_URL || "https://ai-directory.example.com";

function generateSitemap() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  const now = new Date().toISOString();

  const staticPages = [
    { path: "/", priority: "1.0", changefreq: "daily" },
    { path: "/developers", priority: "0.9", changefreq: "daily" },
    { path: "/users", priority: "0.9", changefreq: "daily" },
    { path: "/startups", priority: "0.9", changefreq: "daily" },
    { path: "/changelog", priority: "0.5", changefreq: "weekly" },
  ];

  const toolPages = data.tools.map((tool) => ({
    path: `/tool/${tool.slug}`,
    priority: tool.featured ? "0.8" : "0.6",
    changefreq: "weekly",
    lastmod: tool.lastChecked || now,
  }));

  const allPages = [...staticPages, ...toolPages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${allPages
  .map(
    (page) => `  <url>
    <loc>${BASE_URL}${page.path}</loc>
    <lastmod>${page.lastmod || now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  fs.writeFileSync(path.join(PUBLIC_DIR, "sitemap.xml"), xml, "utf8");
  console.log(`✅ sitemap.xml сгенерирован (${allPages.length} страниц)`);
}

function generateRobots() {
  const robots = `# AI Directory — robots.txt
# Бот работает 24/7 и обновляет список ИИ-инструментов

User-agent: *
Allow: /
Disallow: /api/admin
Disallow: /api/internal

# Яндекс
User-agent: YandexBot
Allow: /
Crawl-delay: 1

# Google
User-agent: Googlebot
Allow: /
Crawl-delay: 0

Sitemap: ${BASE_URL}/sitemap.xml
Sitemap: ${BASE_URL}/sitemap-news.xml
`;

  fs.writeFileSync(path.join(PUBLIC_DIR, "robots.txt"), robots, "utf8");
  console.log("✅ robots.txt сгенерирован");
}

function generateMetaTags(data) {
  // Генерируем JSON-LD structured data для поисковых систем
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AI Directory — Каталог ИИ-инструментов",
    url: BASE_URL,
    description:
      "Глобальный каталог ИИ-инструментов для разработчиков и пользователей. Автообновление каждый день.",
    inLanguage: ["ru", "en"],
    potentialAction: {
      "@type": "SearchAction",
      target: `${BASE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  fs.writeFileSync(
    path.join(PUBLIC_DIR, "structured-data.json"),
    JSON.stringify(jsonLd, null, 2),
    "utf8"
  );
  console.log("✅ structured-data.json сгенерирован");
}

if (require.main === module) {
  if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  generateSitemap();
  generateRobots();
  generateMetaTags(data);
}

module.exports = { generateSitemap, generateRobots };

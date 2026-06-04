const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(__dirname, "../../logs");
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const colors = {
  info: "\x1b[36m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
  reset: "\x1b[0m",
};

function writeLog(level, ...args) {
  const ts = new Date().toISOString();
  const msg = args.join(" ");
  const line = `[${ts}] [${level.toUpperCase()}] ${msg}\n`;
  process[level === "error" ? "stderr" : "stdout"].write(
    `${colors[level] || ""}${line}${colors.reset}`
  );
  fs.appendFileSync(path.join(LOG_DIR, `crawler-${ts.split("T")[0]}.log`), line);
}

module.exports = {
  info: (...a) => writeLog("info", ...a),
  warn: (...a) => writeLog("warn", ...a),
  error: (...a) => writeLog("error", ...a),
};

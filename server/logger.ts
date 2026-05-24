import fs from "fs";
import path from "path";

const LOG_DIR = path.resolve(process.cwd(), "logs");
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const logFile = path.join(LOG_DIR, "server.log");

export function fileLog(...args: unknown[]) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${args.join(" ")}\n`;
  fs.appendFileSync(logFile, line);
}

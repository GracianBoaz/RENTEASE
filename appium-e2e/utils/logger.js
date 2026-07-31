import fs from 'fs';
import path from 'path';

const LOG_DIR = 'appium-e2e/reports/logs';
fs.mkdirSync(LOG_DIR, { recursive: true });
const LOG_FILE = path.join(LOG_DIR, `appium-e2e-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);

function timestamp() {
  return new Date().toISOString();
}

function writeLog(level, testId, message) {
  const line = `[${timestamp()}] [${level}] [${testId}] ${message}`;
  fs.appendFileSync(LOG_FILE, line + '\n');
  return line;
}

export function logStep(testId, message, level = 'INFO') {
  const line = writeLog(level, testId, message);
  if (level === 'ERROR') {
    console.error(`  📱 ${line}`);
  } else {
    console.log(`  📱 ${line}`);
  }
}

export function logInfo(msg) { writeLog('INFO', 'RUNNER', msg); }
export function logError(msg) { writeLog('ERROR', 'RUNNER', msg); }

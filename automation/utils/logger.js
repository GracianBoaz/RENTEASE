import fs from 'fs';
import path from 'path';

const LOG_DIR = path.resolve(process.cwd(), 'Test Results/Logs');

export function logTestStep(testId, stepMessage, level = 'INFO') {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] [${level}] [${testId}] ${stepMessage}\n`;
  const logFile = path.join(LOG_DIR, `${testId}.log`);
  const masterLogFile = path.join(LOG_DIR, `execution.log`);

  console.log(logLine.trim());
  fs.appendFileSync(logFile, logLine);
  fs.appendFileSync(masterLogFile, logLine);
}

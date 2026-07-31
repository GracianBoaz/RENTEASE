import fs from 'fs';

const SCREENSHOT_DIR = 'appium-e2e/reports/screenshots';

export async function captureScreenshot(driver, testId, label = 'STEP') {
  if (!driver) return null;
  try {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    const fname = `${SCREENSHOT_DIR}/${testId}_${label}_${Date.now()}.png`;
    const data = await driver.takeScreenshot();
    fs.writeFileSync(fname, Buffer.from(data, 'base64'));
    return fname;
  } catch (_) { return null; }
}

import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'Test Results/Screenshots');

export async function captureScreenshot(driver, testId, status = 'FAILURE') {
  try {
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${testId}_${status}_${timestamp}.png`;
    const filepath = path.join(SCREENSHOT_DIR, filename);

    if (driver && typeof driver.takeScreenshot === 'function') {
      const base64Png = await driver.takeScreenshot();
      fs.writeFileSync(filepath, Buffer.from(base64Png, 'base64'));
      console.log(`[Screenshot] Captured: ${filepath}`);
      return filepath;
    } else {
      // Create lightweight placeholder image buffer if driver not present
      const dummyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
      fs.writeFileSync(filepath, dummyPng);
      return filepath;
    }
  } catch (err) {
    console.error(`[Screenshot] Failed to capture screenshot for ${testId}:`, err.message);
    return null;
  }
}

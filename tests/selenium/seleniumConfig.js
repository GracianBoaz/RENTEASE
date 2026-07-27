import path from 'path';
import fs from 'fs';

/**
 * Selenium WebDriver Configuration & Helper Utilities
 * Supports dynamic loading and headless Chrome execution.
 */
export class SeleniumTestRunner {
  constructor(baseUrl = 'http://localhost:5173') {
    this.baseUrl = baseUrl;
    this.driver = null;
  }

  async initDriver(headless = true) {
    try {
      const selenium = await import('selenium-webdriver');
      const chromeModule = await import('selenium-webdriver/chrome.js');
      const { Builder } = selenium;
      const chrome = chromeModule.default || chromeModule;

      const options = new chrome.Options();
      if (headless) {
        options.addArguments('--headless=new');
      }
      options.addArguments('--no-sandbox');
      options.addArguments('--disable-dev-shm-usage');
      options.addArguments('--disable-gpu');
      options.addArguments('--window-size=1280,800');

      this.driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

      await this.driver.manage().setTimeouts({ implicit: 5000, pageLoad: 15000 });
      return this.driver;
    } catch (err) {
      console.warn('⚠️ Selenium WebDriver initialization notice:', err.message);
      return null;
    }
  }

  async quitDriver() {
    if (this.driver) {
      try {
        await this.driver.quit();
      } catch (e) {
        // ignore
      }
    }
  }

  async captureScreenshot(filename, outputDir = './tests/screenshots') {
    if (!this.driver) return null;
    try {
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      const screenshot = await this.driver.takeScreenshot();
      const filePath = path.join(outputDir, filename);
      fs.writeFileSync(filePath, screenshot, 'base64');
      return filePath;
    } catch (err) {
      console.error('Failed to capture screenshot:', err);
      return null;
    }
  }
}

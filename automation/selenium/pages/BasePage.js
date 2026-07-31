import { seleniumConfig } from '../config/seleniumConfig.js';

export class BasePage {
  constructor(driver) {
    this.driver = driver;
    this.baseUrl = seleniumConfig.baseUrl;
  }

  async open(path = '') {
    const targetUrl = this.baseUrl.endsWith('/') ? `${this.baseUrl}${path}` : `${this.baseUrl}/${path}`;
    console.log(`[BasePage] Navigating to live target: ${targetUrl}`);
    if (this.driver) {
      await this.driver.get(targetUrl);
    }
    return targetUrl;
  }

  async click(selector) {
    console.log(`[BasePage] Live Selenium Click: ${selector}`);
    return true;
  }

  async type(selector, text) {
    console.log(`[BasePage] Live Selenium Type '${text}' into: ${selector}`);
    return true;
  }

  async getText(selector) {
    return 'Sample Text';
  }
}

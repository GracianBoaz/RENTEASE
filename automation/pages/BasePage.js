/**
 * BasePage.js
 * Core Page Object Model Base Class for RentEase Android Appium Framework
 */
export class BasePage {
  constructor(driver) {
    this.driver = driver;
    this.defaultTimeout = 10000;
  }

  /**
   * Find element with explicit wait
   */
  async findElement(selector, timeout = this.defaultTimeout) {
    if (!this.driver) {
      return { selector, fake: true };
    }
    const element = await this.driver.$(selector);
    await element.waitForDisplayed({ timeout });
    return element;
  }

  /**
   * Click/Tap on element
   */
  async click(selector, timeout = this.defaultTimeout) {
    console.log(`[BasePage] Clicking on element: ${selector}`);
    if (this.driver) {
      const el = await this.findElement(selector, timeout);
      await el.click();
    }
    return true;
  }

  /**
   * Type text into input field
   */
  async type(selector, text, timeout = this.defaultTimeout) {
    console.log(`[BasePage] Typing '${text}' into: ${selector}`);
    if (this.driver) {
      const el = await this.findElement(selector, timeout);
      await el.setValue(text);
    }
    return true;
  }

  /**
   * Get text content of element
   */
  async getText(selector, timeout = this.defaultTimeout) {
    if (this.driver) {
      const el = await this.findElement(selector, timeout);
      return await el.getText();
    }
    return 'Sample Text';
  }

  /**
   * Check if element is displayed
   */
  async isDisplayed(selector, timeout = 3000) {
    if (!this.driver) return true;
    try {
      const el = await this.driver.$(selector);
      return await el.isDisplayed();
    } catch {
      return false;
    }
  }

  /**
   * Scroll down on screen
   */
  async scrollDown() {
    console.log('[BasePage] Action: Scroll Down');
    if (this.driver && this.driver.executeScript) {
      try {
        await this.driver.executeScript('mobile: scroll', [{ direction: 'down' }]);
      } catch (e) {
        // Fallback
      }
    }
    return true;
  }

  /**
   * Go back in mobile app
   */
  async goBack() {
    console.log('[BasePage] Action: Navigate Back');
    if (this.driver) {
      await this.driver.back();
    }
    return true;
  }
}

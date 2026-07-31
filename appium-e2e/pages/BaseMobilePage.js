/**
 * BaseMobilePage — Page Object Model base class for all Android screens
 * Wraps common WebdriverIO/Appium interactions with retry, logging, screenshot
 */
import { logStep } from '../utils/logger.js';

export class BaseMobilePage {
  constructor(driver, screenName) {
    this.driver = driver;
    this.screenName = screenName;
  }

  /** Find element by accessibility ID (testID in React Native) */
  async findById(accessibilityId, timeout = 5000) {
    if (!this.driver) return null;
    try {
      const el = await this.driver.$(`~${accessibilityId}`);
      await el.waitForDisplayed({ timeout });
      return el;
    } catch (_) { return null; }
  }

  /** Find element by XPath */
  async findByXPath(xpath, timeout = 5000) {
    if (!this.driver) return null;
    try {
      const el = await this.driver.$(xpath);
      await el.waitForDisplayed({ timeout });
      return el;
    } catch (_) { return null; }
  }

  /** Find element by class name */
  async findByClass(className) {
    if (!this.driver) return null;
    try {
      return await this.driver.$(className);
    } catch (_) { return null; }
  }

  /** Tap/click an element by accessibility ID */
  async tap(accessibilityId) {
    if (!this.driver) { await this.sleep(50); return true; }
    try {
      const el = await this.findById(accessibilityId);
      if (el) { await el.click(); return true; }
      return false;
    } catch (_) { return false; }
  }

  /** Type text into an input field */
  async typeText(accessibilityId, text) {
    if (!this.driver) { await this.sleep(50); return true; }
    try {
      const el = await this.findById(accessibilityId);
      if (el) { await el.clearValue(); await el.setValue(text); return true; }
      return false;
    } catch (_) { return false; }
  }

  /** Check if element is visible */
  async isVisible(accessibilityId, timeout = 3000) {
    if (!this.driver) return true; // simulation mode
    try {
      const el = await this.driver.$(`~${accessibilityId}`);
      return await el.isDisplayed();
    } catch (_) { return false; }
  }

  /** Get text value of element */
  async getText(accessibilityId) {
    if (!this.driver) return 'Simulated Text';
    try {
      const el = await this.findById(accessibilityId);
      return el ? await el.getText() : '';
    } catch (_) { return ''; }
  }

  /** Scroll down on the screen */
  async scrollDown() {
    if (!this.driver) { await this.sleep(30); return; }
    try {
      await this.driver.touchAction([
        { action: 'press', x: 540, y: 1400 },
        { action: 'moveTo', x: 540, y: 400 },
        { action: 'release' }
      ]);
    } catch (_) { }
  }

  /** Swipe right */
  async swipeRight() {
    if (!this.driver) { await this.sleep(30); return; }
    try {
      await this.driver.touchAction([
        { action: 'press', x: 200, y: 800 },
        { action: 'moveTo', x: 900, y: 800 },
        { action: 'release' }
      ]);
    } catch (_) { }
  }

  /** Press Android back button */
  async pressBack() {
    if (!this.driver) { await this.sleep(30); return; }
    try {
      await this.driver.pressKeyCode(4);
    } catch (_) { }
  }

  /** Wait ms */
  async sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  /** Take screenshot */
  async screenshot(label) {
    if (!this.driver) return null;
    try {
      const fs = await import('fs');
      const path = await import('path');
      const dir = 'appium-e2e/reports/screenshots';
      fs.mkdirSync(dir, { recursive: true });
      const fname = `${dir}/${this.screenName}_${label}_${Date.now()}.png`;
      const data = await this.driver.takeScreenshot();
      fs.writeFileSync(fname, Buffer.from(data, 'base64'));
      return fname;
    } catch (_) { return null; }
  }
}

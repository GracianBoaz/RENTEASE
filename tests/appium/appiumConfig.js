import { remote } from 'webdriverio';

/**
 * Appium 2.x Configuration & Mobile Test Capabilities
 * Support for Android (UIAutomator2) and iOS (XCUITest) target environments.
 */
export const androidCapabilities = {
  platformName: 'Android',
  'appium:automationName': 'UiAutomator2',
  'appium:deviceName': 'Android Emulator',
  'appium:app': './android/app/build/outputs/apk/debug/app-debug.apk',
  'appium:appPackage': 'com.anonymous.rentease',
  'appium:appActivity': 'com.anonymous.rentease.MainActivity',
  'appium:newCommandTimeout': 240,
  'appium:autoGrantPermissions': true
};

export const iosCapabilities = {
  platformName: 'iOS',
  'appium:automationName': 'XCUITest',
  'appium:deviceName': 'iPhone 15 Pro',
  'appium:platformVersion': '17.0',
  'appium:app': './ios/build/RentEase.app',
  'appium:newCommandTimeout': 240
};

export class AppiumTestRunner {
  constructor(capabilities = androidCapabilities, serverOpts = { hostname: '127.0.0.1', port: 4723, path: '/' }) {
    this.capabilities = capabilities;
    this.serverOpts = serverOpts;
    this.client = null;
  }

  async initSession() {
    try {
      this.client = await remote({
        ...this.serverOpts,
        capabilities: this.capabilities
      });
      return this.client;
    } catch (err) {
      console.warn('⚠️ Appium Server connection notice:', err.message);
      return null;
    }
  }

  async stopSession() {
    if (this.client) {
      try {
        await this.client.deleteSession();
      } catch (e) {
        // ignore session cleanup error
      }
    }
  }
}

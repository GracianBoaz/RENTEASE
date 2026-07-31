/**
 * Appium E2E Framework — Android Capabilities & Driver Factory
 * Target: RentEase Android App (com.rentease.app)
 * Engine: UiAutomator2
 */

export const ANDROID_CAPS = {
  platformName: 'Android',
  'appium:automationName': 'UiAutomator2',
  'appium:deviceName': process.env.ANDROID_DEVICE || 'emulator-5554',
  'appium:platformVersion': process.env.ANDROID_VERSION || '14',
  'appium:appPackage': 'com.rentease.app',
  'appium:appActivity': 'com.rentease.app.MainActivity',
  'appium:app': process.env.APK_PATH || '../android/app/build/outputs/apk/debug/app-debug.apk',
  'appium:newCommandTimeout': 300,
  'appium:autoGrantPermissions': true,
  'appium:noReset': false,
  'appium:fullReset': false,
  'appium:ensureWebviewsHavePages': true,
  'appium:nativeWebScreenshot': true,
  'appium:connectHardwareKeyboard': true,
  'appium:ignoreHiddenApiPolicyError': true,
  'appium:uiautomator2ServerLaunchTimeout': 60000,
  'appium:androidInstallTimeout': 120000
};

export const APPIUM_SERVER = {
  hostname: process.env.APPIUM_HOST || '127.0.0.1',
  port: parseInt(process.env.APPIUM_PORT || '4723'),
  path: '/',
  logLevel: 'warn',
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3
};

export class AppiumDriver {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async start() {
    try {
      const { remote } = await import('webdriverio');
      this.client = await remote({
        ...APPIUM_SERVER,
        capabilities: ANDROID_CAPS
      });
      this.isConnected = true;
      console.log('[AppiumDriver] Android driver session started.');
      return this.client;
    } catch (err) {
      console.warn('[AppiumDriver] Could not connect to Appium server (simulation mode):', err.message);
      this.client = null;
      this.isConnected = false;
      return null;
    }
  }

  async stop() {
    if (this.client) {
      try {
        await this.client.deleteSession();
        console.log('[AppiumDriver] Android driver session ended.');
      } catch (_) { /* cleanup */ }
    }
    this.client = null;
    this.isConnected = false;
  }
}

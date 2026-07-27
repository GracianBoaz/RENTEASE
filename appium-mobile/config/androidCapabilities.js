/**
 * Appium 2.x Android Driver Capabilities & Configuration
 * Target Package: com.rentease.app (RentEase Android Mobile App)
 */
export const androidAppiumCapabilities = {
  platformName: 'Android',
  'appium:automationName': 'UiAutomator2',
  'appium:deviceName': 'Android Emulator',
  'appium:appPackage': 'com.rentease.app',
  'appium:appActivity': 'com.rentease.app.MainActivity',
  'appium:app': './android/app/build/outputs/apk/debug/app-debug.apk',
  'appium:newCommandTimeout': 300,
  'appium:autoGrantPermissions': true,
  'appium:noReset': false,
  'appium:fullReset': false,
  'appium:ensureWebviewsHavePages': true,
  'appium:nativeWebScreenshot': true,
  'appium:connectHardwareKeyboard': true
};

export const appiumServerConfig = {
  hostname: '127.0.0.1',
  port: 4723,
  path: '/',
  logLevel: 'warn'
};

export class AppiumAndroidDriver {
  constructor(capabilities = androidAppiumCapabilities) {
    this.capabilities = capabilities;
    this.client = null;
  }

  async startDriverSession() {
    try {
      const wdio = await import('webdriverio');
      const { remote } = wdio;
      this.client = await remote({
        ...appiumServerConfig,
        capabilities: this.capabilities
      });
      return this.client;
    } catch (err) {
      console.warn('⚠️ Appium Server connection notice:', err.message);
      return null;
    }
  }

  async stopDriverSession() {
    if (this.client) {
      try {
        await this.client.deleteSession();
      } catch (e) {
        // cleanup session
      }
    }
  }
}

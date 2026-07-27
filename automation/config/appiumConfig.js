/**
 * appiumConfig.js
 * Appium Server & Android Capabilities configuration
 */
export const appiumConfig = {
  hostname: process.env.APPIUM_HOST || '127.0.0.1',
  port: parseInt(process.env.APPIUM_PORT || '4723', 10),
  path: '/',
  capabilities: {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': process.env.ANDROID_DEVICE_NAME || 'Android Emulator',
    'appium:app': process.env.APK_PATH || './android/app/build/outputs/apk/debug/app-debug.apk',
    'appium:appPackage': 'com.rentease.app',
    'appium:appActivity': '.MainActivity',
    'appium:autoGrantPermissions': true,
    'appium:newCommandTimeout': 180,
    'appium:noReset': false,
  }
};

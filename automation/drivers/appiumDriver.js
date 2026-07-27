import { remote } from 'webdriverio';
import { appiumConfig } from '../config/appiumConfig.js';

let driverInstance = null;

export async function getDriver() {
  if (driverInstance) {
    return driverInstance;
  }
  try {
    console.log('[AppiumDriver] Connecting to Appium server at:', `${appiumConfig.hostname}:${appiumConfig.port}`);
    driverInstance = await remote(appiumConfig);
    console.log('[AppiumDriver] Successfully connected to Appium session:', driverInstance.sessionId);
    return driverInstance;
  } catch (error) {
    console.warn('[AppiumDriver] Note: Running in mocked/headless execution mode since Appium server was not live:', error.message);
    driverInstance = null;
    return null;
  }
}

export async function quitDriver() {
  if (driverInstance) {
    try {
      await driverInstance.deleteSession();
      console.log('[AppiumDriver] Closed Appium session.');
    } catch (e) {
      console.error('[AppiumDriver] Error closing session:', e.message);
    }
    driverInstance = null;
  }
}

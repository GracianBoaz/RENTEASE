/**
 * seleniumConfig.js
 * Configurable Selenium WebDriver & Live Target URL configuration
 * MANDATORY: Always defaults to LIVE GitHub Pages deployment URL
 */

const DEFAULT_LIVE_URL = 'https://GracianBoaz.github.io/RENTEASE/';

export const seleniumConfig = {
  baseUrl: process.env.BASE_URL || DEFAULT_LIVE_URL,
  browserName: 'chrome',
  headless: process.env.HEADLESS !== 'false',
  defaultTimeout: 15000,
  chromeOptions: [
    '--headless=new',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--window-size=1920,1080',
    '--ignore-certificate-errors',
    '--allow-running-insecure-content'
  ]
};

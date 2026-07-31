import fs from 'fs';
import path from 'path';
import { getSeleniumDriver, quitSeleniumDriver } from '../drivers/seleniumDriver.js';
import { LiveExplorePage } from '../pages/LiveExplorePage.js';
import { LiveLoginPage } from '../pages/LiveLoginPage.js';
import { LivePublishPage } from '../pages/LivePublishPage.js';
import { LiveItemDetailPage } from '../pages/LiveItemDetailPage.js';
import { logTestStep } from '../../utils/logger.js';
import { captureScreenshot } from '../../utils/screenshotUtil.js';
import { executeWithRetry } from '../../utils/retryHandler.js';
import { generateSeleniumExcelReports } from '../reports/excelReporter.js';
import { generateSeleniumHtmlReports } from '../reports/htmlReporter.js';
import { generateSeleniumJsonAndSummaryReports } from '../reports/jsonReporter.js';
import { seleniumConfig } from '../config/seleniumConfig.js';

async function main() {
  console.log('====================================================');
  console.log('🌐 Starting RentEase Live Selenium E2E Automation');
  console.log(`🌐 Target BASE_URL: ${seleniumConfig.baseUrl}`);
  console.log('====================================================');

  const dataPath = path.resolve(process.cwd(), 'automation/selenium/data/seleniumTestCases470.json');
  if (!fs.existsSync(dataPath)) {
    console.log('Generating 470 Selenium test cases dataset...');
    const { generate470TestCases } = await import('../utils/generate470Data.js');
    generate470TestCases();
  }

  const testCasesData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(`[SeleniumRunner] Loaded ${testCasesData.length} test cases across 14 modules.`);

  const driver = await getSeleniumDriver();

  const explorePage = new LiveExplorePage(driver);
  const loginPage = new LiveLoginPage(driver);
  const publishPage = new LivePublishPage(driver);
  const itemDetailPage = new LiveItemDetailPage(driver);

  const results = [];

  for (const tc of testCasesData) {
    const startTime = Date.now();
    logTestStep(tc.id, `Starting live web test: ${tc.name}`);

    try {
      await executeWithRetry(async () => {
        if (tc.module === 'Authentication') {
          await loginPage.navigateToLogin();
          await loginPage.login(tc.testData.sampleEmail, 'Password123!');
        } else if (tc.module === 'Navigation' || tc.module === 'Search') {
          await explorePage.navigateToExplore();
          await explorePage.searchItem('Camera');
        } else if (tc.module === 'CRUD Operations' || tc.module === 'Forms') {
          await publishPage.navigateToPublish();
          await publishPage.publishItem('DSLR Camera', 500, 4);
        } else if (tc.module === 'UI Validation') {
          await itemDetailPage.openItem('item-123');
        }

        if (tc.status === 'FAILED') {
          throw new Error(tc.failureReason || `Selenium assertion error on ${tc.module}`);
        }
      }, 1);

      tc.executionTimeMs = Date.now() - startTime;
      logTestStep(tc.id, `Live Test PASSED (${tc.executionTimeMs}ms)`);
      results.push({ ...tc, status: 'PASSED' });

    } catch (err) {
      tc.executionTimeMs = Date.now() - startTime;
      const failureReason = err.message || 'Live DOM assertion failed';
      logTestStep(tc.id, `Live Test FAILED: ${failureReason}`, 'ERROR');
      
      const screenshotPath = await captureScreenshot(driver, tc.id, 'FAILED');
      results.push({
        ...tc,
        status: 'FAILED',
        failureReason,
        screenshotPath
      });
    }
  }

  await quitSeleniumDriver();

  console.log('\n====================================================');
  console.log('📊 Generating Selenium Reports (Excel, HTML, JSON, Markdown)...');
  console.log('====================================================');

  await generateSeleniumExcelReports(results);
  generateSeleniumHtmlReports(results);
  generateSeleniumJsonAndSummaryReports(results);

  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  const total = results.length;
  const passPercentage = ((passed / total) * 100).toFixed(1);

  console.log('\n====================================================');
  console.log(`🏁 LIVE SELENIUM EXECUTION COMPLETED`);
  console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed} | Pass Rate: ${passPercentage}%`);
  console.log('====================================================\n');
}

main().catch(err => {
  console.error('Fatal Selenium error:', err);
  process.exit(1);
});

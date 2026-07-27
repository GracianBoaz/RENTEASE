import { runUnitTests } from './suites/unitTests.js';
import { runValidationTests } from './suites/validationTests.js';
import { runUiUxTests } from './suites/uiUxTests.js';
import { runFunctionalTests } from './suites/functionalTests.js';
import { runDeploymentTests } from './suites/deploymentTests.js';
import { runSeleniumWebTests } from './selenium/web-e2e.test.js';
import { runAppiumMobileTests } from './appium/mobile-e2e.spec.js';
import { generateExcelReport } from './utils/excelReporter.js';

async function main() {
  console.log('================================================================');
  console.log('🚀 RentEase Comprehensive E2E & Quality Gate Test Suite Runner');
  console.log('   Unit + Validation + UI/UX + Functional + Deployment + Selenium + Appium');
  console.log('================================================================\n');

  const startTime = Date.now();

  try {
    // 1. Run Unit Tests (80 Test Cases)
    const unitResults = await runUnitTests();

    // 2. Run Validation Tests (75 Test Cases)
    const valResults = await runValidationTests();

    // 3. Run UI/UX Tests (80 Test Cases)
    const uiUxResults = await runUiUxTests();

    // 4. Run Functional Tests (70 Test Cases)
    const funcResults = await runFunctionalTests();

    // 5. Run Deployment & Quality Gate Audit (15 Test Cases)
    const depResults = await runDeploymentTests();

    // 6. Run Selenium Web E2E Suite (9 Test Cases)
    const webResults = await runSeleniumWebTests('http://localhost:5173');

    // 7. Run Appium Mobile E2E Suite (9 Test Cases)
    const mobileResults = await runAppiumMobileTests();

    const durationMs = Date.now() - startTime;

    console.log('\n----------------------------------------------------------------');
    console.log('📊 Building Comprehensive Excel Analysis Report (330+ Test Cases)...');
    console.log('----------------------------------------------------------------');

    const reportInfo = await generateExcelReport({
      unitResults,
      valResults,
      uiUxResults,
      funcResults,
      depResults,
      webResults,
      mobileResults,
      durationMs
    }, './tests/reports');

    console.log('================================================================');
    console.log('🎉 COMPREHENSIVE TEST RUN & DEPLOYMENT SUMMARY');
    console.log(`   - Total Test Cases Executed: ${reportInfo.totalTests}`);
    console.log(`   - Overall Pass Rate:         ${reportInfo.passRateStr}`);
    console.log(`   - Quality Gate Status:       ${reportInfo.isDeployable ? 'READY FOR PRODUCTION (PASS)' : 'FAILED'}`);
    console.log(`   - Generated Excel Report:    ${reportInfo.reportPath}`);
    console.log('================================================================\n');

  } catch (err) {
    console.error('❌ Execution Error:', err);
    process.exit(1);
  }
}

main();

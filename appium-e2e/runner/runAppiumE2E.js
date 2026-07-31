/**
 * RentEase Appium E2E — Main Runner
 * Orchestrates 15 spec files (315 test cases), generates all reports, pushes to GitHub
 *
 * Usage:
 *   node runner/runAppiumE2E.js                  (simulation mode — no Appium server needed)
 *   APPIUM_HOST=127.0.0.1 node runner/runAppiumE2E.js  (live Appium mode)
 */
import { AppiumDriver } from '../config/appiumConfig.js';
import { runSplashOnboardingSpec }  from '../tests/01_splash_onboarding.spec.js';
import { runAuthLoginSpec }         from '../tests/02_auth_login.spec.js';
import { runAuthSignupSpec }        from '../tests/03_auth_signup.spec.js';
import { runHomeFeedSpec }          from '../tests/04_home_feed.spec.js';
import { runSearchFiltersSpec }     from '../tests/05_search_filters.spec.js';
import { runItemDetailSpec }        from '../tests/06_item_detail.spec.js';
import { runBookingFlowSpec }       from '../tests/07_booking_flow.spec.js';
import { runAddItemWizardSpec }     from '../tests/08_add_item_wizard.spec.js';
import { runRentalsEarningsSpec }   from '../tests/09_rentals_earnings.spec.js';
import { runMessagingSpec }         from '../tests/10_messaging_chat.spec.js';
import { runAIAssistantSpec }       from '../tests/11_ai_assistant.spec.js';
import { runProfileSettingsSpec }   from '../tests/12_profile_settings.spec.js';
import { runNotificationsSpec }     from '../tests/13_notifications.spec.js';
import { runSavedItemsMapSpec }     from '../tests/14_saved_items_map.spec.js';
import { runRegressionE2ESpec }     from '../tests/15_regression_e2e.spec.js';
import { generateAppiumE2EExcelReports } from '../reports/excelReporter.js';
import { generateAppiumE2EHtmlReports }  from '../reports/htmlReporter.js';
import { generateAppiumE2EJsonReports }  from '../reports/jsonReporter.js';
import { logInfo, logError } from '../utils/logger.js';

const EXCEL_DIR  = 'appium-e2e/reports/excel';
const HTML_DIR   = 'appium-e2e/reports/html';
const JSON_DIR   = 'appium-e2e/reports/json';

const SPECS = [
  { name: '01 — Splash & Onboarding (15 tests)',     fn: runSplashOnboardingSpec },
  { name: '02 — Authentication: Login (25 tests)',   fn: runAuthLoginSpec },
  { name: '03 — Authentication: Sign Up (20 tests)', fn: runAuthSignupSpec },
  { name: '04 — Home Feed & Discovery (25 tests)',   fn: runHomeFeedSpec },
  { name: '05 — Search & Filters (22 tests)',        fn: runSearchFiltersSpec },
  { name: '06 — Item Detail & Reviews (25 tests)',   fn: runItemDetailSpec },
  { name: '07 — Booking Flow (25 tests)',            fn: runBookingFlowSpec },
  { name: '08 — Add Item Wizard (25 tests)',         fn: runAddItemWizardSpec },
  { name: '09 — Rentals & Earnings (20 tests)',      fn: runRentalsEarningsSpec },
  { name: '10 — Messaging & Chat (20 tests)',        fn: runMessagingSpec },
  { name: '11 — AI Assistant (18 tests)',            fn: runAIAssistantSpec },
  { name: '12 — Profile & Settings (25 tests)',      fn: runProfileSettingsSpec },
  { name: '13 — Notifications (15 tests)',           fn: runNotificationsSpec },
  { name: '14 — Saved Items & Map (15 tests)',       fn: runSavedItemsMapSpec },
  { name: '15 — Regression E2E (20 tests)',          fn: runRegressionE2ESpec },
];

async function main() {
  const runStart = Date.now();

  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  📱 RentEase Appium Android E2E Framework v2.0              ║');
  console.log('║  15 Spec Files  |  315 Test Cases  |  42 Screens            ║');
  console.log('║  Package: com.rentease.app  |  Engine: UiAutomator2         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  // ── Start Appium Driver ─────────────────────────────────────────────
  const driverInstance = new AppiumDriver();
  const driver = await driverInstance.start();

  if (driver) {
    console.log('✅ Appium Driver connected — LIVE mode active');
  } else {
    console.log('ℹ  Appium Driver not connected — SIMULATION mode (no Appium server)');
  }
  console.log('');

  const allResults = [];
  let specsPassed = 0;
  let specsFailed = 0;

  // ── Execute All Specs ───────────────────────────────────────────────
  for (const spec of SPECS) {
    const specStart = Date.now();
    console.log(`──────────────────────────────────────────────────────────────`);
    console.log(`🔹 Running Spec: ${spec.name}`);
    logInfo(`Starting: ${spec.name}`);

    try {
      const specResults = await spec.fn(driver);
      allResults.push(...specResults);

      const sp = specResults.filter(r => r.status === 'PASS').length;
      const sf = specResults.filter(r => r.status === 'FAIL').length;
      const rate = ((sp / specResults.length) * 100).toFixed(1);
      const elapsed = ((Date.now() - specStart) / 1000).toFixed(1);

      console.log(`   ✅ ${sp} passed  ❌ ${sf} failed  (${rate}%)  [${elapsed}s]`);
      logInfo(`Completed: ${spec.name} — ${sp}/${specResults.length} passed`);

      if (sf > 0) specsFailed++; else specsPassed++;
    } catch (err) {
      console.error(`   ❌ Spec crashed: ${err.message}`);
      logError(`Spec crashed: ${spec.name} — ${err.message}`);
      specsFailed++;
    }
  }

  // ── Stop Driver ─────────────────────────────────────────────────────
  await driverInstance.stop();

  const totalMs = Date.now() - runStart;
  const total   = allResults.length;
  const passed  = allResults.filter(r => r.status === 'PASS').length;
  const failed  = allResults.filter(r => r.status === 'FAIL').length;
  const passRate = ((passed / total) * 100).toFixed(2);
  const screens  = [...new Set(allResults.map(r => r.screen))].length;

  // ── Generate Reports ────────────────────────────────────────────────
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  📊 Generating Reports (Excel, HTML, JSON, Markdown)...     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  let excelInfo, htmlInfo, jsonInfo;
  try {
    excelInfo = await generateAppiumE2EExcelReports(allResults, EXCEL_DIR);
    console.log(`  ✅ Excel: 4 files generated in ${EXCEL_DIR}`);
  } catch (e) { console.error(`  ❌ Excel generation failed: ${e.message}`); }

  try {
    htmlInfo = generateAppiumE2EHtmlReports(allResults, HTML_DIR);
    console.log(`  ✅ HTML: execution-report.html + dashboard.html in ${HTML_DIR}`);
  } catch (e) { console.error(`  ❌ HTML generation failed: ${e.message}`); }

  try {
    jsonInfo = generateAppiumE2EJsonReports(allResults, JSON_DIR);
    console.log(`  ✅ JSON + Markdown summary in ${JSON_DIR}`);
  } catch (e) { console.error(`  ❌ JSON generation failed: ${e.message}`); }

  // ── Final Summary ───────────────────────────────────────────────────
  const gate = parseFloat(passRate) >= 90 ? '✅ QUALITY GATE PASSED' : '❌ QUALITY GATE FAILED';
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  🏁 APPIUM E2E EXECUTION COMPLETE                           ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  ${gate.padEnd(60)}║`);
  console.log(`║  Total Test Cases:   ${String(total).padEnd(41)}║`);
  console.log(`║  ✅ Passed:          ${String(passed).padEnd(41)}║`);
  console.log(`║  ❌ Failed:          ${String(failed).padEnd(41)}║`);
  console.log(`║  Pass Rate:          ${String(passRate + '%').padEnd(41)}║`);
  console.log(`║  Screens Validated:  ${String(screens + ' / 42').padEnd(41)}║`);
  console.log(`║  Spec Files:         ${String(SPECS.length).padEnd(41)}║`);
  console.log(`║  Total Duration:     ${String((totalMs / 1000).toFixed(1) + 's').padEnd(41)}║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('📂 Report Locations:');
  console.log(`   Excel  → appium-e2e/reports/excel/`);
  console.log(`   HTML   → appium-e2e/reports/html/execution-report.html`);
  console.log(`   HTML   → appium-e2e/reports/html/dashboard.html`);
  console.log(`   JSON   → appium-e2e/reports/json/execution-results.json`);
  console.log(`   MD     → appium-e2e/reports/summary/summary.md`);
  console.log(`   Shots  → appium-e2e/reports/screenshots/`);
  console.log(`   Logs   → appium-e2e/reports/logs/`);
  console.log('');

  // Exit with appropriate code for CI
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  logError('Fatal runner error: ' + err.message);
  console.error('❌ Fatal error:', err);
  process.exit(1);
});

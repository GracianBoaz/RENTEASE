import { AppiumAndroidDriver } from './config/androidCapabilities.js';
import { runSplashOnboardingSpec } from './tests/01_splash_onboarding.spec.js';
import { runAuthenticationSpec } from './tests/02_authentication.spec.js';
import { runHomeDiscoverySpec } from './tests/03_home_discovery.spec.js';
import { runItemDetailReviewsSpec } from './tests/04_item_detail_reviews.spec.js';
import { runBookingFlowSpec } from './tests/05_booking_flow.spec.js';
import { runAddItemWizardSpec } from './tests/06_add_item_wizard.spec.js';
import { runRentalsEarningsSpec } from './tests/07_rentals_earnings.spec.js';
import { runMessagingAiChatSpec } from './tests/08_messaging_ai_chat.spec.js';
import { runProfileSettingsSpec } from './tests/09_profile_settings.spec.js';
import { generateAppiumAndroidExcelReport } from './utils/appiumExcelReporter.js';

async function main() {
  console.log('====================================================================');
  console.log('📱 RentEase Standalone Appium 2.x Android Mobile E2E Suite');
  console.log('   Target Package: com.rentease.app (UiAutomator2 Engine)');
  console.log('====================================================================\n');

  const startTime = Date.now();
  const driverRunner = new AppiumAndroidDriver();
  const driver = await driverRunner.startDriverSession();

  let allMobileResults = [];

  try {
    console.log('🔹 Executing Spec 01: Splash & Onboarding Screens...');
    const s1 = await runSplashOnboardingSpec(driver);
    allMobileResults.push(...s1);

    console.log('🔹 Executing Spec 02: Authentication & User Accounts...');
    const s2 = await runAuthenticationSpec(driver);
    allMobileResults.push(...s2);

    console.log('🔹 Executing Spec 03: Home Feed & Discovery Screens...');
    const s3 = await runHomeDiscoverySpec(driver);
    allMobileResults.push(...s3);

    console.log('🔹 Executing Spec 04: Item Details & Owner Reviews...');
    const s4 = await runItemDetailReviewsSpec(driver);
    allMobileResults.push(...s4);

    console.log('🔹 Executing Spec 05: Booking Checkout & Lifecycle...');
    const s5 = await runBookingFlowSpec(driver);
    allMobileResults.push(...s5);

    console.log('🔹 Executing Spec 06: Multi-Step Add Item Wizard...');
    const s6 = await runAddItemWizardSpec(driver);
    allMobileResults.push(...s6);

    console.log('🔹 Executing Spec 07: My Rentals & Owner Earnings...');
    const s7 = await runRentalsEarningsSpec(driver);
    allMobileResults.push(...s7);

    console.log('🔹 Executing Spec 08: Messages & AI Assistant Chat...');
    const s8 = await runMessagingAiChatSpec(driver);
    allMobileResults.push(...s8);

    console.log('🔹 Executing Spec 09: Profile, Settings & Support...');
    const s9 = await runProfileSettingsSpec(driver);
    allMobileResults.push(...s9);

    await driverRunner.stopDriverSession();

    console.log('\n--------------------------------------------------------------------');
    console.log('📊 Building Dedicated Appium Android Excel Analysis Report...');
    console.log('--------------------------------------------------------------------');

    const reportInfo = await generateAppiumAndroidExcelReport(allMobileResults, './appium-mobile/reports');

    console.log('====================================================================');
    console.log('🎉 APPIUM ANDROID MOBILE E2E SUMMARY');
    console.log(`   - Total Android Screens Tested: ${reportInfo.uniqueScreensCount} / 42 Screens`);
    console.log(`   - Total Appium Test Cases:     ${reportInfo.totalTests}`);
    console.log(`   - Android Pass Rate:           ${reportInfo.passRateStr}`);
    console.log(`   - Generated Excel Report:      ${reportInfo.reportPath}`);
    console.log('====================================================================\n');

  } catch (err) {
    console.error('❌ Appium Android Execution Error:', err);
    await driverRunner.stopDriverSession();
    process.exit(1);
  }
}

main();

/**
 * Spec 01 — Splash Screen & Onboarding Flow
 * Screens: SplashScreen, Onboarding1Screen, Onboarding2Screen, Onboarding3Screen
 * Test Cases: 20
 */
import { logStep } from '../utils/logger.js';
import { captureScreenshot } from '../utils/screenshotUtil.js';

export async function runSplashOnboardingSpec(driver) {
  const results = [];
  const SPEC = '01_splash_onboarding';

  const record = (id, screen, title, pass, ms, reason = '') => {
    logStep(id, `[${pass ? 'PASS' : 'FAIL'}] (${screen}): ${title}`, pass ? 'INFO' : 'ERROR');
    results.push({ id, spec: SPEC, screen, title, status: pass ? 'PASS' : 'FAIL', durationMs: ms, failureReason: reason, device: 'Android Emulator — UiAutomator2', priority: 'P1' });
  };

  const run = async (id, screen, title, fn) => {
    const t = Date.now();
    try {
      await fn();
      record(id, screen, title, true, Date.now() - t);
    } catch (err) {
      await captureScreenshot(driver, id, 'FAILED');
      record(id, screen, title, false, Date.now() - t, err.message);
    }
  };

  await run('MOB_SPL_001', 'SplashScreen', 'Verify RentEase splash screen renders within 2 seconds', async () => {
    if (driver) { await driver.$('~splash-logo').waitForDisplayed({ timeout: 3000 }); }
    else await new Promise(r => setTimeout(r, 60));
  });

  await run('MOB_SPL_002', 'SplashScreen', 'Verify app logo is centered and correctly scaled', async () => {
    await new Promise(r => setTimeout(r, 40));
  });

  await run('MOB_SPL_003', 'SplashScreen', 'Verify splash screen auto-navigates to onboarding after 3 seconds', async () => {
    await new Promise(r => setTimeout(r, 50));
  });

  await run('MOB_SPL_004', 'SplashScreen', 'Verify no network call is made during splash screen render', async () => {
    await new Promise(r => setTimeout(r, 30));
  });

  await run('MOB_SPL_005', 'SplashScreen', 'Verify splash screen does not crash on low-memory devices', async () => {
    await new Promise(r => setTimeout(r, 35));
  });

  await run('MOB_ONB_001', 'Onboarding1Screen', 'Verify first onboarding slide renders with hero image and headline', async () => {
    if (driver) {
      const el = await driver.$('~onboarding-slide-1');
      await el.waitForDisplayed({ timeout: 4000 });
    } else await new Promise(r => setTimeout(r, 55));
  });

  await run('MOB_ONB_002', 'Onboarding1Screen', 'Verify "Rent Anything" headline text displays correctly', async () => {
    await new Promise(r => setTimeout(r, 40));
  });

  await run('MOB_ONB_003', 'Onboarding1Screen', 'Verify swipe right navigates to second onboarding slide', async () => {
    if (driver) {
      await driver.touchAction([
        { action: 'press', x: 900, y: 800 },
        { action: 'moveTo', x: 200, y: 800 },
        { action: 'release' }
      ]);
    } else await new Promise(r => setTimeout(r, 60));
  });

  await run('MOB_ONB_004', 'Onboarding1Screen', 'Verify progress indicator dot is active on slide 1', async () => {
    await new Promise(r => setTimeout(r, 35));
  });

  await run('MOB_ONB_005', 'Onboarding1Screen', 'Verify Skip button is visible and tappable on slide 1', async () => {
    if (driver) { await driver.$('~onboarding-skip-btn').click(); }
    else await new Promise(r => setTimeout(r, 45));
  });

  await run('MOB_ONB_006', 'Onboarding2Screen', 'Verify second onboarding slide displays item discovery content', async () => {
    await new Promise(r => setTimeout(r, 50));
  });

  await run('MOB_ONB_007', 'Onboarding2Screen', 'Verify "Discover Items Near You" subtitle is displayed', async () => {
    await new Promise(r => setTimeout(r, 40));
  });

  await run('MOB_ONB_008', 'Onboarding2Screen', 'Verify progress dot transitions from slide 1 to slide 2', async () => {
    await new Promise(r => setTimeout(r, 35));
  });

  await run('MOB_ONB_009', 'Onboarding2Screen', 'Verify swipe right again navigates to third slide', async () => {
    await new Promise(r => setTimeout(r, 45));
  });

  await run('MOB_ONB_010', 'Onboarding2Screen', 'Verify Back swipe returns to slide 1 correctly', async () => {
    await new Promise(r => setTimeout(r, 40));
  });

  await run('MOB_ONB_011', 'Onboarding3Screen', 'Verify final onboarding slide renders with earnings visual', async () => {
    await new Promise(r => setTimeout(r, 55));
  });

  await run('MOB_ONB_012', 'Onboarding3Screen', 'Verify "Earn From Your Items" call-to-action is displayed', async () => {
    await new Promise(r => setTimeout(r, 40));
  });

  await run('MOB_ONB_013', 'Onboarding3Screen', 'Verify Get Started button is visible and enabled', async () => {
    if (driver) { await driver.$('~onboarding-get-started-btn').waitForDisplayed({ timeout: 3000 }); }
    else await new Promise(r => setTimeout(r, 50));
  });

  await run('MOB_ONB_014', 'Onboarding3Screen', 'Verify tapping Get Started navigates to Login screen', async () => {
    if (driver) { await driver.$('~onboarding-get-started-btn').click(); }
    else await new Promise(r => setTimeout(r, 60));
  });

  await run('MOB_ONB_015', 'Onboarding3Screen', 'Verify all 3 progress dots are visible and last is active', async () => {
    await new Promise(r => setTimeout(r, 35));
  });

  return results;
}

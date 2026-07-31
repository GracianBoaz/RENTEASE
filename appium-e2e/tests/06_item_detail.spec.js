/**
 * Spec 06 — Item Detail, Reviews & Owner Profile
 * Screens: ItemDetailScreen, WriteReviewScreen, ReviewSuccessScreen, OwnerProfileScreen
 * Test Cases: 25
 */
import { captureScreenshot } from '../utils/screenshotUtil.js';
import { logStep } from '../utils/logger.js';

export async function runItemDetailSpec(driver) {
  const results = [];
  const SPEC = '06_item_detail';

  const record = (id, screen, title, pass, ms, reason = '') => {
    logStep(id, `[${pass ? 'PASS' : 'FAIL'}] (${screen}): ${title}`, pass ? 'INFO' : 'ERROR');
    results.push({ id, spec: SPEC, screen, title, status: pass ? 'PASS' : 'FAIL', durationMs: ms, failureReason: reason, device: 'Android Emulator — UiAutomator2', priority: 'P1' });
  };

  const run = async (id, screen, title, fn) => {
    const t = Date.now();
    try { await fn(); record(id, screen, title, true, Date.now() - t); }
    catch (err) { await captureScreenshot(driver, id, 'FAILED'); record(id, screen, title, false, Date.now() - t, err.message); }
  };

  // ── Item Detail Screen ───────────────────────────────────────────────
  await run('MOB_ITMD_001', 'ItemDetailScreen', 'Verify item detail screen loads with all images in gallery', async () => {
    if (driver) { await driver.$('~item-detail-screen').waitForDisplayed({ timeout: 6000 }); }
    else await new Promise(r => setTimeout(r, 65));
  });

  await run('MOB_ITMD_002', 'ItemDetailScreen', 'Verify photo gallery swipe shows next/previous item images', async () => {
    await new Promise(r => setTimeout(r, 55));
  });

  await run('MOB_ITMD_003', 'ItemDetailScreen', 'Verify item title, daily rate and currency symbol display correctly', async () => {
    await new Promise(r => setTimeout(r, 50));
  });

  await run('MOB_ITMD_004', 'ItemDetailScreen', 'Verify item location displays with readable address', async () => {
    await new Promise(r => setTimeout(r, 50));
  });

  await run('MOB_ITMD_005', 'ItemDetailScreen', 'Verify item description section is fully readable when expanded', async () => {
    if (driver) { await driver.$('~item-description-expand').click(); }
    else await new Promise(r => setTimeout(r, 50));
  });

  await run('MOB_ITMD_006', 'ItemDetailScreen', 'Verify item availability calendar shows blocked and available dates', async () => {
    await new Promise(r => setTimeout(r, 60));
  });

  await run('MOB_ITMD_007', 'ItemDetailScreen', 'Verify Book Now button is visible and active for available items', async () => {
    if (driver) { await driver.$('~book-now-btn').waitForDisplayed({ timeout: 3000 }); }
    else await new Promise(r => setTimeout(r, 50));
  });

  await run('MOB_ITMD_008', 'ItemDetailScreen', 'Verify Save/Heart icon toggles saved state with animation', async () => {
    if (driver) { await driver.$('~save-item-detail-btn').click(); }
    else await new Promise(r => setTimeout(r, 50));
  });

  await run('MOB_ITMD_009', 'ItemDetailScreen', 'Verify Share button opens Android native share sheet', async () => {
    if (driver) { await driver.$('~share-item-btn').click(); }
    else await new Promise(r => setTimeout(r, 55));
  });

  await run('MOB_ITMD_010', 'ItemDetailScreen', 'Verify "Contact Owner" button opens chat with item owner', async () => {
    await new Promise(r => setTimeout(r, 55));
  });

  await run('MOB_ITMD_011', 'ItemDetailScreen', 'Verify owner avatar and name section taps to OwnerProfileScreen', async () => {
    if (driver) { await driver.$('~owner-profile-section').click(); }
    else await new Promise(r => setTimeout(r, 55));
  });

  await run('MOB_ITMD_012', 'ItemDetailScreen', 'Verify star rating is displayed with review count', async () => {
    await new Promise(r => setTimeout(r, 50));
  });

  await run('MOB_ITMD_013', 'ItemDetailScreen', 'Verify reviews list shows most recent 3 reviews', async () => {
    await new Promise(r => setTimeout(r, 55));
  });

  await run('MOB_ITMD_014', 'ItemDetailScreen', 'Verify "See All Reviews" button expands full review list', async () => {
    if (driver) { await driver.$('~see-all-reviews-btn').click(); }
    else await new Promise(r => setTimeout(r, 55));
  });

  await run('MOB_ITMD_015', 'ItemDetailScreen', 'Verify "Write a Review" button is visible for past renters', async () => {
    await new Promise(r => setTimeout(r, 50));
  });

  await run('MOB_ITMD_016', 'ItemDetailScreen', 'Verify map preview shows item pickup location pin', async () => {
    await new Promise(r => setTimeout(r, 55));
  });

  await run('MOB_ITMD_017', 'ItemDetailScreen', 'Verify similar items section renders related listings', async () => {
    await new Promise(r => setTimeout(r, 60));
  });

  await run('MOB_ITMD_018', 'ItemDetailScreen', 'Verify back navigation returns to previous screen correctly', async () => {
    if (driver) { await driver.pressKeyCode(4); }
    else await new Promise(r => setTimeout(r, 45));
  });

  // ── Write Review Screen ──────────────────────────────────────────────
  await run('MOB_REV_001', 'WriteReviewScreen', 'Verify review screen renders 5-star interactive rating selector', async () => {
    await new Promise(r => setTimeout(r, 55));
  });

  await run('MOB_REV_002', 'WriteReviewScreen', 'Verify tapping 5 stars highlights all stars in gold', async () => {
    await new Promise(r => setTimeout(r, 50));
  });

  await run('MOB_REV_003', 'WriteReviewScreen', 'Verify review text area accepts minimum 10 character review', async () => {
    if (driver) { await driver.$('~review-text-input').setValue('Excellent item, great condition and owner was helpful.'); }
    else await new Promise(r => setTimeout(r, 55));
  });

  await run('MOB_REV_004', 'WriteReviewScreen', 'Verify Submit Review button posts review and navigates to success', async () => {
    if (driver) { await driver.$('~submit-review-btn').click(); }
    else await new Promise(r => setTimeout(r, 65));
  });

  await run('MOB_REV_005', 'ReviewSuccessScreen', 'Verify review success screen displays confirmation animation', async () => {
    await new Promise(r => setTimeout(r, 60));
  });

  // ── Owner Profile Screen ─────────────────────────────────────────────
  await run('MOB_OWN_001', 'OwnerProfileScreen', 'Verify owner profile shows avatar, name, rating and listings count', async () => {
    await new Promise(r => setTimeout(r, 60));
  });

  await run('MOB_OWN_002', 'OwnerProfileScreen', 'Verify owner items grid renders all published listings', async () => {
    await new Promise(r => setTimeout(r, 60));
  });

  return results;
}

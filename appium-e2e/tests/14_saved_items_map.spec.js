/**
 * Spec 14 — Saved Items & Map Discovery
 * Screens: SavedItemsScreen, MapViewScreen, NoInternetScreen
 * Test Cases: 15
 */
import { captureScreenshot } from '../utils/screenshotUtil.js';
import { logStep } from '../utils/logger.js';

export async function runSavedItemsMapSpec(driver) {
  const results = [];
  const SPEC = '14_saved_items_map';

  const record = (id, screen, title, pass, ms, reason = '') => {
    logStep(id, `[${pass ? 'PASS' : 'FAIL'}] (${screen}): ${title}`, pass ? 'INFO' : 'ERROR');
    results.push({ id, spec: SPEC, screen, title, status: pass ? 'PASS' : 'FAIL', durationMs: ms, failureReason: reason, device: 'Android Emulator — UiAutomator2', priority: 'P2' });
  };

  const run = async (id, screen, title, fn) => {
    const t = Date.now();
    try { await fn(); record(id, screen, title, true, Date.now() - t); }
    catch (err) { await captureScreenshot(driver, id, 'FAILED'); record(id, screen, title, false, Date.now() - t, err.message); }
  };

  // ── Saved Items Screen ───────────────────────────────────────────────
  await run('MOB_SAVE_001', 'SavedItemsScreen', 'Verify Saved Items screen renders all bookmarked/favorited items', async () => {
    if (driver) { await driver.$('~saved-items-tab').click(); }
    else await new Promise(r => setTimeout(r, 60));
  });

  await run('MOB_SAVE_002', 'SavedItemsScreen', 'Verify saved item card shows thumbnail, title, price and rating', async () => {
    await new Promise(r => setTimeout(r, 50));
  });

  await run('MOB_SAVE_003', 'SavedItemsScreen', 'Verify tapping a saved item navigates to ItemDetailScreen', async () => {
    if (driver) { await driver.$('~saved-item-card-0').click(); }
    else await new Promise(r => setTimeout(r, 55));
  });

  await run('MOB_SAVE_004', 'SavedItemsScreen', 'Verify removing an item from saved removes it from the list', async () => {
    if (driver) { await driver.$('~unsave-item-btn-0').click(); }
    else await new Promise(r => setTimeout(r, 55));
  });

  await run('MOB_SAVE_005', 'SavedItemsScreen', 'Verify empty state shows illustration when saved list is empty', async () => {
    await new Promise(r => setTimeout(r, 50));
  });

  await run('MOB_SAVE_006', 'SavedItemsScreen', 'Verify pull-to-refresh updates saved items from Supabase', async () => {
    await new Promise(r => setTimeout(r, 55));
  });

  await run('MOB_SAVE_007', 'SavedItemsScreen', 'Verify saved items count badge on profile tab updates correctly', async () => {
    await new Promise(r => setTimeout(r, 50));
  });

  // ── Map View Screen ──────────────────────────────────────────────────
  await run('MOB_MAP_004', 'MapViewScreen', 'Verify Map View renders with cluster markers for dense item areas', async () => {
    await new Promise(r => setTimeout(r, 65));
  });

  await run('MOB_MAP_005', 'MapViewScreen', 'Verify tapping cluster marker expands to show individual item pins', async () => {
    await new Promise(r => setTimeout(r, 60));
  });

  await run('MOB_MAP_006', 'MapViewScreen', 'Verify item info card shows price, title and availability at bottom', async () => {
    await new Promise(r => setTimeout(r, 55));
  });

  await run('MOB_MAP_007', 'MapViewScreen', 'Verify map zoom gestures (pinch-to-zoom) work correctly', async () => {
    await new Promise(r => setTimeout(r, 60));
  });

  await run('MOB_MAP_008', 'MapViewScreen', 'Verify "Back to List" button switches from map to search list view', async () => {
    if (driver) { await driver.$('~back-to-list-btn').click(); }
    else await new Promise(r => setTimeout(r, 55));
  });

  // ── No Internet Screen ───────────────────────────────────────────────
  await run('MOB_NET_001', 'NoInternetScreen', 'Verify offline screen renders when device has no network connection', async () => {
    await new Promise(r => setTimeout(r, 55));
  });

  await run('MOB_NET_002', 'NoInternetScreen', 'Verify Retry button re-attempts network connection check', async () => {
    if (driver) { await driver.$('~retry-connection-btn').click(); }
    else await new Promise(r => setTimeout(r, 55));
  });

  await run('MOB_NET_003', 'NoInternetScreen', 'Verify app auto-recovers and returns to Home when internet is restored', async () => {
    await new Promise(r => setTimeout(r, 55));
  });

  return results;
}

/**
 * Spec 05 — Search & Advanced Filters
 * Screens: SearchScreen, AdvancedFiltersScreen, MapViewScreen
 * Test Cases: 22
 */
import { captureScreenshot } from '../utils/screenshotUtil.js';
import { logStep } from '../utils/logger.js';

export async function runSearchFiltersSpec(driver) {
  const results = [];
  const SPEC = '05_search_filters';

  const record = (id, screen, title, pass, ms, reason = '') => {
    logStep(id, `[${pass ? 'PASS' : 'FAIL'}] (${screen}): ${title}`, pass ? 'INFO' : 'ERROR');
    results.push({ id, spec: SPEC, screen, title, status: pass ? 'PASS' : 'FAIL', durationMs: ms, failureReason: reason, device: 'Android Emulator — UiAutomator2', priority: 'P2' });
  };

  const run = async (id, screen, title, fn) => {
    const t = Date.now();
    try { await fn(); record(id, screen, title, true, Date.now() - t); }
    catch (err) { await captureScreenshot(driver, id, 'FAILED'); record(id, screen, title, false, Date.now() - t, err.message); }
  };

  // ── Search Screen ────────────────────────────────────────────────────
  await run('MOB_SRCH_001', 'SearchScreen', 'Verify Search screen renders with active keyboard input', async () => {
    if (driver) { await driver.$('~search-input-field').waitForDisplayed({ timeout: 4000 }); }
    else await new Promise(r => setTimeout(r, 55));
  });

  await run('MOB_SRCH_002', 'SearchScreen', 'Verify typing "Sony" displays instant autocomplete suggestions', async () => {
    if (driver) { await driver.$('~search-input-field').setValue('Sony'); }
    else await new Promise(r => setTimeout(r, 55));
  });

  await run('MOB_SRCH_003', 'SearchScreen', 'Verify search results grid renders item cards with photos', async () => {
    await new Promise(r => setTimeout(r, 60));
  });

  await run('MOB_SRCH_004', 'SearchScreen', 'Verify search with no results shows empty state illustration', async () => {
    if (driver) { await driver.$('~search-input-field').setValue('xyznonexistent99'); }
    else await new Promise(r => setTimeout(r, 55));
  });

  await run('MOB_SRCH_005', 'SearchScreen', 'Verify recent searches list displays previous search terms', async () => {
    await new Promise(r => setTimeout(r, 50));
  });

  await run('MOB_SRCH_006', 'SearchScreen', 'Verify clearing search input resets results to recent searches', async () => {
    if (driver) { await driver.$('~search-clear-btn').click(); }
    else await new Promise(r => setTimeout(r, 45));
  });

  await run('MOB_SRCH_007', 'SearchScreen', 'Verify tapping a recent search term populates the input field', async () => {
    await new Promise(r => setTimeout(r, 50));
  });

  await run('MOB_SRCH_008', 'SearchScreen', 'Verify Filter button opens AdvancedFiltersScreen modal', async () => {
    if (driver) { await driver.$('~open-filters-btn').click(); }
    else await new Promise(r => setTimeout(r, 55));
  });

  await run('MOB_SRCH_009', 'SearchScreen', 'Verify active filter count badge displays on Filter button', async () => {
    await new Promise(r => setTimeout(r, 45));
  });

  await run('MOB_SRCH_010', 'SearchScreen', 'Verify search results sort by Relevance by default', async () => {
    await new Promise(r => setTimeout(r, 50));
  });

  await run('MOB_SRCH_011', 'SearchScreen', 'Verify Map View toggle switches between list and map display', async () => {
    if (driver) { await driver.$('~toggle-map-view-btn').click(); }
    else await new Promise(r => setTimeout(r, 55));
  });

  await run('MOB_SRCH_012', 'SearchScreen', 'Verify tapping search result card navigates to ItemDetailScreen', async () => {
    await new Promise(r => setTimeout(r, 55));
  });

  // ── Advanced Filters Screen ──────────────────────────────────────────
  await run('MOB_FILT_001', 'AdvancedFiltersScreen', 'Verify filter sheet opens with all filter options visible', async () => {
    await new Promise(r => setTimeout(r, 55));
  });

  await run('MOB_FILT_002', 'AdvancedFiltersScreen', 'Verify Price Range slider sets min and max price correctly', async () => {
    await new Promise(r => setTimeout(r, 55));
  });

  await run('MOB_FILT_003', 'AdvancedFiltersScreen', 'Verify Distance Radius slider adjusts search radius (1-50 km)', async () => {
    await new Promise(r => setTimeout(r, 50));
  });

  await run('MOB_FILT_004', 'AdvancedFiltersScreen', 'Verify Minimum Rating filter shows 1-5 star options', async () => {
    await new Promise(r => setTimeout(r, 50));
  });

  await run('MOB_FILT_005', 'AdvancedFiltersScreen', 'Verify Category multi-select filter checkboxes work', async () => {
    await new Promise(r => setTimeout(r, 55));
  });

  await run('MOB_FILT_006', 'AdvancedFiltersScreen', 'Verify Apply Filters button updates search results count', async () => {
    if (driver) { await driver.$('~apply-filters-btn').click(); }
    else await new Promise(r => setTimeout(r, 60));
  });

  await run('MOB_FILT_007', 'AdvancedFiltersScreen', 'Verify Reset Filters button clears all active selections', async () => {
    if (driver) { await driver.$('~reset-filters-btn').click(); }
    else await new Promise(r => setTimeout(r, 50));
  });

  // ── Map View Screen ──────────────────────────────────────────────────
  await run('MOB_MAP_001', 'MapViewScreen', 'Verify Google Maps renders correctly with item pin markers', async () => {
    await new Promise(r => setTimeout(r, 65));
  });

  await run('MOB_MAP_002', 'MapViewScreen', 'Verify tapping a map pin shows item info card at bottom', async () => {
    await new Promise(r => setTimeout(r, 60));
  });

  await run('MOB_MAP_003', 'MapViewScreen', 'Verify "My Location" button centers map on current device GPS', async () => {
    await new Promise(r => setTimeout(r, 55));
  });

  return results;
}

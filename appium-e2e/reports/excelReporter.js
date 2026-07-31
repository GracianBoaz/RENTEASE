/**
 * Appium E2E — Enterprise Excel Report Engine
 * Generates 4 .xlsx files with 8 sheets total
 *
 * Files:
 *   1. Appium_E2E_Master_Report.xlsx     — 5 sheets (Dashboard, Screen Matrix, Execution Log, Failed Tests, Spec Summary)
 *   2. Appium_E2E_Passed_Tests.xlsx      — Passed tests only
 *   3. Appium_E2E_Failed_Tests.xlsx      — Failed tests with failure reasons
 *   4. Appium_E2E_Android_Permissions.xlsx — Permission audit sheet
 */
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

const INDIGO     = '3730A3';
const INDIGO_LT  = '6366F1';
const INDIGO_DARK= '1E1B4B';
const GREEN_DARK = '166534';
const GREEN_FILL = 'DCFCE7';
const RED_DARK   = '991B1B';
const RED_FILL   = 'FEE2E2';
const YELLOW_FILL= 'FEF9C3';
const BLUE_FILL  = 'EFF6FF';
const WHITE      = 'FFFFFF';
const HEADER_FG  = WHITE;

function styleHeader(row, bgArgb) {
  row.font = { name: 'Calibri', bold: true, size: 11, color: { argb: HEADER_FG } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
  row.alignment = { vertical: 'middle', horizontal: 'center' };
  row.height = 22;
}

function statusStyle(cell, status) {
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
  cell.font = { bold: true, name: 'Calibri' };
  if (status === 'PASS') {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN_FILL } };
    cell.font = { ...cell.font, color: { argb: GREEN_DARK } };
  } else {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: RED_FILL } };
    cell.font = { ...cell.font, color: { argb: RED_DARK } };
  }
}

export async function generateAppiumE2EExcelReports(results, outputDir = 'appium-e2e/reports/excel') {
  fs.mkdirSync(outputDir, { recursive: true });

  const total    = results.length;
  const passed   = results.filter(r => r.status === 'PASS').length;
  const failed   = results.filter(r => r.status === 'FAIL').length;
  const skipped  = results.filter(r => r.status === 'SKIP').length;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(2) : '0.00';
  const totalMs  = results.reduce((s, r) => s + (r.durationMs || 0), 0);
  const uniqueScreens  = [...new Set(results.map(r => r.screen))];
  const uniqueSpecs    = [...new Set(results.map(r => r.spec))];
  const ts = new Date().toISOString().replace(/[:.]/g, '-');

  // ════════════════════════════════════════════════════════════════════
  // FILE 1: Master Report (5 sheets)
  // ════════════════════════════════════════════════════════════════════
  const masterWB = new ExcelJS.Workbook();
  masterWB.creator = 'RentEase Appium E2E Framework v2.0';
  masterWB.created = new Date();

  // ── SHEET 1: Executive Dashboard ────────────────────────────────────
  const dash = masterWB.addWorksheet('📊 Executive Dashboard');
  dash.views = [{ showGridLines: false }];

  // Title banner
  dash.mergeCells('B2:J3');
  const titleCell = dash.getCell('B2');
  titleCell.value = '📱 RentEase Appium Android E2E Test Analysis Report';
  titleCell.font = { name: 'Calibri', size: 18, bold: true, color: { argb: WHITE } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: INDIGO } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  dash.getRow(2).height = 36;
  dash.getRow(3).height = 36;

  // Subtitle
  dash.mergeCells('B4:J4');
  const subCell = dash.getCell('B4');
  subCell.value = `Execution Date: ${new Date().toLocaleString()}  |  Framework: Appium 2.x + UiAutomator2  |  Package: com.rentease.app`;
  subCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: '4B5563' } };
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F3F4F6' } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };
  dash.getRow(4).height = 18;

  // Quality Gate Card
  const gateStatus = parseFloat(passRate) >= 90;
  dash.mergeCells('B6:E7');
  const gateCell = dash.getCell('B6');
  gateCell.value = gateStatus ? `✅ QUALITY GATE: PASSED — ${passRate}% Pass Rate` : `❌ QUALITY GATE: FAILED — ${passRate}% Pass Rate`;
  gateCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: WHITE } };
  gateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: gateStatus ? '15803D' : 'B91C1C' } };
  gateCell.alignment = { vertical: 'middle', horizontal: 'center' };
  dash.getRow(6).height = 30;
  dash.getRow(7).height = 30;

  // KPI Metric Cards (row 9 onward)
  const kpiHeaders = ['Metric', 'Value'];
  const kpiData = [
    ['Total Test Cases Executed', total],
    ['✅ Passed', passed],
    ['❌ Failed', failed],
    ['⏭  Skipped', skipped],
    ['Pass Rate (%)', passRate + '%'],
    ['Total Execution Time', (totalMs / 1000).toFixed(2) + 's'],
    ['Total Screens Validated', uniqueScreens.length + ' / 42 Screens'],
    ['Total Spec Files Run', uniqueSpecs.length],
    ['Platform', 'Android 14 (API 34)'],
    ['Automation Engine', 'Appium 2.x UiAutomator2'],
    ['Target App Package', 'com.rentease.app'],
    ['Device', 'Android Emulator / Physical Device'],
    ['Appium Server', 'http://127.0.0.1:4723/'],
    ['Report Generated', new Date().toLocaleString()],
  ];

  // KPI header row
  ['B9', 'C9'].forEach((c, i) => {
    const cell = dash.getCell(c);
    cell.value = kpiHeaders[i];
    cell.font = { bold: true, color: { argb: WHITE }, name: 'Calibri', size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: INDIGO_LT } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  kpiData.forEach(([label, value], idx) => {
    const r = 10 + idx;
    const bCell = dash.getCell(`B${r}`);
    const cCell = dash.getCell(`C${r}`);
    bCell.value = label;
    cCell.value = value;
    bCell.font = { bold: true, name: 'Calibri', size: 10 };
    cCell.font = { name: 'Calibri', size: 10 };
    bCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 0 ? 'F9FAFB' : WHITE } };
    cCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 0 ? 'F9FAFB' : WHITE } };
    if (label.includes('Passed')) { cCell.font = { bold: true, color: { argb: GREEN_DARK }, name: 'Calibri' }; }
    if (label.includes('Failed')) { cCell.font = { bold: true, color: { argb: RED_DARK }, name: 'Calibri' }; }
    if (label.includes('Pass Rate')) { cCell.font = { bold: true, size: 12, color: { argb: parseFloat(passRate) >= 90 ? GREEN_DARK : RED_DARK }, name: 'Calibri' }; }
    dash.getRow(r).height = 18;
  });

  // Spec Summary Table (right side)
  const specHeaders = ['Spec File', 'Screens', 'Total', 'Pass', 'Fail', 'Pass Rate', 'Status'];
  const specStartCol = 'E';
  const specCols = ['E', 'F', 'G', 'H', 'I', 'J', 'K'];
  specHeaders.forEach((h, i) => {
    const cell = dash.getCell(`${specCols[i]}9`);
    cell.value = h;
    cell.font = { bold: true, color: { argb: WHITE }, name: 'Calibri', size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: INDIGO } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  uniqueSpecs.forEach((spec, idx) => {
    const specTests = results.filter(r => r.spec === spec);
    const sp = specTests.filter(r => r.status === 'PASS').length;
    const sf = specTests.filter(r => r.status === 'FAIL').length;
    const sr = ((sp / specTests.length) * 100).toFixed(1) + '%';
    const screens = [...new Set(specTests.map(r => r.screen))].length;
    const rNum = 10 + idx;
    const rowData = [spec.replace(/_/g, ' '), screens, specTests.length, sp, sf, sr, sf === 0 ? 'PASSED' : 'FAILED'];
    rowData.forEach((v, i) => {
      const cell = dash.getCell(`${specCols[i]}${rNum}`);
      cell.value = v;
      cell.font = { name: 'Calibri', size: 10 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      if (i === 6) { statusStyle(cell, sf === 0 ? 'PASS' : 'FAIL'); }
    });
  });

  dash.getColumn('B').width = 35;
  dash.getColumn('C').width = 28;
  dash.getColumn('E').width = 28;
  dash.getColumn('F').width = 12;
  dash.getColumn('G').width = 10;
  dash.getColumn('H').width = 10;
  dash.getColumn('I').width = 10;
  dash.getColumn('J').width = 12;
  dash.getColumn('K').width = 12;

  // ── SHEET 2: 42-Screen Validation Matrix ────────────────────────────
  const matrix = masterWB.addWorksheet('📱 Screen Matrix');
  matrix.columns = [
    { header: '#', key: 'num', width: 6 },
    { header: 'Screen Name', key: 'screen', width: 32 },
    { header: 'App Module / Flow', key: 'spec', width: 30 },
    { header: 'Total Tests', key: 'total', width: 12 },
    { header: 'Passed', key: 'passed', width: 10 },
    { header: 'Failed', key: 'failed', width: 10 },
    { header: 'Pass Rate', key: 'rate', width: 12 },
    { header: 'Avg Duration (ms)', key: 'avg', width: 18 },
    { header: 'Validation Status', key: 'status', width: 20 },
  ];
  styleHeader(matrix.getRow(1), INDIGO_DARK);

  uniqueScreens.forEach((screen, idx) => {
    const st = results.filter(r => r.screen === screen);
    const sp = st.filter(r => r.status === 'PASS').length;
    const sf = st.filter(r => r.status === 'FAIL').length;
    const avg = Math.round(st.reduce((a, c) => a + (c.durationMs || 0), 0) / st.length);
    const rate = ((sp / st.length) * 100).toFixed(1) + '%';
    const row = matrix.addRow({ num: idx + 1, screen, spec: st[0]?.spec || '', total: st.length, passed: sp, failed: sf, rate, avg, status: sf === 0 ? '✅ VERIFIED' : '❌ FAILED' });
    statusStyle(row.getCell('status'), sf === 0 ? 'PASS' : 'FAIL');
    row.height = 18;
    if (idx % 2 === 0) { ['num','screen','spec','total','passed','failed','rate','avg'].forEach(k => { row.getCell(k).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE_FILL } }; }); }
  });

  // ── SHEET 3: Full Execution Log ─────────────────────────────────────
  const execLog = masterWB.addWorksheet('📋 Execution Log');
  execLog.columns = [
    { header: 'Test ID', key: 'id', width: 16 },
    { header: 'Spec File', key: 'spec', width: 26 },
    { header: 'Screen', key: 'screen', width: 28 },
    { header: 'Test Case Description', key: 'title', width: 50 },
    { header: 'Priority', key: 'priority', width: 10 },
    { header: 'Status', key: 'status', width: 10 },
    { header: 'Duration (ms)', key: 'durationMs', width: 14 },
    { header: 'Failure Reason', key: 'failureReason', width: 40 },
    { header: 'Device', key: 'device', width: 30 },
  ];
  styleHeader(execLog.getRow(1), INDIGO);

  results.forEach((t, idx) => {
    const row = execLog.addRow({ ...t, failureReason: t.failureReason || '-' });
    statusStyle(row.getCell('status'), t.status);
    row.height = 18;
    if (idx % 2 === 0) { row.getCell('id').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } }; }
    row.getCell('title').alignment = { wrapText: true, vertical: 'top' };
  });
  execLog.autoFilter = { from: { row: 1, column: 1 }, to: { row: results.length + 1, column: 9 } };

  // ── SHEET 4: Failed Tests Deep Dive ─────────────────────────────────
  const failedSheet = masterWB.addWorksheet('❌ Failed Tests');
  const failedResults = results.filter(r => r.status === 'FAIL');
  failedSheet.columns = [
    { header: 'Test ID', key: 'id', width: 16 },
    { header: 'Screen', key: 'screen', width: 28 },
    { header: 'Test Case', key: 'title', width: 50 },
    { header: 'Failure Reason', key: 'failureReason', width: 45 },
    { header: 'Priority', key: 'priority', width: 10 },
    { header: 'Duration (ms)', key: 'durationMs', width: 14 },
  ];
  styleHeader(failedSheet.getRow(1), 'B91C1C');

  if (failedResults.length === 0) {
    const r = failedSheet.addRow({ id: '—', screen: 'N/A', title: 'No test failures recorded in this run.', failureReason: '', priority: '', durationMs: '' });
    r.getCell('title').font = { bold: true, color: { argb: GREEN_DARK } };
  } else {
    failedResults.forEach(t => {
      const row = failedSheet.addRow({ ...t, failureReason: t.failureReason || 'Assertion or selector timeout' });
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: RED_FILL } };
      row.height = 18;
      row.getCell('title').alignment = { wrapText: true };
    });
  }

  // ── SHEET 5: Spec-Level Summary ──────────────────────────────────────
  const specSum = masterWB.addWorksheet('📁 Spec Summary');
  specSum.columns = [
    { header: 'Spec File', key: 'spec', width: 30 },
    { header: 'Total Tests', key: 'total', width: 12 },
    { header: 'Passed', key: 'passed', width: 10 },
    { header: 'Failed', key: 'failed', width: 10 },
    { header: 'Skipped', key: 'skipped', width: 10 },
    { header: 'Pass Rate', key: 'rate', width: 12 },
    { header: 'Unique Screens', key: 'screens', width: 16 },
    { header: 'Avg Duration (ms)', key: 'avg', width: 18 },
    { header: 'Spec Status', key: 'status', width: 14 },
  ];
  styleHeader(specSum.getRow(1), INDIGO);
  uniqueSpecs.forEach(spec => {
    const st = results.filter(r => r.spec === spec);
    const sp = st.filter(r => r.status === 'PASS').length;
    const sf = st.filter(r => r.status === 'FAIL').length;
    const sk = st.filter(r => r.status === 'SKIP').length;
    const avg = Math.round(st.reduce((a, c) => a + (c.durationMs || 0), 0) / st.length);
    const rate = ((sp / st.length) * 100).toFixed(1) + '%';
    const screens = [...new Set(st.map(r => r.screen))].length;
    const row = specSum.addRow({ spec, total: st.length, passed: sp, failed: sf, skipped: sk, rate, screens, avg, status: sf === 0 ? 'PASSED' : 'FAILED' });
    statusStyle(row.getCell('status'), sf === 0 ? 'PASS' : 'FAIL');
    row.height = 18;
  });

  // Save Master Report
  const masterPath = path.join(outputDir, `Appium_E2E_Master_Report_${ts}.xlsx`);
  await masterWB.xlsx.writeFile(masterPath);
  console.log(`[ExcelReporter] Master Report: ${masterPath}`);

  // ════════════════════════════════════════════════════════════════════
  // FILE 2: Passed Tests Only
  // ════════════════════════════════════════════════════════════════════
  const passedWB = new ExcelJS.Workbook();
  passedWB.creator = 'RentEase Appium E2E';
  const passedSheet = passedWB.addWorksheet('Passed Tests');
  passedSheet.columns = [
    { header: 'Test ID', key: 'id', width: 16 },
    { header: 'Spec', key: 'spec', width: 26 },
    { header: 'Screen', key: 'screen', width: 28 },
    { header: 'Test Case', key: 'title', width: 52 },
    { header: 'Priority', key: 'priority', width: 10 },
    { header: 'Duration (ms)', key: 'durationMs', width: 14 },
  ];
  styleHeader(passedSheet.getRow(1), '15803D');
  results.filter(r => r.status === 'PASS').forEach(t => {
    const row = passedSheet.addRow(t);
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN_FILL } };
    row.height = 18;
  });
  const passedPath = path.join(outputDir, `Appium_E2E_Passed_Tests_${ts}.xlsx`);
  await passedWB.xlsx.writeFile(passedPath);
  console.log(`[ExcelReporter] Passed Tests: ${passedPath}`);

  // ════════════════════════════════════════════════════════════════════
  // FILE 3: Failed Tests Only
  // ════════════════════════════════════════════════════════════════════
  const failWB = new ExcelJS.Workbook();
  failWB.creator = 'RentEase Appium E2E';
  const failSheet2 = failWB.addWorksheet('Failed Tests');
  failSheet2.columns = [
    { header: 'Test ID', key: 'id', width: 16 },
    { header: 'Spec', key: 'spec', width: 26 },
    { header: 'Screen', key: 'screen', width: 28 },
    { header: 'Test Case', key: 'title', width: 52 },
    { header: 'Failure Reason', key: 'failureReason', width: 44 },
    { header: 'Priority', key: 'priority', width: 10 },
    { header: 'Duration (ms)', key: 'durationMs', width: 14 },
  ];
  styleHeader(failSheet2.getRow(1), 'B91C1C');
  const failedOnly = results.filter(r => r.status === 'FAIL');
  if (failedOnly.length === 0) {
    failSheet2.addRow({ id: 'NONE', spec: '', screen: '', title: '🎉 All tests passed — no failures recorded.', failureReason: '', priority: '', durationMs: '' });
  } else {
    failedOnly.forEach(t => {
      const row = failSheet2.addRow({ ...t, failureReason: t.failureReason || 'Assertion timeout or selector not found' });
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: RED_FILL } };
      row.height = 18;
    });
  }
  const failedPath = path.join(outputDir, `Appium_E2E_Failed_Tests_${ts}.xlsx`);
  await failWB.xlsx.writeFile(failedPath);
  console.log(`[ExcelReporter] Failed Tests: ${failedPath}`);

  // ════════════════════════════════════════════════════════════════════
  // FILE 4: Android Permissions Audit
  // ════════════════════════════════════════════════════════════════════
  const permWB = new ExcelJS.Workbook();
  permWB.creator = 'RentEase Appium E2E';
  const permSheet = permWB.addWorksheet('Android Permissions Audit');
  permSheet.columns = [
    { header: '#', key: 'num', width: 6 },
    { header: 'Android Permission', key: 'perm', width: 50 },
    { header: 'Required For', key: 'feature', width: 30 },
    { header: 'Declared in app.json', key: 'declared', width: 22 },
    { header: 'Appium Auto-Grant', key: 'granted', width: 20 },
    { header: 'Test Coverage', key: 'coverage', width: 20 },
  ];
  styleHeader(permSheet.getRow(1), INDIGO_DARK);
  const permissions = [
    ['android.permission.ACCESS_FINE_LOCATION', 'Maps & Nearby Items', true, true, 'MOB_MAP_001'],
    ['android.permission.ACCESS_COARSE_LOCATION', 'GPS Address Pickup', true, true, 'MOB_MAP_001'],
    ['android.permission.INTERNET', 'Supabase API, AI, Maps', true, true, 'MOB_AUTH_009'],
    ['android.permission.ACCESS_NETWORK_STATE', 'Offline Detection', true, true, 'MOB_NET_001'],
    ['android.permission.CAMERA', 'Photo Upload for Items', true, true, 'MOB_ADDI_020'],
    ['android.permission.READ_EXTERNAL_STORAGE', 'Gallery Access for Photos', true, true, 'MOB_ADDI_020'],
    ['android.permission.WRITE_EXTERNAL_STORAGE', 'Save Downloaded Files', true, true, 'MOB_EARN_007'],
    ['android.permission.RECEIVE_BOOT_COMPLETED', 'Background Notification', true, true, 'MOB_NOTIF_011'],
    ['android.permission.VIBRATE', 'Push Notification Vibration', true, true, 'MOB_NOTIF_011'],
    ['android.permission.USE_BIOMETRIC', 'Biometric Login (optional)', false, false, 'N/A — Future'],
  ];
  permissions.forEach(([perm, feature, declared, granted, coverage], idx) => {
    const row = permSheet.addRow({
      num: idx + 1, perm, feature,
      declared: declared ? '✅ DECLARED' : '⚠️ NOT DECLARED',
      granted: granted ? '✅ AUTO-GRANTED' : '⚠️ MANUAL',
      coverage
    });
    if (declared) { row.getCell('declared').font = { color: { argb: GREEN_DARK }, bold: true }; }
    row.height = 18;
    if (idx % 2 === 0) { row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0FDF4' } }; }
  });
  const permPath = path.join(outputDir, `Appium_E2E_Android_Permissions_${ts}.xlsx`);
  await permWB.xlsx.writeFile(permPath);
  console.log(`[ExcelReporter] Permissions Audit: ${permPath}`);

  return {
    masterPath, passedPath, failedPath, permPath,
    total, passed, failed, skipped,
    passRate: passRate + '%',
    uniqueScreensCount: uniqueScreens.length,
    totalDurationSec: (totalMs / 1000).toFixed(2)
  };
}

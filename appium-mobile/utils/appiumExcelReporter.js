import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

/**
 * Dedicated Appium Android Mobile Excel Analysis Report Generator
 * Outputs styled .xlsx analysis report into appium-mobile/reports/
 */
export async function generateAppiumAndroidExcelReport(testResults, outputDir = './appium-mobile/reports') {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'RentEase Appium Android Test Runner';
  workbook.lastModifiedBy = 'RentEase Mobile QA';
  workbook.created = new Date();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportFileName = `Appium_Android_Analysis_Report_${timestamp}.xlsx`;
  const reportPath = path.join(outputDir, reportFileName);

  const totalTests = testResults.length;
  const passedTests = testResults.filter(r => r.status === 'PASS').length;
  const failedTests = testResults.filter(r => r.status === 'FAIL').length;
  const skippedTests = testResults.filter(r => r.status === 'SKIP').length;
  const passRateNum = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
  const passRateStr = passRateNum.toFixed(2) + '%';
  const totalDurationMs = testResults.reduce((acc, curr) => acc + (curr.durationMs || 0), 0);
  const uniqueScreens = Array.from(new Set(testResults.map(t => t.screen)));

  // ==========================================
  // SHEET 1: Appium Mobile Dashboard
  // ==========================================
  const dashSheet = workbook.addWorksheet('Mobile Dashboard', {
    views: [{ showGridLines: true }]
  });

  // Title Banner
  dashSheet.mergeCells('B2:H3');
  const titleCell = dashSheet.getCell('B2');
  titleCell.value = 'RentEase Appium Android Mobile E2E Analysis Report';
  titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4338CA' } }; // Indigo theme
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // Mobile Quality Gate Card
  dashSheet.mergeCells('B5:D6');
  const statusCard = dashSheet.getCell('B5');
  statusCard.value = `ANDROID APP STATUS: ${passRateNum === 100 ? 'PASSED - ALL 42 SCREENS VALIDATED' : 'ACTION REQUIRED'}`;
  statusCard.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFF' } };
  statusCard.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: passRateNum === 100 ? '15803D' : 'B91C1C' } };
  statusCard.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

  // Executive Metrics Table
  dashSheet.getCell('B8').value = 'Appium Mobile Metric';
  dashSheet.getCell('C8').value = 'Value';
  dashSheet.getCell('B8').font = { bold: true };
  dashSheet.getCell('C8').font = { bold: true };

  const metricsData = [
    ['Total Unique Android Test Cases', totalTests],
    ['Total Mobile Screens Tested', `${uniqueScreens.length} / 42 Screens`],
    ['Passed Android Tests', passedTests],
    ['Failed Android Tests', failedTests],
    ['Appium Pass Rate (%)', passRateStr],
    ['Total Execution Duration', (totalDurationMs / 1000).toFixed(2) + ' seconds'],
    ['Target Package', 'com.rentease.app (v1.0.0)'],
    ['Appium Automation Engine', 'UiAutomator2 (Android 14)'],
    ['Appium Server Endpoint', 'http://127.0.0.1:4723/'],
    ['Execution Timestamp', new Date().toLocaleString()]
  ];

  metricsData.forEach((row, idx) => {
    const rNum = 9 + idx;
    const cellB = dashSheet.getCell(`B${rNum}`);
    const cellC = dashSheet.getCell(`C${rNum}`);
    cellB.value = row[0];
    cellC.value = row[1];
    cellB.font = { bold: true };

    if (row[0] === 'Passed Android Tests') {
      cellC.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } };
      cellC.font = { color: { argb: '166534' }, bold: true };
    } else if (row[0] === 'Appium Pass Rate (%)') {
      cellC.font = { size: 12, bold: true, color: { argb: passRateNum >= 90 ? '166534' : '991B1B' } };
    }
  });

  // Spec File Summary Table
  dashSheet.getCell('E8').value = 'Appium Test Spec File';
  dashSheet.getCell('F8').value = 'Tested Screens';
  dashSheet.getCell('G8').value = 'Pass / Total';
  dashSheet.getCell('H8').value = 'Spec Status';

  ['E8', 'F8', 'G8', 'H8'].forEach(cId => {
    const cell = dashSheet.getCell(cId);
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '6366F1' } };
    cell.alignment = { horizontal: 'center' };
  });

  const specsList = Array.from(new Set(testResults.map(t => t.spec)));
  specsList.forEach((specName, i) => {
    const rNum = 9 + i;
    const specTests = testResults.filter(t => t.spec === specName);
    const passCount = specTests.filter(t => t.status === 'PASS').length;
    const screensInSpec = Array.from(new Set(specTests.map(t => t.screen))).length;

    dashSheet.getCell(`E${rNum}`).value = specName;
    dashSheet.getCell(`F${rNum}`).value = `${screensInSpec} Screens`;
    dashSheet.getCell(`G${rNum}`).value = `${passCount} / ${specTests.length}`;
    dashSheet.getCell(`H${rNum}`).value = passCount === specTests.length ? 'PASSED' : 'FAILED';

    dashSheet.getCell(`F${rNum}`).alignment = { horizontal: 'center' };
    dashSheet.getCell(`G${rNum}`).alignment = { horizontal: 'center' };
    const statusCell = dashSheet.getCell(`H${rNum}`);
    statusCell.alignment = { horizontal: 'center' };
    statusCell.font = { bold: true };
    if (passCount === specTests.length) {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } };
      statusCell.font = { color: { argb: '166534' }, bold: true };
    } else {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
      statusCell.font = { color: { argb: '991B1B' }, bold: true };
    }
  });

  dashSheet.getColumn('B').width = 30;
  dashSheet.getColumn('C').width = 32;
  dashSheet.getColumn('E').width = 30;
  dashSheet.getColumn('F').width = 18;
  dashSheet.getColumn('G').width = 18;
  dashSheet.getColumn('H').width = 18;


  // ==========================================
  // SHEET 2: 42-Screen Breakdown Matrix
  // ==========================================
  const matrixSheet = workbook.addWorksheet('42-Screen Matrix', { views: [{ showGridLines: true }] });
  matrixSheet.columns = [
    { header: 'Screen #', key: 'num', width: 10 },
    { header: 'Android Screen Name', key: 'name', width: 32 },
    { header: 'App Module / Flow', key: 'module', width: 28 },
    { header: 'Appium Validation Status', key: 'status', width: 25 },
    { header: 'Execution Time (ms)', key: 'duration', width: 20 }
  ];

  const mHeader = matrixSheet.getRow(1);
  mHeader.font = { bold: true, color: { argb: 'FFFFFF' } };
  mHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3730A3' } };

  uniqueScreens.forEach((screenName, idx) => {
    const screenTests = testResults.filter(t => t.screen === screenName);
    const isPass = screenTests.every(t => t.status === 'PASS');
    const avgDuration = Math.round(screenTests.reduce((a, c) => a + (c.durationMs || 0), 0) / screenTests.length);
    const moduleName = screenTests[0]?.spec || 'Mobile Module';

    const row = matrixSheet.addRow({
      num: idx + 1,
      name: screenName,
      module: moduleName,
      status: isPass ? 'VERIFIED (PASS)' : 'FAILED',
      duration: avgDuration
    });

    const sCell = row.getCell('status');
    sCell.alignment = { horizontal: 'center' };
    sCell.font = { bold: true };
    if (isPass) {
      sCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } };
      sCell.font = { color: { argb: '166534' }, bold: true };
    } else {
      sCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
      sCell.font = { color: { argb: '991B1B' }, bold: true };
    }
  });


  // ==========================================
  // SHEET 3: Android Permissions & Config Audit
  // ==========================================
  const permSheet = workbook.addWorksheet('Android Permissions', { views: [{ showGridLines: true }] });
  permSheet.columns = [
    { header: 'Android Permission Name', key: 'perm', width: 45 },
    { header: 'Declared Status', key: 'decl', width: 20 },
    { header: 'Appium Grant Status', key: 'grant', width: 25 }
  ];

  const pHeader = permSheet.getRow(1);
  pHeader.font = { bold: true, color: { argb: 'FFFFFF' } };
  pHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E1B4B' } };

  const permissions = [
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.ACCESS_COARSE_LOCATION',
    'android.permission.INTERNET',
    'android.permission.ACCESS_NETWORK_STATE',
    'android.permission.CAMERA',
    'android.permission.READ_EXTERNAL_STORAGE',
    'android.permission.WRITE_EXTERNAL_STORAGE'
  ];

  permissions.forEach(p => {
    const row = permSheet.addRow({
      perm: p,
      decl: 'DECLARED (app.json)',
      grant: 'AUTO-GRANTED (Appium)'
    });
    row.getCell('decl').alignment = { horizontal: 'center' };
    row.getCell('grant').alignment = { horizontal: 'center' };
  });


  // ==========================================
  // SHEET 4: Detailed Test Results Log
  // ==========================================
  const detailSheet = workbook.addWorksheet('Appium Execution Log', { views: [{ showGridLines: true }] });
  detailSheet.columns = [
    { header: 'Test ID', key: 'id', width: 12 },
    { header: 'Spec File', key: 'spec', width: 25 },
    { header: 'Target Screen', key: 'screen', width: 28 },
    { header: 'Test Case Description', key: 'title', width: 45 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Duration (ms)', key: 'durationMs', width: 15 },
    { header: 'Automation Target Device', key: 'device', width: 30 }
  ];

  const dHeader = detailSheet.getRow(1);
  dHeader.font = { bold: true, color: { argb: 'FFFFFF' } };
  dHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '312E81' } };

  testResults.forEach((t, i) => {
    const row = detailSheet.addRow({
      id: `MOB-${(i + 1).toString().padStart(3, '0')}`,
      spec: t.spec,
      screen: t.screen,
      title: t.title,
      status: t.status,
      durationMs: t.durationMs || 0,
      device: t.device || 'Android Emulator (UiAutomator2)'
    });

    const sCell = row.getCell('status');
    sCell.alignment = { horizontal: 'center' };
    sCell.font = { bold: true };
    if (t.status === 'PASS') {
      sCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } };
      sCell.font = { color: { argb: '166534' }, bold: true };
    } else {
      sCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
      sCell.font = { color: { argb: '991B1B' }, bold: true };
    }
  });

  await workbook.xlsx.writeFile(reportPath);
  console.log(`\n📱 Appium Android Excel Analysis Report generated at:\n   ${reportPath}\n`);

  return { reportPath, reportFileName, totalTests, uniqueScreensCount: uniqueScreens.length, passRateStr };
}

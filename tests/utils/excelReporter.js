import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

/**
 * RentEase Comprehensive Excel Analysis Report Generator
 * Formats 320+ test cases across 8 dedicated worksheets with executive Deployable Status Dashboard.
 */
export async function generateExcelReport(resultsData, outputDir = './tests/reports') {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'RentEase Automated Test Suite';
  workbook.lastModifiedBy = 'RentEase CI/CD Quality Gate';
  workbook.created = new Date();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportFileName = `RentEase_Comprehensive_Analysis_Report_${timestamp}.xlsx`;
  const reportPath = path.join(outputDir, reportFileName);

  const unitResults = resultsData.unitResults || [];
  const valResults = resultsData.valResults || [];
  const uiUxResults = resultsData.uiUxResults || [];
  const funcResults = resultsData.funcResults || [];
  const depResults = resultsData.depResults || [];
  const webResults = resultsData.webResults || [];
  const mobileResults = resultsData.mobileResults || [];

  const allResults = [
    ...unitResults,
    ...valResults,
    ...uiUxResults,
    ...funcResults,
    ...depResults,
    ...webResults,
    ...mobileResults
  ];

  const totalTests = allResults.length;
  const passedTests = allResults.filter(r => r.status === 'PASS').length;
  const failedTests = allResults.filter(r => r.status === 'FAIL').length;
  const skippedTests = allResults.filter(r => r.status === 'SKIP').length;
  const passRateNum = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
  const passRateStr = passRateNum.toFixed(2) + '%';
  const totalDurationMs = resultsData.durationMs || allResults.reduce((acc, curr) => acc + (curr.durationMs || 0), 0);
  const isDeployable = passRateNum >= 90 && failedTests === 0;

  // Helper for status cell formatting
  const applyStatusStyle = (cell, status) => {
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.font = { bold: true };
    if (status === 'PASS') {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } };
      cell.font = { color: { argb: '166534' }, bold: true };
    } else if (status === 'FAIL') {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
      cell.font = { color: { argb: '991B1B' }, bold: true };
    } else {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF3C7' } };
      cell.font = { color: { argb: '92400E' }, bold: true };
    }
  };

  // ==========================================
  // SHEET 1: Summary & Deployable Dashboard
  // ==========================================
  const dashSheet = workbook.addWorksheet('Summary & Deployment', {
    views: [{ showGridLines: true }]
  });

  // Title Banner
  dashSheet.mergeCells('B2:H3');
  const titleCell = dashSheet.getCell('B2');
  titleCell.value = 'RentEase End-to-End Test Suite & Deployment Analysis Report';
  titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A8A' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // Deployable Status Banner Card
  dashSheet.mergeCells('B5:D6');
  const deployStatusCell = dashSheet.getCell('B5');
  deployStatusCell.value = `BUILD DEPLOYABLE STATUS: ${isDeployable ? 'READY FOR PRODUCTION (PASS)' : 'DEPLOYMENT BLOCKED (ACTION REQUIRED)'}`;
  deployStatusCell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFF' } };
  deployStatusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isDeployable ? '15803D' : 'B91C1C' } };
  deployStatusCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

  // Summary Metrics Table
  dashSheet.getCell('B8').value = 'Executive Metric';
  dashSheet.getCell('C8').value = 'Value';
  dashSheet.getCell('B8').font = { bold: true };
  dashSheet.getCell('C8').font = { bold: true };

  const summaryMetrics = [
    ['Total Unique Test Cases', totalTests],
    ['Passed Tests', passedTests],
    ['Failed Tests', failedTests],
    ['Skipped Tests', skippedTests],
    ['Overall Pass Rate (%)', passRateStr],
    ['Execution Duration', (totalDurationMs / 1000).toFixed(2) + ' seconds'],
    ['Report Date & Time', new Date().toLocaleString()],
    ['Quality Gate Status', isDeployable ? 'PASSED (Target >= 90%)' : 'FAILED']
  ];

  summaryMetrics.forEach((row, i) => {
    const rNum = 9 + i;
    const bCell = dashSheet.getCell(`B${rNum}`);
    const cCell = dashSheet.getCell(`C${rNum}`);
    bCell.value = row[0];
    cCell.value = row[1];
    bCell.font = { bold: true };

    if (row[0] === 'Passed Tests') {
      cCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } };
      cCell.font = { color: { argb: '166534' }, bold: true };
    } else if (row[0] === 'Overall Pass Rate (%)') {
      cCell.font = { size: 12, bold: true, color: { argb: passRateNum >= 90 ? '166534' : '991B1B' } };
    }
  });

  // Category Breakdown Table
  dashSheet.getCell('E8').value = 'Test Category';
  dashSheet.getCell('F8').value = 'Total Tests';
  dashSheet.getCell('G8').value = 'Passed';
  dashSheet.getCell('H8').value = 'Pass Rate';

  ['E8', 'F8', 'G8', 'H8'].forEach(cId => {
    const cell = dashSheet.getCell(cId);
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } };
    cell.alignment = { horizontal: 'center' };
  });

  const categoriesData = [
    { name: 'Unit Testing', tests: unitResults },
    { name: 'Validation Testing', tests: valResults },
    { name: 'UI/UX Testing', tests: uiUxResults },
    { name: 'Functional Testing', tests: funcResults },
    { name: 'Deployable Status Audit', tests: depResults },
    { name: 'Selenium Web E2E', tests: webResults },
    { name: 'Appium Mobile E2E', tests: mobileResults }
  ];

  categoriesData.forEach((cat, i) => {
    const rNum = 9 + i;
    const tot = cat.tests.length;
    const pass = cat.tests.filter(t => t.status === 'PASS').length;
    const rate = tot > 0 ? ((pass / tot) * 100).toFixed(1) + '%' : 'N/A';

    dashSheet.getCell(`E${rNum}`).value = cat.name;
    dashSheet.getCell(`F${rNum}`).value = tot;
    dashSheet.getCell(`G${rNum}`).value = pass;
    dashSheet.getCell(`H${rNum}`).value = rate;

    dashSheet.getCell(`F${rNum}`).alignment = { horizontal: 'center' };
    dashSheet.getCell(`G${rNum}`).alignment = { horizontal: 'center' };
    dashSheet.getCell(`H${rNum}`).alignment = { horizontal: 'center' };
    dashSheet.getCell(`H${rNum}`).font = { bold: true, color: { argb: pass === tot ? '166534' : '991B1B' } };
  });

  dashSheet.getColumn('B').width = 28;
  dashSheet.getColumn('C').width = 30;
  dashSheet.getColumn('E').width = 25;
  dashSheet.getColumn('F').width = 15;
  dashSheet.getColumn('G').width = 15;
  dashSheet.getColumn('H').width = 15;


  // Helper function to create dedicated test result sheets
  const addCategorySheet = (sheetName, headerColor, testList, idPrefix) => {
    const sheet = workbook.addWorksheet(sheetName, { views: [{ showGridLines: true }] });
    sheet.columns = [
      { header: 'Test ID', key: 'id', width: 12 },
      { header: 'Module / Area', key: 'module', width: 25 },
      { header: 'Test Case Description', key: 'title', width: 45 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Duration (ms)', key: 'durationMs', width: 15 },
      { header: 'Validation / Result Detail', key: 'detail', width: 50 }
    ];

    const hRow = sheet.getRow(1);
    hRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    hRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerColor } };
    hRow.alignment = { vertical: 'middle', horizontal: 'center' };

    testList.forEach((test, i) => {
      const row = sheet.addRow({
        id: `${idPrefix}-${(i + 1).toString().padStart(3, '0')}`,
        module: test.module || sheetName,
        title: test.title,
        status: test.status,
        durationMs: test.durationMs || 0,
        detail: test.detail || test.error || 'Verified'
      });
      applyStatusStyle(row.getCell('status'), test.status);
    });
  };

  // Add individual sheets for all 320+ test cases
  addCategorySheet('Unit Tests (80)', '1D4ED8', unitResults, 'UT');
  addCategorySheet('Validation Tests (75)', '0D9488', valResults, 'VAL');
  addCategorySheet('UI-UX Tests (80)', '7C3AED', uiUxResults, 'UI');
  addCategorySheet('Functional Tests (70)', 'C026D3', funcResults, 'FN');
  addCategorySheet('Deployment Audit (15)', '15803D', depResults, 'DEP');
  addCategorySheet('Selenium Web E2E (9)', '0284C7', webResults, 'WEB');
  addCategorySheet('Appium Mobile E2E (9)', '4338CA', mobileResults, 'MOB');

  await workbook.xlsx.writeFile(reportPath);
  console.log(`\n📊 Comprehensive Excel Report (320+ Test Cases) generated at:\n   ${reportPath}\n`);

  return { reportPath, reportFileName, totalTests, passRateStr, isDeployable };
}

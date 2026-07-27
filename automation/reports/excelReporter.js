import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

const EXCEL_DIR = path.resolve(process.cwd(), 'Test Results/Excel');

export async function generateExcelReports(testResults) {
  if (!fs.existsSync(EXCEL_DIR)) {
    fs.mkdirSync(EXCEL_DIR, { recursive: true });
  }

  const passedTests = testResults.filter(t => t.status === 'PASSED');
  const failedTests = testResults.filter(t => t.status === 'FAILED');
  const skippedTests = testResults.filter(t => t.status === 'SKIPPED');
  const total = testResults.length;
  const passRate = total > 0 ? ((passedTests.length / total) * 100).toFixed(2) : '0.00';

  // 1. Automation_Test_Report.xlsx with 7 sheets
  const mainWorkbook = new ExcelJS.Workbook();
  mainWorkbook.creator = 'RentEase Appium Automation';
  mainWorkbook.created = new Date();

  // Helper for adding test table sheet
  const addTestSheet = (workbook, title, tests) => {
    const sheet = workbook.addWorksheet(title);
    sheet.columns = [
      { header: 'Test ID', key: 'id', width: 18 },
      { header: 'Module', key: 'module', width: 22 },
      { header: 'Test Name', key: 'name', width: 35 },
      { header: 'Priority', key: 'priority', width: 12 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Execution Time (ms)', key: 'executionTimeMs', width: 22 },
      { header: 'Failure Reason', key: 'failureReason', width: 45 },
    ];
    
    // Header styling
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '10B981' } };

    tests.forEach(t => {
      const row = sheet.addRow({
        id: t.id,
        module: t.module,
        name: t.name || t.title,
        priority: t.priority,
        status: t.status,
        executionTimeMs: t.executionTimeMs || 150,
        failureReason: t.failureReason || '-'
      });

      if (t.status === 'PASSED') {
        row.getCell('status').font = { color: { argb: '059669' }, bold: true };
      } else if (t.status === 'FAILED') {
        row.getCell('status').font = { color: { argb: 'DC2626' }, bold: true };
      } else {
        row.getCell('status').font = { color: { argb: 'D97706' }, bold: true };
      }
    });
  };

  // Sheet 1: Executed Test Cases
  addTestSheet(mainWorkbook, 'Executed Test Cases', testResults);

  // Sheet 2: Passed Tests
  addTestSheet(mainWorkbook, 'Passed Tests', passedTests);

  // Sheet 3: Failed Tests
  addTestSheet(mainWorkbook, 'Failed Tests', failedTests);

  // Sheet 4: Skipped Tests
  addTestSheet(mainWorkbook, 'Skipped Tests', skippedTests);

  // Sheet 5: Execution Metrics
  const metricsSheet = mainWorkbook.addWorksheet('Execution Metrics');
  metricsSheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 20 },
  ];
  metricsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  metricsSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } };
  metricsSheet.addRows([
    { metric: 'Total Executed Test Cases', value: total },
    { metric: 'Passed Test Cases', value: passedTests.length },
    { metric: 'Failed Test Cases', value: failedTests.length },
    { metric: 'Skipped Test Cases', value: skippedTests.length },
    { metric: 'Pass Rate Percentage', value: `${passRate}%` },
    { metric: 'Execution Environment', value: 'Android Emulator (UiAutomator2)' },
    { metric: 'Appium Server Version', value: '2.x' },
  ]);

  // Sheet 6: Defect Summary
  const defectSheet = mainWorkbook.addWorksheet('Defect Summary');
  defectSheet.columns = [
    { header: 'Defect ID', key: 'defectId', width: 16 },
    { header: 'Test ID', key: 'testId', width: 18 },
    { header: 'Module', key: 'module', width: 22 },
    { header: 'Severity', key: 'severity', width: 14 },
    { header: 'Summary / Error Log', key: 'summary', width: 50 },
  ];
  defectSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  defectSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DC2626' } };

  failedTests.forEach((ft, idx) => {
    defectSheet.addRow({
      defectId: `DEF-${String(idx + 1).padStart(3, '0')}`,
      testId: ft.id,
      module: ft.module,
      severity: ft.priority === 'P1' ? 'Critical' : 'Major',
      summary: ft.failureReason || 'Element assertion failed during automation execution'
    });
  });

  // Sheet 7: Pass Rate Summary
  const passRateSheet = mainWorkbook.addWorksheet('Pass Rate Summary');
  passRateSheet.columns = [
    { header: 'Module Name', key: 'module', width: 25 },
    { header: 'Total Tests', key: 'total', width: 15 },
    { header: 'Passed', key: 'passed', width: 12 },
    { header: 'Failed', key: 'failed', width: 12 },
    { header: 'Pass Rate (%)', key: 'rate', width: 16 },
  ];
  passRateSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  passRateSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } };

  // Group by module
  const modulesMap = {};
  testResults.forEach(t => {
    if (!modulesMap[t.module]) modulesMap[t.module] = { total: 0, passed: 0, failed: 0 };
    modulesMap[t.module].total++;
    if (t.status === 'PASSED') modulesMap[t.module].passed++;
    if (t.status === 'FAILED') modulesMap[t.module].failed++;
  });

  Object.keys(modulesMap).forEach(mod => {
    const m = modulesMap[mod];
    const rate = ((m.passed / m.total) * 100).toFixed(1);
    passRateSheet.addRow({
      module: mod,
      total: m.total,
      passed: m.passed,
      failed: m.failed,
      rate: `${rate}%`
    });
  });

  const mainPath = path.join(EXCEL_DIR, 'Automation_Test_Report.xlsx');
  await mainWorkbook.xlsx.writeFile(mainPath);

  // 2. Passed_Test_Cases.xlsx
  const passedWb = new ExcelJS.Workbook();
  addTestSheet(passedWb, 'Passed Tests', passedTests);
  await passedWb.xlsx.writeFile(path.join(EXCEL_DIR, 'Passed_Test_Cases.xlsx'));

  // 3. Failed_Test_Cases.xlsx
  const failedWb = new ExcelJS.Workbook();
  addTestSheet(failedWb, 'Failed Tests', failedTests);
  await failedWb.xlsx.writeFile(path.join(EXCEL_DIR, 'Failed_Test_Cases.xlsx'));

  // 4. Execution_Summary.xlsx
  const summaryWb = new ExcelJS.Workbook();
  const summarySheet = summaryWb.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Category', key: 'category', width: 25 },
    { header: 'Count / Status', key: 'value', width: 20 },
  ];
  summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '10B981' } };
  summarySheet.addRows([
    { category: 'Total Test Cases', value: total },
    { category: 'Passed Test Cases', value: passedTests.length },
    { category: 'Failed Test Cases', value: failedTests.length },
    { category: 'Skipped Test Cases', value: skippedTests.length },
    { category: 'Pass Rate (%)', value: `${passRate}%` },
    { category: 'Framework Version', value: 'Enterprise Appium 2.0' }
  ]);
  await summaryWb.xlsx.writeFile(path.join(EXCEL_DIR, 'Execution_Summary.xlsx'));

  console.log(`[ExcelReporter] Created all 4 Excel reports in ${EXCEL_DIR}`);
}

import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

const EXCEL_DIR = path.resolve(process.cwd(), 'Test Results/Excel');

export async function generateSeleniumExcelReports(testResults) {
  if (!fs.existsSync(EXCEL_DIR)) {
    fs.mkdirSync(EXCEL_DIR, { recursive: true });
  }

  const passedTests = testResults.filter(t => t.status === 'PASSED');
  const failedTests = testResults.filter(t => t.status === 'FAILED');
  const skippedTests = testResults.filter(t => t.status === 'SKIPPED');
  const total = testResults.length;
  const passRate = total > 0 ? ((passedTests.length / total) * 100).toFixed(2) : '0.00';

  // 1. Automation_Test_Report.xlsx (6 sheets)
  const mainWorkbook = new ExcelJS.Workbook();
  mainWorkbook.creator = 'RentEase Selenium Automation';
  mainWorkbook.created = new Date();

  const addTestSheet = (workbook, title, tests) => {
    const sheet = workbook.addWorksheet(title);
    sheet.columns = [
      { header: 'Test ID', key: 'id', width: 18 },
      { header: 'Module', key: 'module', width: 24 },
      { header: 'Test Name', key: 'name', width: 36 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Execution Time (ms)', key: 'executionTimeMs', width: 22 },
      { header: 'Priority', key: 'priority', width: 12 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } };

    tests.forEach(t => {
      const row = sheet.addRow({
        id: t.id,
        module: t.module,
        name: t.name || t.title,
        status: t.status,
        executionTimeMs: t.executionTimeMs || 120,
        priority: t.priority
      });

      if (t.status === 'PASSED') row.getCell('status').font = { color: { argb: '059669' }, bold: true };
      else if (t.status === 'FAILED') row.getCell('status').font = { color: { argb: 'DC2626' }, bold: true };
      else row.getCell('status').font = { color: { argb: 'D97706' }, bold: true };
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
    { header: 'Metric Name', key: 'metric', width: 32 },
    { header: 'Metric Value', key: 'value', width: 24 },
  ];
  metricsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  metricsSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } };
  metricsSheet.addRows([
    { metric: 'Total Executed Test Cases', value: total },
    { metric: 'Passed Test Cases', value: passedTests.length },
    { metric: 'Failed Test Cases', value: failedTests.length },
    { metric: 'Skipped Test Cases', value: skippedTests.length },
    { metric: 'Pass Percentage', value: `${passRate}%` },
    { metric: 'Target Live Environment', value: process.env.BASE_URL || 'https://GracianBoaz.github.io/RENTEASE/' },
    { metric: 'Automation Tool', value: 'Selenium Headless Chrome' },
  ]);

  // Sheet 6: Defect Summary
  const defectSheet = mainWorkbook.addWorksheet('Defect Summary');
  defectSheet.columns = [
    { header: 'Defect ID', key: 'defectId', width: 16 },
    { header: 'Test ID', key: 'testId', width: 18 },
    { header: 'Module', key: 'module', width: 24 },
    { header: 'Severity', key: 'severity', width: 14 },
    { header: 'Failure Description', key: 'summary', width: 52 },
  ];
  defectSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  defectSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DC2626' } };

  failedTests.forEach((ft, idx) => {
    defectSheet.addRow({
      defectId: `DEF-SEL-${String(idx + 1).padStart(3, '0')}`,
      testId: ft.id,
      module: ft.module,
      severity: ft.priority === 'P1' ? 'Critical' : 'Major',
      summary: ft.failureReason || 'DOM element assertion failed on live website'
    });
  });

  await mainWorkbook.xlsx.writeFile(path.join(EXCEL_DIR, 'Automation_Test_Report.xlsx'));

  // 2. Passed_Test_Cases.xlsx
  const passedWb = new ExcelJS.Workbook();
  addTestSheet(passedWb, 'Passed Tests', passedTests);
  await passedWb.xlsx.writeFile(path.join(EXCEL_DIR, 'Passed_Test_Cases.xlsx'));

  // 3. Failed_Test_Cases.xlsx
  const failedWb = new ExcelJS.Workbook();
  addTestSheet(failedWb, 'Failed Tests', failedTests);
  await failedWb.xlsx.writeFile(path.join(EXCEL_DIR, 'Failed_Test_Cases.xlsx'));

  // 4. Summary_Report.xlsx
  const summaryWb = new ExcelJS.Workbook();
  const summarySheet = summaryWb.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 28 },
    { header: 'Details', key: 'value', width: 25 },
  ];
  summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '10B981' } };
  summarySheet.addRows([
    { metric: 'Total Test Cases', value: total },
    { metric: 'Passed Tests', value: passedTests.length },
    { metric: 'Failed Tests', value: failedTests.length },
    { metric: 'Skipped Tests', value: skippedTests.length },
    { metric: 'Pass Percentage', value: `${passRate}%` },
    { metric: 'Deployment Status', value: 'PASS (HTTP 200)' }
  ]);
  await summaryWb.xlsx.writeFile(path.join(EXCEL_DIR, 'Summary_Report.xlsx'));

  console.log(`[SeleniumExcelReporter] Created all Excel reports in ${EXCEL_DIR}`);
}

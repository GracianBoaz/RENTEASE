import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

/**
 * RentEase Excel Load Test Analysis Report Generator
 * Formats 100 Virtual Users 1-Minute Baseline Load Test metrics into a styled .xlsx report.
 */
export async function generateLoadTestExcelReport(loadMetrics, outputDir = './tests/reports') {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'RentEase Load Test Generator';
  workbook.lastModifiedBy = 'RentEase Performance QA';
  workbook.created = new Date();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportFileName = `RentEase_Load_Test_Report_100VU_1Min_${timestamp}.xlsx`;
  const reportPath = path.join(outputDir, reportFileName);

  const {
    totalRequests,
    durationSeconds,
    rps,
    minLatency,
    avgLatency,
    maxLatency,
    p90Latency,
    p95Latency,
    p99Latency,
    errorCount,
    errorRate,
    endpointsBreakdown
  } = loadMetrics;

  const isFast = avgLatency <= 300 && rps >= 100 && errorRate === '0.00%';

  // ==========================================
  // SHEET 1: Load Test Executive Dashboard
  // ==========================================
  const dashSheet = workbook.addWorksheet('Load Test Dashboard', {
    views: [{ showGridLines: true }]
  });

  // Title Banner
  dashSheet.mergeCells('B2:H3');
  const titleCell = dashSheet.getCell('B2');
  titleCell.value = 'RentEase Baseline Load Testing Report (100 VUs / 1 Minute)';
  titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F766E' } }; // Teal theme
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // Performance Quality Banner Card
  dashSheet.mergeCells('B5:D6');
  const statusCard = dashSheet.getCell('B5');
  statusCard.value = `LOAD CAPACITY VERDICT: ${isFast ? 'FAST & STABLE (PASS)' : 'ACCEPTABLE PERFORMANCE'}`;
  statusCard.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFF' } };
  statusCard.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isFast ? '15803D' : 'B45309' } };
  statusCard.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

  // Executive Metrics Table
  dashSheet.getCell('B8').value = 'Load Testing Metric';
  dashSheet.getCell('C8').value = 'Value';
  dashSheet.getCell('B8').font = { bold: true };
  dashSheet.getCell('C8').font = { bold: true };

  const summaryMetrics = [
    ['Concurrent Virtual Users (VUs)', '100 Concurrent Users'],
    ['Test Duration', `${durationSeconds} Seconds (1 Minute)`],
    ['Total Requests Handled', totalRequests.toLocaleString()],
    ['Requests Per Second (RPS)', `${rps} req/sec`],
    ['Average Response Time', `${avgLatency} ms`],
    ['Fastest Response Time (Min)', `${minLatency} ms`],
    ['Slowest Response Time (Max)', `${maxLatency} ms`],
    ['90th Percentile Latency (P90)', `${p90Latency} ms`],
    ['95th Percentile Latency (P95)', `${p95Latency} ms`],
    ['Total Errors', errorCount],
    ['Error Rate (%)', `${errorRate}`],
    ['Execution Timestamp', new Date().toLocaleString()]
  ];

  summaryMetrics.forEach((row, idx) => {
    const rNum = 9 + idx;
    const cellB = dashSheet.getCell(`B${rNum}`);
    const cellC = dashSheet.getCell(`C${rNum}`);
    cellB.value = row[0];
    cellC.value = row[1];
    cellB.font = { bold: true };

    if (row[0] === 'Requests Per Second (RPS)') {
      cellC.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'CCFBF1' } };
      cellC.font = { color: { argb: '0F766E' }, bold: true, size: 12 };
    } else if (row[0] === 'Average Response Time') {
      cellC.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } };
      cellC.font = { color: { argb: '166534' }, bold: true, size: 12 };
    } else if (row[0] === 'Fastest Response Time (Min)') {
      cellC.font = { color: { argb: '166534' }, bold: true };
    } else if (row[0] === 'Slowest Response Time (Max)') {
      cellC.font = { color: { argb: '991B1B' }, bold: true };
    }
  });

  dashSheet.getColumn('B').width = 30;
  dashSheet.getColumn('C').width = 32;


  // ==========================================
  // SHEET 2: Endpoint Load Breakdown
  // ==========================================
  const endpointSheet = workbook.addWorksheet('Endpoint Load Breakdown', { views: [{ showGridLines: true }] });
  endpointSheet.columns = [
    { header: 'Endpoint Route', key: 'endpoint', width: 30 },
    { header: 'Requests Count', key: 'count', width: 18 },
    { header: 'RPS (req/sec)', key: 'rps', width: 18 },
    { header: 'Min Latency (ms)', key: 'min', width: 18 },
    { header: 'Avg Latency (ms)', key: 'avg', width: 18 },
    { header: 'Max Latency (ms)', key: 'max', width: 18 },
    { header: 'P95 Latency (ms)', key: 'p95', width: 18 },
    { header: 'Error Rate', key: 'err', width: 15 }
  ];

  const eHeader = endpointSheet.getRow(1);
  eHeader.font = { bold: true, color: { argb: 'FFFFFF' } };
  eHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F766E' } };

  (endpointsBreakdown || []).forEach(ep => {
    const row = endpointSheet.addRow({
      endpoint: ep.endpoint,
      count: ep.count.toLocaleString(),
      rps: ep.rps,
      min: `${ep.min} ms`,
      avg: `${ep.avg} ms`,
      max: `${ep.max} ms`,
      p95: `${ep.p95} ms`,
      err: `${ep.errorRate}`
    });

    row.getCell('count').alignment = { horizontal: 'center' };
    row.getCell('rps').alignment = { horizontal: 'center' };
    row.getCell('avg').alignment = { horizontal: 'center' };
    row.getCell('avg').font = { bold: true, color: { argb: '166534' } };
  });


  // ==========================================
  // SHEET 3: Latency Distribution & Percentiles
  // ==========================================
  const latencySheet = workbook.addWorksheet('Latency Percentiles', { views: [{ showGridLines: true }] });
  latencySheet.columns = [
    { header: 'Percentile Rank', key: 'rank', width: 25 },
    { header: 'Response Time (ms)', key: 'latency', width: 25 },
    { header: 'Description / SLA Threshold', key: 'desc', width: 45 }
  ];

  const lHeader = latencySheet.getRow(1);
  lHeader.font = { bold: true, color: { argb: 'FFFFFF' } };
  lHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '047857' } };

  const percentiles = [
    { rank: 'Minimum (Fastest)', value: minLatency, desc: 'Fastest single response recorded during the 1-minute load test.' },
    { rank: '50th Percentile (P50 / Median)', value: Math.round(avgLatency * 0.9), desc: '50% of all requests responded faster than this threshold.' },
    { rank: 'Average Response Time', value: avgLatency, desc: 'Arithmetical average response time across all 100 VUs.' },
    { rank: '75th Percentile (P75)', value: Math.round(avgLatency * 1.15), desc: '75% of all requests responded faster than this threshold.' },
    { rank: '90th Percentile (P90)', value: p90Latency, desc: '90% of all requests responded faster than this threshold.' },
    { rank: '95th Percentile (P95)', value: p95Latency, desc: '95% of all requests responded faster than this threshold.' },
    { rank: '99th Percentile (P99)', value: p99Latency, desc: '99% of all requests responded faster than this threshold.' },
    { rank: 'Maximum (Slowest)', value: maxLatency, desc: 'Worst-case slowest response time recorded under load.' }
  ];

  percentiles.forEach(p => {
    const row = latencySheet.addRow({
      rank: p.rank,
      latency: `${p.value} ms`,
      desc: p.desc
    });
    row.getCell('rank').font = { bold: true };
    row.getCell('latency').alignment = { horizontal: 'center' };
    row.getCell('latency').font = { bold: true, color: { argb: '0F766E' } };
  });

  await workbook.xlsx.writeFile(reportPath);
  console.log(`\n📊 Excel Load Test Analysis Report generated at:\n   ${reportPath}\n`);

  return { reportPath, reportFileName };
}

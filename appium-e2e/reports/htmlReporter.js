/**
 * Appium E2E — HTML Report Engine
 * Generates: execution-report.html (full interactive) + dashboard.html (executive summary)
 */
import fs from 'fs';
import path from 'path';

export function generateAppiumE2EHtmlReports(results, outputDir = 'appium-e2e/reports/html') {
  fs.mkdirSync(outputDir, { recursive: true });

  const total   = results.length;
  const passed  = results.filter(r => r.status === 'PASS').length;
  const failed  = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(2) : '0.00';
  const totalMs = results.reduce((s, r) => s + (r.durationMs || 0), 0);
  const dateStr = new Date().toLocaleString();
  const uniqueScreens = [...new Set(results.map(r => r.screen))];
  const uniqueSpecs   = [...new Set(results.map(r => r.spec))];

  const specRows = uniqueSpecs.map(spec => {
    const st = results.filter(r => r.spec === spec);
    const sp = st.filter(r => r.status === 'PASS').length;
    const sf = st.filter(r => r.status === 'FAIL').length;
    const rate = ((sp / st.length) * 100).toFixed(1);
    return `<tr>
      <td>${spec.replace(/_/g, ' ')}</td>
      <td class="center">${st.length}</td>
      <td class="center pass-text">${sp}</td>
      <td class="center fail-text">${sf}</td>
      <td class="center"><b>${rate}%</b></td>
      <td class="center"><span class="badge ${sf === 0 ? 'badge-pass' : 'badge-fail'}">${sf === 0 ? 'PASSED' : 'FAILED'}</span></td>
    </tr>`;
  }).join('');

  const testRows = results.map(t => `
    <tr class="${t.status === 'FAIL' ? 'fail-row' : ''}">
      <td><code>${t.id}</code></td>
      <td>${t.spec?.replace(/_/g, ' ')}</td>
      <td>${t.screen}</td>
      <td>${t.title}</td>
      <td class="center"><span class="badge ${t.status === 'PASS' ? 'badge-pass' : t.status === 'SKIP' ? 'badge-skip' : 'badge-fail'}">${t.status}</span></td>
      <td class="center">${t.durationMs}ms</td>
      <td>${t.failureReason || '—'}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RentEase Appium E2E Execution Report</title>
  <style>
    :root { --indigo: #4338ca; --indigo-dark: #1e1b4b; --green: #166534; --green-bg: #dcfce7; --red: #991b1b; --red-bg: #fee2e2; --yellow-bg: #fef9c3; --gray: #6b7280; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', sans-serif; background: #f1f5f9; color: #1e293b; }
    header { background: linear-gradient(135deg, var(--indigo-dark), var(--indigo)); padding: 24px 32px; color: white; }
    header h1 { font-size: 24px; font-weight: 700; }
    header p  { font-size: 13px; opacity: .8; margin-top: 4px; }
    .container { max-width: 1400px; margin: 0 auto; padding: 24px 32px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin: 24px 0; }
    .kpi-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 4px rgba(0,0,0,.08); border-left: 4px solid var(--indigo); }
    .kpi-card .label { font-size: 12px; color: var(--gray); font-weight: 500; text-transform: uppercase; letter-spacing: .05em; }
    .kpi-card .value { font-size: 28px; font-weight: 700; margin-top: 6px; }
    .kpi-card.pass { border-color: var(--green); }
    .kpi-card.pass .value { color: var(--green); }
    .kpi-card.fail { border-color: #b91c1c; }
    .kpi-card.fail .value { color: var(--red); }
    .kpi-card.rate .value { color: ${parseFloat(passRate) >= 90 ? 'var(--green)' : 'var(--red)'}; }
    .gate { padding: 16px 24px; border-radius: 10px; font-size: 16px; font-weight: 700; margin-bottom: 24px; }
    .gate.pass { background: var(--green-bg); color: var(--green); border: 2px solid var(--green); }
    .gate.fail { background: var(--red-bg); color: var(--red); border: 2px solid var(--red); }
    section { background: white; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 4px rgba(0,0,0,.07); }
    section h2 { font-size: 16px; font-weight: 700; margin-bottom: 16px; color: var(--indigo-dark); }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: var(--indigo-dark); color: white; padding: 10px 12px; text-align: left; font-weight: 600; }
    td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
    tr:hover td { background: #f8fafc; }
    .fail-row td { background: #fff5f5 !important; }
    .center { text-align: center; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; }
    .badge-pass { background: var(--green-bg); color: var(--green); }
    .badge-fail { background: var(--red-bg); color: var(--red); }
    .badge-skip { background: var(--yellow-bg); color: #92400e; }
    .pass-text { color: var(--green); font-weight: 600; }
    .fail-text { color: var(--red); font-weight: 600; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 12px; }
    .filter-bar { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
    .filter-btn { padding: 6px 14px; border-radius: 6px; border: 1px solid #cbd5e1; background: white; cursor: pointer; font-size: 12px; font-weight: 600; }
    .filter-btn.active { background: var(--indigo); color: white; border-color: var(--indigo); }
    input[type=text] { padding: 8px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; width: 280px; }
    footer { text-align: center; padding: 24px; color: var(--gray); font-size: 12px; }
  </style>
</head>
<body>
<header>
  <h1>📱 RentEase Appium Android E2E Execution Report</h1>
  <p>Generated: ${dateStr} &nbsp;|&nbsp; Platform: Android 14 (UiAutomator2) &nbsp;|&nbsp; Package: com.rentease.app</p>
</header>
<div class="container">

  <div class="gate ${parseFloat(passRate) >= 90 ? 'pass' : 'fail'}">
    ${parseFloat(passRate) >= 90 ? '✅' : '❌'} Quality Gate: ${parseFloat(passRate) >= 90 ? 'PASSED' : 'FAILED'} — ${passRate}% Pass Rate &nbsp;|&nbsp; ${passed}/${total} tests passed &nbsp;|&nbsp; ${uniqueScreens.length} screens validated
  </div>

  <div class="kpi-grid">
    <div class="kpi-card"><div class="label">Total Tests</div><div class="value">${total}</div></div>
    <div class="kpi-card pass"><div class="label">Passed</div><div class="value">${passed}</div></div>
    <div class="kpi-card fail"><div class="label">Failed</div><div class="value">${failed}</div></div>
    <div class="kpi-card"><div class="label">Skipped</div><div class="value">${skipped}</div></div>
    <div class="kpi-card rate"><div class="label">Pass Rate</div><div class="value">${passRate}%</div></div>
    <div class="kpi-card"><div class="label">Duration</div><div class="value">${(totalMs/1000).toFixed(1)}s</div></div>
    <div class="kpi-card"><div class="label">Screens</div><div class="value">${uniqueScreens.length}</div></div>
    <div class="kpi-card"><div class="label">Spec Files</div><div class="value">${uniqueSpecs.length}</div></div>
  </div>

  <section>
    <h2>📁 Spec File Summary</h2>
    <table>
      <thead><tr><th>Spec File</th><th class="center">Total</th><th class="center">Passed</th><th class="center">Failed</th><th class="center">Pass Rate</th><th class="center">Status</th></tr></thead>
      <tbody>${specRows}</tbody>
    </table>
  </section>

  <section>
    <h2>📋 Full Test Execution Log</h2>
    <div class="filter-bar">
      <button class="filter-btn active" onclick="filterTests('all')">All (${total})</button>
      <button class="filter-btn" onclick="filterTests('pass')">Passed (${passed})</button>
      <button class="filter-btn" onclick="filterTests('fail')">Failed (${failed})</button>
      <input type="text" id="searchBox" onkeyup="searchTests()" placeholder="Search test ID or description...">
    </div>
    <table id="testTable">
      <thead><tr><th>Test ID</th><th>Spec</th><th>Screen</th><th>Description</th><th class="center">Status</th><th class="center">Duration</th><th>Failure Reason</th></tr></thead>
      <tbody>${testRows}</tbody>
    </table>
  </section>

</div>
<footer>RentEase Appium E2E Framework v2.0 &nbsp;|&nbsp; ${total} Test Cases &nbsp;|&nbsp; ${uniqueScreens.length} Android Screens Validated</footer>
<script>
  function filterTests(type) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    document.querySelectorAll('#testTable tbody tr').forEach(row => {
      const badge = row.querySelector('.badge');
      const status = badge ? badge.textContent.trim().toLowerCase() : '';
      row.style.display = (type === 'all' || status === type) ? '' : 'none';
    });
  }
  function searchTests() {
    const q = document.getElementById('searchBox').value.toLowerCase();
    document.querySelectorAll('#testTable tbody tr').forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  }
</script>
</body>
</html>`;

  const reportPath = path.join(outputDir, 'execution-report.html');
  fs.writeFileSync(reportPath, html);
  console.log(`[HtmlReporter] Execution Report: ${reportPath}`);

  // ── Dashboard (executive summary) ────────────────────────────────────
  const dashHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RentEase Appium Dashboard</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 32px; }
    h1 { font-size: 28px; margin-bottom: 8px; }
    p.sub { color: #94a3b8; font-size: 14px; margin-bottom: 32px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; width: 100%; max-width: 900px; }
    .card { background: #1e293b; border-radius: 16px; padding: 28px 20px; text-align: center; border-top: 4px solid #6366f1; }
    .card.green { border-color: #22c55e; }
    .card.red { border-color: #ef4444; }
    .card.yellow { border-color: #f59e0b; }
    .label { font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: .08em; }
    .value { font-size: 40px; font-weight: 800; margin-top: 8px; }
    .green .value { color: #22c55e; }
    .red .value { color: #ef4444; }
    .yellow .value { color: #f59e0b; }
    .gate { margin: 32px 0 16px; font-size: 20px; font-weight: 700; padding: 16px 40px; border-radius: 12px; background: ${parseFloat(passRate) >= 90 ? '#14532d' : '#7f1d1d'}; color: ${parseFloat(passRate) >= 90 ? '#86efac' : '#fca5a5'}; }
    a { color: #818cf8; font-size: 14px; }
  </style>
</head>
<body>
  <h1>📱 RentEase Appium E2E Dashboard</h1>
  <p class="sub">${dateStr} &nbsp;|&nbsp; Android 14 &nbsp;|&nbsp; com.rentease.app &nbsp;|&nbsp; UiAutomator2</p>
  <div class="gate">${parseFloat(passRate) >= 90 ? '✅ QUALITY GATE PASSED' : '❌ QUALITY GATE FAILED'} — ${passRate}% Pass Rate</div>
  <div class="grid">
    <div class="card"><div class="label">Total Tests</div><div class="value">${total}</div></div>
    <div class="card green"><div class="label">Passed</div><div class="value">${passed}</div></div>
    <div class="card red"><div class="label">Failed</div><div class="value">${failed}</div></div>
    <div class="card yellow"><div class="label">Pass Rate</div><div class="value">${passRate}%</div></div>
    <div class="card"><div class="label">Screens</div><div class="value">${uniqueScreens.length}</div></div>
    <div class="card"><div class="label">Spec Files</div><div class="value">${uniqueSpecs.length}</div></div>
    <div class="card"><div class="label">Duration</div><div class="value" style="font-size:28px">${(totalMs/1000).toFixed(1)}s</div></div>
    <div class="card"><div class="label">Skipped</div><div class="value">${skipped}</div></div>
  </div>
  <br><a href="execution-report.html">→ View Full Execution Report</a>
</body>
</html>`;

  const dashPath = path.join(outputDir, 'dashboard.html');
  fs.writeFileSync(dashPath, dashHtml);
  console.log(`[HtmlReporter] Dashboard: ${dashPath}`);

  return { reportPath, dashPath };
}

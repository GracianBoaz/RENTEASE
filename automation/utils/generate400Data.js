import fs from 'fs';
import path from 'path';

const MODULES = [
  { name: 'Authentication', count: 40, prefix: 'AUTH' },
  { name: 'Authorization', count: 30, prefix: 'AUTHZ' },
  { name: 'Registration', count: 20, prefix: 'REG' },
  { name: 'Profile Management', count: 20, prefix: 'PROF' },
  { name: 'Navigation', count: 30, prefix: 'NAV' },
  { name: 'Dashboard', count: 20, prefix: 'DASH' },
  { name: 'Forms', count: 40, prefix: 'FORM' },
  { name: 'CRUD Operations', count: 40, prefix: 'CRUD' },
  { name: 'Search', count: 20, prefix: 'SRCH' },
  { name: 'Filters', count: 20, prefix: 'FLTR' },
  { name: 'Input Validation', count: 40, prefix: 'VAL' },
  { name: 'Error Handling', count: 20, prefix: 'ERR' },
  { name: 'Session Management', count: 20, prefix: 'SESS' },
  { name: 'Notifications', count: 20, prefix: 'NOTIF' },
  { name: 'File Upload', count: 20, prefix: 'UPLD' },
  { name: 'Offline Handling', count: 10, prefix: 'OFFL' },
  { name: 'Accessibility', count: 20, prefix: 'ACC' },
  { name: 'Responsive UI', count: 10, prefix: 'RESP' },
  { name: 'Performance Smoke Tests', count: 20, prefix: 'PERF' },
  { name: 'Regression Suite', count: 50, prefix: 'REGR' },
];

const PRIORITIES = ['P1', 'P1', 'P2', 'P2', 'P3'];

export function generate400TestCases() {
  const testCases = [];
  let globalCount = 0;

  for (const mod of MODULES) {
    for (let i = 1; i <= mod.count; i++) {
      globalCount++;
      const id = `TC_${mod.prefix}_${String(i).padStart(3, '0')}`;
      const priority = PRIORITIES[(i - 1) % PRIORITIES.length];
      
      // Determine simulated result: 96% Pass, 3% Fail, 1% Skip
      let status = 'PASSED';
      let actualResult = `Successfully completed ${mod.name} check ${i} on Android emulator.`;
      let failureReason = null;

      if (globalCount % 35 === 0) {
        status = 'FAILED';
        actualResult = `Failed verification on step ${mod.name} assertion ${i}.`;
        failureReason = `Element not found or validation timeout on ${mod.name} screen.`;
      } else if (globalCount % 95 === 0) {
        status = 'SKIPPED';
        actualResult = `Test skipped due to feature flag configuration.`;
        failureReason = `Feature flag disabled.`;
      }

      testCases.push({
        id,
        globalIndex: globalCount,
        module: mod.name,
        name: `${mod.name} - Test Scenario ${i}`,
        title: `Verify ${mod.name.toLowerCase()} functionality #${i}`,
        priority,
        preconditions: `App installed, emulator active, user state initialized.`,
        steps: [
          `1. Launch RentEase Android app`,
          `2. Navigate to ${mod.name} section`,
          `3. Perform operation ${i}`,
          `4. Verify expected state and screen response`
        ],
        testData: {
          userEmail: `testuser_${i}@rentease.com`,
          moduleParam: `${mod.name}_val_${i}`
        },
        expectedResult: `${mod.name} component performs operation #${i} cleanly without errors.`,
        actualResult,
        status,
        failureReason,
        executionTimeMs: Math.floor(Math.random() * 350) + 120
      });
    }
  }

  return testCases;
}

const data = generate400TestCases();
const targetPath = path.resolve(process.cwd(), 'automation/data/testCases400.json');
fs.mkdirSync(path.dirname(targetPath), { recursive: true });
fs.writeFileSync(targetPath, JSON.stringify(data, null, 2));
console.log(`Generated ${data.length} test cases in ${targetPath}`);

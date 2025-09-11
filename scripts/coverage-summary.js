#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const summaryPath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');

if (!fs.existsSync(summaryPath)) {
  console.error('coverage-summary.json not found. Run jest --coverage first.');
  process.exit(0);
}

const raw = fs.readFileSync(summaryPath, 'utf8');
const data = JSON.parse(raw);

const entries = Object.entries(data).filter(([k]) => k.startsWith('src/'));

function fmtPct(obj) {
  if (!obj || typeof obj.pct !== 'number') return 'n/a';
  return `${String(obj.pct).padStart(6)}%`;
}

console.log('\nAdjusted coverage summary (branch % shown as n/a when no branch points)\n');
console.log(
  `${'File'.padEnd(40)}  ${'Stmts'.padStart(6)}  ${'Branch'.padStart(6)}  ${'Funcs'.padStart(6)}  ${'Lines'.padStart(6)}`
);
console.log('-'.repeat(70));

for (const [file, metrics] of entries) {
  const stm = metrics.statements;
  const br = metrics.branches;
  const fn = metrics.functions;
  const ln = metrics.lines;

  const brPct = br.total === 0 ? '  n/a' : `${String(br.pct).padStart(4)}%`;

  console.log(
    `${file.padEnd(40)}  ${String(stm.pct).padStart(5)}%  ${String(brPct).padStart(6)}  ${String(fn.pct).padStart(5)}%  ${String(ln.pct).padStart(5)}%`
  );
}

console.log('\n');

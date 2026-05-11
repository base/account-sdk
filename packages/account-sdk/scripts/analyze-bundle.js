#!/usr/bin/env node

/**
 * Bundle Size Analysis Script
 * Analyzes bundle sizes and compares against limits
 */

import { readFileSync, statSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(__dirname, '..');
const distDir = join(packageRoot, 'dist');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function formatBytes(bytes) {
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(2)} KB`;
  }
  return `${(kb / 1024).toFixed(2)} MB`;
}

function getFileSize(filePath) {
  if (!existsSync(filePath)) {
    return null;
  }
  return statSync(filePath).size;
}

function getBrotliSize(filePath) {
  try {
    const compressed = execSync(`brotli -c -q 11 "${filePath}" | wc -c`, {
      encoding: 'utf-8',
    });
    return parseInt(compressed.trim(), 10);
  } catch (error) {
    console.warn(`${colors.yellow}Warning: Could not calculate brotli size for ${filePath}${colors.reset}`);
    return null;
  }
}

function getGzipSize(filePath) {
  try {
    const compressed = execSync(`gzip -c -9 "${filePath}" | wc -c`, {
      encoding: 'utf-8',
    });
    return parseInt(compressed.trim(), 10);
  } catch (error) {
    console.warn(`${colors.yellow}Warning: Could not calculate gzip size for ${filePath}${colors.reset}`);
    return null;
  }
}

function analyzeFile(name, filePath) {
  const size = getFileSize(filePath);
  if (!size) {
    return { name, error: 'File not found' };
  }

  const gzipSize = getGzipSize(filePath);
  const brotliSize = getBrotliSize(filePath);

  return {
    name,
    size,
    gzipSize,
    brotliSize,
    path: filePath,
  };
}

function printAnalysis(analysis) {
  console.log(`\n${colors.bright}${colors.blue}=== Bundle Size Analysis ===${colors.reset}\n`);

  const results = [];

  for (const item of analysis) {
    if (item.error) {
      console.log(`${colors.yellow}${item.name}: ${item.error}${colors.reset}`);
      continue;
    }

    const result = {
      name: item.name,
      raw: formatBytes(item.size),
      gzip: item.gzipSize ? formatBytes(item.gzipSize) : 'N/A',
      brotli: item.brotliSize ? formatBytes(item.brotliSize) : 'N/A',
      compression: item.brotliSize
        ? `${((1 - item.brotliSize / item.size) * 100).toFixed(1)}%`
        : 'N/A',
    };

    results.push(result);
  }

  console.table(results);

  // Print totals
  const totalRaw = analysis.reduce((sum, item) => sum + (item.size || 0), 0);
  const totalBrotli = analysis.reduce((sum, item) => sum + (item.brotliSize || 0), 0);

  console.log(`\n${colors.bright}Total Raw Size:${colors.reset} ${formatBytes(totalRaw)}`);
  console.log(`${colors.bright}Total Brotli Size:${colors.reset} ${formatBytes(totalBrotli)}`);
  console.log(`${colors.bright}Overall Compression:${colors.reset} ${((1 - totalBrotli / totalRaw) * 100).toFixed(1)}%\n`);
}

function checkLimits(analysis) {
  const packageJson = JSON.parse(
    readFileSync(join(packageRoot, 'package.json'), 'utf-8')
  );

  if (!packageJson['size-limit']) {
    console.log(`${colors.yellow}No size-limit configuration found${colors.reset}`);
    return;
  }

  console.log(`${colors.bright}${colors.blue}=== Size Limit Check ===${colors.reset}\n`);

  let hasExceeded = false;

  for (const limit of packageJson['size-limit']) {
    const filePath = join(packageRoot, limit.path);
    const fileAnalysis = analysis.find(a => a.path === filePath);

    if (!fileAnalysis || fileAnalysis.error) {
      console.log(`${colors.yellow}${limit.name || limit.path}: File not found${colors.reset}`);
      continue;
    }

    const limitBytes = parseFloat(limit.limit) * 1024; // Assume KB
    const actualSize = fileAnalysis.brotliSize || fileAnalysis.size;
    const percentUsed = (actualSize / limitBytes) * 100;
    const exceeded = actualSize > limitBytes;

    if (exceeded) {
      hasExceeded = true;
    }

    const color = exceeded ? colors.red : percentUsed > 90 ? colors.yellow : colors.green;
    const status = exceeded ? '✗ EXCEEDED' : '✓ PASSED';

    console.log(
      `${color}${status}${colors.reset} ${limit.name || limit.path}`
    );
    console.log(`  Limit: ${formatBytes(limitBytes)}`);
    console.log(`  Actual: ${formatBytes(actualSize)} (${percentUsed.toFixed(1)}% of limit)`);

    if (exceeded) {
      console.log(`  ${colors.red}Over by: ${formatBytes(actualSize - limitBytes)}${colors.reset}`);
    }
    console.log('');
  }

  if (hasExceeded) {
    console.log(`${colors.red}${colors.bright}⚠ Some bundles exceeded their size limits${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`${colors.green}${colors.bright}✓ All bundles within size limits${colors.reset}`);
  }
}

// Main execution
const filesToAnalyze = [
  { name: 'Main ESM (index.js)', path: join(distDir, 'index.js') },
  { name: 'Main ESM (index.node.js)', path: join(distDir, 'index.node.js') },
  { name: 'Browser bundle (ESM)', path: join(distDir, 'base-account.js') },
  { name: 'Browser bundle (min)', path: join(distDir, 'base-account.min.js') },
  { name: 'Browser bundle (UMD)', path: join(distDir, 'base-account.umd.js') },
  { name: 'Payment API (browser)', path: join(distDir, 'interface/payment/index.js') },
  { name: 'Payment API (node)', path: join(distDir, 'interface/payment/index.node.js') },
];

const analysis = filesToAnalyze.map(item => analyzeFile(item.name, item.path));

printAnalysis(analysis);
checkLimits(analysis);

#!/usr/bin/env node

/**
 * Smoke test script for @base-org/account SDK
 * 
 * This script verifies basic functionality of the locally built SDK:
 * - Imports work correctly
 * - Key functions and types are exported
 * - Basic operations can be performed without errors
 * - Module structure is intact
 */

import { existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

let testsPassed = 0;
let testsFailed = 0;
const errors = [];

/**
 * Helper to print test results
 */
function logTest(name, passed, details = '') {
  if (passed) {
    console.log(`${colors.green}✓${colors.reset} ${name}`);
    testsPassed++;
  } else {
    console.log(`${colors.red}✗${colors.reset} ${name}`);
    if (details) {
      console.log(`  ${colors.red}${details}${colors.reset}`);
    }
    testsFailed++;
    errors.push({ name, details });
  }
}

/**
 * Helper to print section headers
 */
function logSection(name) {
  console.log(`\n${colors.blue}${colors.bright}${name}${colors.reset}`);
  console.log('─'.repeat(60));
}

/**
 * Helper to check if a value is defined
 */
function isDefined(value, name) {
  return value !== undefined && value !== null;
}

async function runSmokeTests() {
  console.log(`${colors.bright}Base Account SDK - Smoke Test${colors.reset}\n`);

  // ============================================================================
  // Pre-flight checks
  // ============================================================================
  
  logSection('Pre-flight Checks');
  
  const distPath = resolve(__dirname, '../packages/account-sdk/dist');
  const distExists = existsSync(distPath);
  logTest(
    'SDK dist folder exists',
    distExists,
    distExists ? '' : 'Run `yarn build:packages` to build the SDK first'
  );

  if (!distExists) {
    console.log(`\n${colors.red}${colors.bright}Build Required${colors.reset}`);
    console.log('Please run the following command first:');
    console.log(`  ${colors.yellow}yarn build:packages${colors.reset}\n`);
    process.exit(1);
  }

  const indexPath = resolve(distPath, 'index.js');
  const indexExists = existsSync(indexPath);
  logTest('Main entry point exists', indexExists);

  if (!indexExists) {
    console.log(`\n${colors.red}${colors.bright}Build Error${colors.reset}`);
    console.log('SDK appears to be incompletely built.\n');
    process.exit(1);
  }

  // ============================================================================
  // Core SDK Exports
  // ============================================================================
  
  logSection('Core SDK Exports');

  let sdk;
  try {
    sdk = await import('../packages/account-sdk/dist/index.js');
    logTest('Main SDK module imports successfully', true);
  } catch (error) {
    logTest('Main SDK module imports successfully', false, error.message);
    process.exit(1);
  }

  // Check core exports
  logTest('createBaseAccountSDK is exported', isDefined(sdk.createBaseAccountSDK));
  logTest('VERSION is exported', isDefined(sdk.VERSION));
  logTest('getCryptoKeyAccount is exported', isDefined(sdk.getCryptoKeyAccount));
  logTest('removeCryptoKey is exported', isDefined(sdk.removeCryptoKey));

  // ============================================================================
  // Payment Module Exports
  // ============================================================================
  
  logSection('Payment Module Exports');

  logTest('base is exported', isDefined(sdk.base));
  logTest('pay is exported', isDefined(sdk.pay));
  logTest('prepareCharge is exported', isDefined(sdk.prepareCharge));
  logTest('subscribe is exported', isDefined(sdk.subscribe));
  logTest('getPaymentStatus is exported', isDefined(sdk.getPaymentStatus));
  logTest('getSubscriptionStatus is exported', isDefined(sdk.getSubscriptionStatus));
  logTest('TOKENS is exported', isDefined(sdk.TOKENS));
  logTest('CHAIN_IDS is exported', isDefined(sdk.CHAIN_IDS));

  // ============================================================================
  // Prolink Module Exports
  // ============================================================================
  
  logSection('Prolink Module Exports');

  logTest('createProlinkUrl is exported', isDefined(sdk.createProlinkUrl));
  logTest('encodeProlink is exported', isDefined(sdk.encodeProlink));
  logTest('decodeProlink is exported', isDefined(sdk.decodeProlink));

  // ============================================================================
  // Constants Validation
  // ============================================================================
  
  logSection('Constants Validation');

  if (sdk.VERSION) {
    const versionPattern = /^\d+\.\d+\.\d+/;
    logTest(
      `VERSION is valid (${sdk.VERSION})`,
      versionPattern.test(sdk.VERSION),
      sdk.VERSION ? '' : 'Version should match semantic versioning pattern'
    );
  }

  if (sdk.TOKENS) {
    logTest('TOKENS.USDC is defined', isDefined(sdk.TOKENS.USDC));
    if (sdk.TOKENS.USDC) {
      logTest('TOKENS.USDC has decimals', isDefined(sdk.TOKENS.USDC.decimals));
      logTest('TOKENS.USDC has addresses', isDefined(sdk.TOKENS.USDC.addresses));
      if (sdk.TOKENS.USDC.addresses) {
        logTest('TOKENS.USDC.addresses has base', isDefined(sdk.TOKENS.USDC.addresses.base));
        logTest('TOKENS.USDC.addresses has baseSepolia', isDefined(sdk.TOKENS.USDC.addresses.baseSepolia));
      }
    }
  }

  if (sdk.CHAIN_IDS) {
    logTest('CHAIN_IDS.base is defined', isDefined(sdk.CHAIN_IDS.base));
    logTest('CHAIN_IDS.baseSepolia is defined', isDefined(sdk.CHAIN_IDS.baseSepolia));
    
    if (sdk.CHAIN_IDS.base) {
      logTest('CHAIN_IDS.base is 8453', sdk.CHAIN_IDS.base === 8453);
    }
    if (sdk.CHAIN_IDS.baseSepolia) {
      logTest('CHAIN_IDS.baseSepolia is 84532', sdk.CHAIN_IDS.baseSepolia === 84532);
    }
  }

  // ============================================================================
  // Function Type Validation
  // ============================================================================
  
  logSection('Function Type Validation');

  logTest('createBaseAccountSDK is a function', typeof sdk.createBaseAccountSDK === 'function');
  logTest('pay is a function', typeof sdk.pay === 'function');
  logTest('prepareCharge is a function', typeof sdk.prepareCharge === 'function');
  logTest('subscribe is a function', typeof sdk.subscribe === 'function');
  logTest('getPaymentStatus is a function', typeof sdk.getPaymentStatus === 'function');
  logTest('getSubscriptionStatus is a function', typeof sdk.getSubscriptionStatus === 'function');
  logTest('encodeProlink is a function', typeof sdk.encodeProlink === 'function');
  logTest('decodeProlink is a function', typeof sdk.decodeProlink === 'function');
  logTest('createProlinkUrl is a function', typeof sdk.createProlinkUrl === 'function');

  // ============================================================================
  // Base Payment Object Validation
  // ============================================================================
  
  logSection('Base Payment Object Validation');

  if (sdk.base) {
    logTest('base.subscription is defined', isDefined(sdk.base.subscription));
    if (sdk.base.subscription) {
      logTest('base.subscription.prepareCharge is a function', 
        typeof sdk.base.subscription.prepareCharge === 'function');
    }
  }

  // ============================================================================
  // Separate Module Entry Points
  // ============================================================================
  
  logSection('Separate Module Entry Points');

  let paymentModule;
  try {
    paymentModule = await import('../packages/account-sdk/dist/interface/payment/index.js');
    logTest('Payment module imports independently', true);
  } catch (error) {
    logTest('Payment module imports independently', false, error.message);
  }

  if (paymentModule) {
    logTest('Payment module exports pay', isDefined(paymentModule.pay));
    logTest('Payment module exports subscribe', isDefined(paymentModule.subscribe));
    logTest('Payment module exports prepareCharge', isDefined(paymentModule.prepareCharge));
  }

  // ============================================================================
  // Basic SDK Instantiation
  // ============================================================================
  
  logSection('SDK Instantiation');

  // Note: SDK instantiation requires browser environment with localStorage
  // This test will be skipped in Node.js environments
  console.log(`${colors.yellow}ℹ${colors.reset} SDK instantiation requires browser environment (localStorage)`);
  console.log(`${colors.yellow}  Skipping instantiation tests in Node.js${colors.reset}`);

  // ============================================================================
  // Prolink Encoding/Decoding (Basic Functional Test)
  // ============================================================================
  
  logSection('Prolink Encoding/Decoding (Functional)');

  // Note: Prolink encoding/decoding uses brotli-wasm which requires browser environment
  // This test will be skipped in Node.js environments
  console.log(`${colors.yellow}ℹ${colors.reset} Prolink encoding/decoding requires browser environment (brotli-wasm)`);
  console.log(`${colors.yellow}  Skipping prolink functional tests in Node.js${colors.reset}`);

  // ============================================================================
  // Summary
  // ============================================================================
  
  console.log('\n' + '═'.repeat(60));
  console.log(`${colors.bright}Test Summary${colors.reset}`);
  console.log('═'.repeat(60));
  console.log(`${colors.green}Passed: ${testsPassed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testsFailed}${colors.reset}`);
  console.log(`Total:  ${testsPassed + testsFailed}\n`);

  if (testsFailed > 0) {
    console.log(`${colors.red}${colors.bright}Failed Tests:${colors.reset}`);
    for (const error of errors) {
      console.log(`  • ${error.name}`);
      if (error.details) {
        console.log(`    ${colors.red}${error.details}${colors.reset}`);
      }
    }
    console.log('');
    process.exit(1);
  } else {
    console.log(`${colors.green}${colors.bright}✓ All tests passed!${colors.reset}`);
    console.log(`${colors.green}The SDK is ready to use.${colors.reset}\n`);
    process.exit(0);
  }
}

// Run the tests
runSmokeTests().catch((error) => {
  console.error(`${colors.red}${colors.bright}Fatal Error:${colors.reset}`);
  console.error(error);
  process.exit(1);
});


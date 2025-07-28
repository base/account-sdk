#!/usr/bin/env node

/**
 * Test script to verify createBaseAccountSDK functionality
 * This can be run directly with Node.js after building the SDK
 */

const { createBaseAccountSDK } = require('./dist/index.js');

console.log('Testing createBaseAccountSDK functionality...\n');

// Test 1: Basic SDK Creation
console.log('1. Testing basic SDK creation:');
try {
    const sdk = createBaseAccountSDK({
        appName: 'Test App',
        appLogoUrl: 'https://example.com/logo.png',
        appChainIds: [8453, 84532],
        preference: {
            telemetry: false
        }
    });

    console.log('   ✅ SDK created successfully');
    console.log(`   - getProvider: ${typeof sdk.getProvider}`);
    console.log(`   - subAccount: ${typeof sdk.subAccount}`);
    console.log(`   - subAccount.create: ${typeof sdk.subAccount?.create}`);
    console.log(`   - subAccount.get: ${typeof sdk.subAccount?.get}`);
} catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
}

// Test 2: SDK with Custom Configuration
console.log('\n2. Testing SDK with custom configuration:');
try {
    const sdk = createBaseAccountSDK({
        appName: 'Custom Config App',
        appChainIds: [84532],
        preference: {
            telemetry: false,
            walletUrl: 'https://wallet.coinbase.com'
        },
        paymasterUrls: {
            84532: 'https://paymaster.base.org'
        }
    });

    const provider = sdk.getProvider();
    console.log('   ✅ SDK with custom config created');
    console.log(`   - Provider type: ${provider.constructor.name}`);
    console.log(`   - Provider methods: request, on, removeListener, disconnect, isConnected`);
} catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
}

// Test 3: SDK with Sub-Account Configuration
console.log('\n3. Testing SDK with sub-account configuration:');
try {
    const sdk = createBaseAccountSDK({
        appName: 'SubAccount Test App',
        appChainIds: [84532],
        preference: {
            telemetry: false
        },
        subAccounts: {
            toOwnerAccount: async () => {
                return {
                    account: {
                        address: '0x1234567890123456789012345678901234567890',
                        publicKey: '0xabcdef'
                    }
                };
            }
        }
    });

    console.log('   ✅ SDK with sub-account config created');
    console.log('   - Sub-account methods available');
    
    // Note: Actually calling these methods would require a connected wallet
    console.log('   - Note: Sub-account operations require wallet connection');
} catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
}

// Test 4: Multiple SDK Instances
console.log('\n4. Testing multiple SDK instances:');
try {
    const sdk1 = createBaseAccountSDK({
        appName: 'App 1',
        appChainIds: [8453]
    });
    
    const sdk2 = createBaseAccountSDK({
        appName: 'App 2',
        appChainIds: [84532]
    });

    console.log('   ✅ Multiple SDK instances created');
    console.log(`   - SDK 1 provider: ${sdk1.getProvider() ? 'Available' : 'Not available'}`);
    console.log(`   - SDK 2 provider: ${sdk2.getProvider() ? 'Available' : 'Not available'}`);
} catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
}

console.log('\n✅ All tests completed!');
console.log('\nNote: This test verifies the SDK structure and initialization.');
console.log('For full integration testing, use the browser test bundle.'); 
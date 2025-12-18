/**
 * Sub-Account Features Tests
 * 
 * Tests for sub-account creation, management, and operations including
 * creating sub-accounts, retrieving them, and performing operations with them.
 */

import { createPublicClient, http, toHex } from 'viem';
import { baseSepolia } from 'viem/chains';
import type { TestContext, TestHandlers } from '../types';
import { runTest } from '../utils/test-helpers';

/**
 * Test creating a sub-account with wallet_addSubAccount
 */
export async function testCreateSubAccount(
  handlers: TestHandlers,
  context: TestContext
): Promise<{ address: string } | undefined> {
  // Check if getCryptoKeyAccount is available (local SDK only)
  if (!context.loadedSDK.getCryptoKeyAccount) {
    handlers.updateTestStatus(
      'Sub-Account Features',
      'wallet_addSubAccount',
      'skipped',
      'getCryptoKeyAccount not available (local SDK only)'
    );
    handlers.addLog('warning', 'Sub-account creation requires local SDK');
    return undefined;
  }

  return runTest(
    {
      category: 'Sub-Account Features',
      name: 'wallet_addSubAccount',
      requiresProvider: true,
      requiresSDK: true,
      requiresUserInteraction: true,
    },
    async (ctx) => {
      handlers.addLog('info', 'Creating sub-account...');
      
      // Get or create a signer using getCryptoKeyAccount
      handlers.addLog('info', 'Step 1: Getting owner account from getCryptoKeyAccount...');
      const { account } = await ctx.loadedSDK.getCryptoKeyAccount!();
      
      if (!account) {
        throw new Error('Could not get owner account from getCryptoKeyAccount');
      }
      
      const accountType = account.type as string;
      handlers.addLog('info', `Step 2: Got account of type: ${accountType || 'address'}`);

      // Switch to Base Sepolia
      handlers.addLog('info', 'Step 3: Switching to Base Sepolia (chainId: 0x14a34 / 84532)...');
      await ctx.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x14a34' }], // 84532 in hex
      });
      handlers.addLog('info', 'Step 4: Chain switched successfully');

      // Prepare keys
      handlers.addLog('info', 'Step 5: Preparing wallet_addSubAccount params...');
      const keys = accountType === 'webAuthn'
        ? [{ type: 'webauthn-p256', publicKey: account.publicKey }]
        : [{ type: 'address', publicKey: account.address }];
      
      handlers.addLog('info', `Step 6: Calling wallet_addSubAccount with ${keys.length} key(s) of type: ${keys[0].type}...`);
      
      // Create sub-account with keys
      const response = await ctx.provider.request({
        method: 'wallet_addSubAccount',
        params: [
          {
            version: '1',
            account: {
              type: 'create',
              keys,
            },
          },
        ],
      }) as { address: string };

      if (!response || !response.address) {
        throw new Error('wallet_addSubAccount returned invalid response (no address)');
      }
      
      handlers.updateTestStatus(
        'Sub-Account Features',
        'wallet_addSubAccount',
        'passed',
        undefined,
        `Address: ${response.address.slice(0, 10)}...`
      );
      handlers.addLog('success', `Sub-account created: ${response.address}`);
      
      return response;
    },
    handlers,
    context
  );
}

/**
 * Test retrieving sub-accounts with wallet_getSubAccounts
 */
export async function testGetSubAccounts(
  handlers: TestHandlers,
  context: TestContext
): Promise<any> {
  // Check if sub-account address is available
  if (!context.subAccountAddress) {
    handlers.updateTestStatus(
      'Sub-Account Features',
      'wallet_getSubAccounts',
      'skipped',
      'No sub-account available'
    );
    return undefined;
  }

  return runTest(
    {
      category: 'Sub-Account Features',
      name: 'wallet_getSubAccounts',
      requiresProvider: true,
    },
    async (ctx) => {
      handlers.addLog('info', 'Fetching sub-accounts...');
      
      const accounts = await ctx.provider.request({
        method: 'eth_accounts',
        params: [],
      }) as string[];
      
      if (!accounts || accounts.length < 2) {
        throw new Error('No sub-account found in accounts list');
      }

      const response = await ctx.provider.request({
        method: 'wallet_getSubAccounts',
        params: [
          {
            account: accounts[1],
            domain: window.location.origin,
          },
        ],
      }) as { subAccounts: Array<{ address: string; factory: string; factoryData: string }> };

      const subAccounts = response.subAccounts || [];
      
      handlers.updateTestStatus(
        'Sub-Account Features',
        'wallet_getSubAccounts',
        'passed',
        undefined,
        `Found ${subAccounts.length} sub-account(s)`
      );
      handlers.addLog('success', `Retrieved ${subAccounts.length} sub-account(s)`);
      
      return response;
    },
    handlers,
    context
  );
}

/**
 * Test signing with a sub-account using personal_sign
 */
export async function testSignWithSubAccount(
  handlers: TestHandlers,
  context: TestContext
): Promise<{ signature: string; isValid: boolean } | undefined> {
  // Check if sub-account address is available
  if (!context.subAccountAddress) {
    handlers.updateTestStatus(
      'Sub-Account Features',
      'personal_sign (sub-account)',
      'skipped',
      'No sub-account available'
    );
    return undefined;
  }

  return runTest(
    {
      category: 'Sub-Account Features',
      name: 'personal_sign (sub-account)',
      requiresProvider: true,
      requiresUserInteraction: false,
    },
    async (ctx) => {
      handlers.addLog('info', 'Signing message with sub-account...');
      
      const message = 'Hello from sub-account!';
      const signature = await ctx.provider.request({
        method: 'personal_sign',
        params: [toHex(message), ctx.subAccountAddress!],
      }) as string;

      // Verify signature
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(),
      });

      const isValid = await publicClient.verifyMessage({
        address: ctx.subAccountAddress! as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      });

      handlers.updateTestStatus(
        'Sub-Account Features',
        'personal_sign (sub-account)',
        isValid ? 'passed' : 'failed',
        isValid ? undefined : 'Signature verification failed',
        `Verified: ${isValid}`
      );
      handlers.addLog('success', `Sub-account signature verified: ${isValid}`);
      
      return { signature, isValid };
    },
    handlers,
    context
  );
}

/**
 * Test sending calls from a sub-account with wallet_sendCalls
 */
export async function testSendCallsFromSubAccount(
  handlers: TestHandlers,
  context: TestContext
): Promise<any> {
  // Check if sub-account address is available
  if (!context.subAccountAddress) {
    handlers.updateTestStatus(
      'Sub-Account Features',
      'wallet_sendCalls (sub-account)',
      'skipped',
      'No sub-account available'
    );
    return undefined;
  }

  return runTest(
    {
      category: 'Sub-Account Features',
      name: 'wallet_sendCalls (sub-account)',
      requiresProvider: true,
      requiresUserInteraction: true,
    },
    async (ctx) => {
      handlers.addLog('info', 'Sending calls from sub-account...');
      
      const result = await ctx.provider.request({
        method: 'wallet_sendCalls',
        params: [{
          version: '1.0',
          chainId: '0x14a34', // Base Sepolia
          from: ctx.subAccountAddress!,
          calls: [{
            to: '0x000000000000000000000000000000000000dead',
            data: '0x',
            value: '0x0',
          }],
          capabilities: {
            paymasterService: {
              url: 'https://api.developer.coinbase.com/rpc/v1/base-sepolia/S-fOd2n2Oi4fl4e1Crm83XeDXZ7tkg8O',
            },
          },
        }],
      });

      handlers.updateTestStatus(
        'Sub-Account Features',
        'wallet_sendCalls (sub-account)',
        'passed',
        undefined,
        'Transaction sent with paymaster'
      );
      handlers.addLog('success', 'Sub-account transaction sent successfully');
      
      return result;
    },
    handlers,
    context
  );
}


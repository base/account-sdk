/**
 * Wallet Connection Tests
 * 
 * Tests for connecting to wallets, retrieving account information,
 * and signing messages.
 */

import { toHex } from 'viem';
import type { TestContext, TestHandlers } from '../types';
import { runTest } from '../utils/test-helpers';

/**
 * Test wallet connection via eth_requestAccounts
 */
export async function testConnectWallet(
  handlers: TestHandlers,
  context: TestContext
): Promise<string[] | undefined> {
  return runTest(
    {
      category: 'Wallet Connection',
      name: 'Connect wallet',
      requiresProvider: true,
      requiresUserInteraction: true,
    },
    async (ctx) => {
      handlers.addLog('info', 'Requesting wallet connection...');
      
      const accounts = await ctx.provider.request({
        method: 'eth_requestAccounts',
        params: [],
      }) as string[];

      if (accounts && accounts.length > 0) {
        handlers.updateTestStatus(
          'Wallet Connection',
          'Connect wallet',
          'passed',
          undefined,
          `Connected: ${accounts[0].slice(0, 10)}...`
        );
        handlers.addLog('success', `Connected to wallet: ${accounts[0]}`);
        return accounts;
      }
      
      throw new Error('No accounts returned');
    },
    handlers,
    context
  );
}

/**
 * Test retrieving accounts via eth_accounts
 */
export async function testGetAccounts(
  handlers: TestHandlers,
  context: TestContext
): Promise<string[] | undefined> {
  return runTest(
    {
      category: 'Wallet Connection',
      name: 'Get accounts',
      requiresProvider: true,
    },
    async (ctx) => {
      const accounts = await ctx.provider.request({
        method: 'eth_accounts',
        params: [],
      }) as string[];

      // Update connection state if accounts are found
      if (accounts && accounts.length > 0) {
        handlers.addLog('success', `Connected account found: ${accounts[0]}`);
      }

      handlers.updateTestStatus(
        'Wallet Connection',
        'Get accounts',
        'passed',
        undefined,
        `Found ${accounts.length} account(s)`
      );
      handlers.addLog('info', `Found ${accounts.length} account(s)`);
      
      return accounts;
    },
    handlers,
    context
  );
}

/**
 * Test retrieving chain ID via eth_chainId
 */
export async function testGetChainId(
  handlers: TestHandlers,
  context: TestContext
): Promise<number | undefined> {
  return runTest(
    {
      category: 'Wallet Connection',
      name: 'Get chain ID',
      requiresProvider: true,
    },
    async (ctx) => {
      const chainIdHex = await ctx.provider.request({
        method: 'eth_chainId',
        params: [],
      }) as string;

      const chainIdNum = parseInt(chainIdHex, 16);
      
      handlers.updateTestStatus(
        'Wallet Connection',
        'Get chain ID',
        'passed',
        undefined,
        `Chain ID: ${chainIdNum}`
      );
      handlers.addLog('info', `Chain ID: ${chainIdNum}`);
      
      return chainIdNum;
    },
    handlers,
    context
  );
}

/**
 * Test signing a message with personal_sign
 */
export async function testSignMessage(
  handlers: TestHandlers,
  context: TestContext
): Promise<string | undefined> {
  return runTest(
    {
      category: 'Wallet Connection',
      name: 'Sign message (personal_sign)',
      requiresProvider: true,
      requiresConnection: true,
      requiresUserInteraction: true,
    },
    async (ctx) => {
      const accounts = await ctx.provider.request({
        method: 'eth_accounts',
        params: [],
      }) as string[];
      
      const account = accounts[0];
      const message = 'Hello from Base Account SDK E2E Test!';
      
      const signature = await ctx.provider.request({
        method: 'personal_sign',
        params: [message, account],
      }) as string;

      handlers.updateTestStatus(
        'Wallet Connection',
        'Sign message (personal_sign)',
        'passed',
        undefined,
        `Sig: ${signature.slice(0, 20)}...`
      );
      handlers.addLog('success', `Message signed: ${signature.slice(0, 20)}...`);
      
      return signature;
    },
    handlers,
    context
  );
}


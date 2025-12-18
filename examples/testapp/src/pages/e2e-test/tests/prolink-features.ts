/**
 * Prolink Features Tests
 * 
 * Tests for Prolink encoding, decoding, and URL generation functionality.
 */

import type { TestContext, TestHandlers } from '../types';
import { runTest } from '../utils/test-helpers';

/**
 * Test Prolink encoding, decoding, and URL creation
 */
export async function testProlinkEncodeDecode(
  handlers: TestHandlers,
  context: TestContext
): Promise<void> {
  const category = 'Prolink Features';

  // Check if Prolink functions are available
  if (!context.loadedSDK.encodeProlink || !context.loadedSDK.decodeProlink || !context.loadedSDK.createProlinkUrl) {
    handlers.updateTestStatus(category, 'encodeProlink()', 'skipped', 'Prolink API not available');
    handlers.updateTestStatus(category, 'decodeProlink()', 'skipped', 'Prolink API not available');
    handlers.updateTestStatus(category, 'createProlinkUrl()', 'skipped', 'Prolink API not available');
    handlers.addLog('warning', 'Prolink API not available - failed to load from CDN');
    return;
  }

  // Test encoding
  const encoded = await runTest(
    {
      category,
      name: 'encodeProlink()',
      requiresSDK: true,
    },
    async (ctx) => {
      const testRequest = {
        method: 'wallet_sendCalls',
        params: [
          {
            version: '1',
            from: '0x0000000000000000000000000000000000000001',
            calls: [
              {
                to: '0x0000000000000000000000000000000000000002',
                data: '0x',
                value: '0x0',
              },
            ],
            chainId: '0x2105',
          },
        ],
      };

      const encoded = await ctx.loadedSDK.encodeProlink!(testRequest);
      
      handlers.updateTestStatus(
        category,
        'encodeProlink()',
        'passed',
        undefined,
        `Encoded: ${encoded.slice(0, 30)}...`
      );
      handlers.addLog('success', `Prolink encoded: ${encoded.slice(0, 30)}...`);
      
      return encoded;
    },
    handlers,
    context
  );

  if (!encoded) {
    return; // Encoding failed, skip remaining tests
  }

  // Test decoding
  await runTest(
    {
      category,
      name: 'decodeProlink()',
      requiresSDK: true,
    },
    async (ctx) => {
      const decoded = await ctx.loadedSDK.decodeProlink!(encoded);
      
      if (decoded.method === 'wallet_sendCalls') {
        handlers.updateTestStatus(category, 'decodeProlink()', 'passed', undefined, 'Decoded successfully');
        handlers.addLog('success', 'Prolink decoded successfully');
        return decoded;
      }
      
      throw new Error('Decoded method mismatch');
    },
    handlers,
    context
  );

  // Test URL creation
  await runTest(
    {
      category,
      name: 'createProlinkUrl()',
      requiresSDK: true,
    },
    async (ctx) => {
      const url = ctx.loadedSDK.createProlinkUrl!(encoded);
      
      if (url.startsWith('https://base.app/base-pay')) {
        handlers.updateTestStatus(category, 'createProlinkUrl()', 'passed', undefined, `URL: ${url.slice(0, 50)}...`);
        handlers.addLog('success', `Prolink URL created: ${url.slice(0, 80)}...`);
        return url;
      }
      
      throw new Error(`Invalid URL format: ${url}`);
    },
    handlers,
    context
  );
}


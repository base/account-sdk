import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createEasyAccessClient,
  generateAccessToken,
  validateAccessToken,
  easyLogin,
  easyLogout,
  getCurrentSession,
  tokenCache,
} from './easyAccess';

describe('Easy Account Access Utility', () => {
  const testAddress = '0x1234567890123456789012345678901234567890';
  const testPrivateKey = '0x1234567890123456789012345678901234567890123456789012345678901234';

  beforeEach(() => {
    tokenCache.clear();
  });

  describe('createEasyAccessClient', () => {
    it('should create a client with default RPC URL', () => {
      const client = createEasyAccessClient({
        address: testAddress,
      });

      expect(client).toBeDefined();
      expect(client.publicClient).toBeDefined();
      expect(client.config.address).toBe(testAddress);
    });

    it('should create a client with custom RPC URL', () => {
      const customRpc = 'https://custom.rpc.url';
      const client = createEasyAccessClient({
        address: testAddress,
        rpcUrl: customRpc,
      });

      expect(client.config.rpcUrl).toBe(customRpc);
    });

    it('should create a wallet client when private key is provided', () => {
      const client = createEasyAccessClient({
        address: testAddress,
        privateKey: testPrivateKey,
      });

      expect(client.walletClient).toBeDefined();
    });

    it('should not create a wallet client when private key is not provided', () => {
      const client = createEasyAccessClient({
        address: testAddress,
      });

      expect(client.walletClient).toBeNull();
    });
  });

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(testAddress);

      expect(token).toBeDefined();
      expect(token.address).toBe(testAddress);
      expect(token.token).toBeTruthy();
      expect(token.expiresAt).toBeGreaterThan(Date.now());
    });

    it('should generate token with default 24-hour expiry', () => {
      const token = generateAccessToken(testAddress);
      const expectedExpiry = 24 * 60 * 60 * 1000;

      expect(token.expiresAt - Date.now()).toBeCloseTo(expectedExpiry, -3);
    });

    it('should generate token with custom expiry hours', () => {
      const expiryHours = 48;
      const token = generateAccessToken(testAddress, expiryHours);
      const expectedExpiry = expiryHours * 60 * 60 * 1000;

      expect(token.expiresAt - Date.now()).toBeCloseTo(expectedExpiry, -3);
    });

    it('should generate unique tokens', () => {
      const token1 = generateAccessToken(testAddress);
      const token2 = generateAccessToken(testAddress);

      expect(token1.token).not.toBe(token2.token);
    });
  });

  describe('validateAccessToken', () => {
    it('should validate a non-expired token', () => {
      const token = generateAccessToken(testAddress, 24);

      expect(validateAccessToken(token)).toBe(true);
    });

    it('should invalidate an expired token', () => {
      const token = generateAccessToken(testAddress, 24);
      token.expiresAt = Date.now() - 1000; // Set to 1 second ago

      expect(validateAccessToken(token)).toBe(false);
    });

    it('should validate token expiring exactly now', () => {
      const token = generateAccessToken(testAddress, 24);
      token.expiresAt = Date.now();

      expect(validateAccessToken(token)).toBe(false); // Should be expired
    });
  });

  describe('easyLogin', () => {
    it('should successfully login and return a token', async () => {
      const token = await easyLogin(testAddress);

      expect(token).toBeDefined();
      expect(token.address).toBe(testAddress);
      expect(token.token).toBeTruthy();
      expect(validateAccessToken(token)).toBe(true);
    });

    it('should cache the token after login', async () => {
      await easyLogin(testAddress);
      const cachedToken = tokenCache.get(testAddress);

      expect(cachedToken).toBeDefined();
      expect(cachedToken?.address).toBe(testAddress);
    });

    it('should return cached token on second login', async () => {
      const firstToken = await easyLogin(testAddress);
      const secondToken = await easyLogin(testAddress);

      expect(firstToken.token).toBe(secondToken.token);
    });

    it('should accept custom expiry hours', async () => {
      const expiryHours = 48;
      const token = await easyLogin(testAddress, expiryHours);
      const expectedExpiry = expiryHours * 60 * 60 * 1000;

      expect(token.expiresAt - Date.now()).toBeCloseTo(expectedExpiry, -3);
    });
  });

  describe('easyLogout', () => {
    it('should clear cached tokens', async () => {
      await easyLogin(testAddress);
      expect(tokenCache.get(testAddress)).toBeDefined();

      easyLogout(testAddress);
      expect(tokenCache.get(testAddress)).toBeUndefined();
    });

    it('should handle logout for non-existent sessions', () => {
      expect(() => easyLogout(testAddress)).not.toThrow();
    });
  });

  describe('getCurrentSession', () => {
    it('should return null when no session exists', () => {
      const session = getCurrentSession(testAddress);

      expect(session).toBeNull();
    });

    it('should return active session', async () => {
      await easyLogin(testAddress);
      const session = getCurrentSession(testAddress);

      expect(session).toBeDefined();
      expect(session?.address).toBe(testAddress);
    });

    it('should return null for expired session', async () => {
      const token = await easyLogin(testAddress);
      token.expiresAt = Date.now() - 1000; // Expire the token

      const session = getCurrentSession(testAddress);

      expect(session).toBeNull();
    });
  });

  describe('Token Cache', () => {
    it('should set and get tokens', () => {
      const token = generateAccessToken(testAddress, 24);
      tokenCache.set(token);

      const retrieved = tokenCache.get(testAddress);

      expect(retrieved).toBeDefined();
      expect(retrieved?.token).toBe(token.token);
    });

    it('should clear all tokens', async () => {
      await easyLogin(testAddress);
      const address2 = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
      await easyLogin(address2);

      tokenCache.clear();

      expect(tokenCache.get(testAddress)).toBeUndefined();
      expect(tokenCache.get(address2)).toBeUndefined();
    });

    it('should remove expired tokens on clearExpired', async () => {
      const token1 = generateAccessToken(testAddress, 24);
      tokenCache.set(token1);

      const address2 = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
      const token2 = generateAccessToken(address2, 24);
      token2.expiresAt = Date.now() - 1000; // Expire this token
      tokenCache.set(token2);

      tokenCache.clearExpired();

      expect(tokenCache.get(testAddress)).toBeDefined();
      expect(tokenCache.get(address2)).toBeUndefined();
    });

    it('should not return expired tokens', async () => {
      const token = generateAccessToken(testAddress, 24);
      tokenCache.set(token);

      // Expire the token
      token.expiresAt = Date.now() - 1000;

      const retrieved = tokenCache.get(testAddress);

      expect(retrieved).toBeUndefined();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete login/logout flow', async () => {
      // Initially no session
      expect(getCurrentSession(testAddress)).toBeNull();

      // Login
      const token = await easyLogin(testAddress);
      expect(token).toBeDefined();

      // Check session exists
      const session = getCurrentSession(testAddress);
      expect(session).toBeDefined();
      expect(session?.address).toBe(testAddress);

      // Logout
      easyLogout(testAddress);

      // Session should be cleared
      expect(getCurrentSession(testAddress)).toBeNull();
    });

    it('should handle multiple concurrent sessions', async () => {
      const addresses = [
        '0x1111111111111111111111111111111111111111',
        '0x2222222222222222222222222222222222222222',
        '0x3333333333333333333333333333333333333333',
      ];

      // Login all
      const tokens = await Promise.all(addresses.map(addr => easyLogin(addr)));

      // Verify all sessions
      tokens.forEach((token, index) => {
        const session = getCurrentSession(addresses[index]);
        expect(session).toBeDefined();
        expect(session?.address).toBe(addresses[index]);
      });

      // Logout one
      easyLogout(addresses[0]);

      // Verify only one is logged out
      expect(getCurrentSession(addresses[0])).toBeNull();
      expect(getCurrentSession(addresses[1])).toBeDefined();
      expect(getCurrentSession(addresses[2])).toBeDefined();
    });

    it('should handle rapid login/logout cycles', async () => {
      for (let i = 0; i < 5; i++) {
        const token = await easyLogin(testAddress);
        expect(token).toBeDefined();

        const session = getCurrentSession(testAddress);
        expect(session).toBeDefined();

        easyLogout(testAddress);
        expect(getCurrentSession(testAddress)).toBeNull();
      }
    });
  });
});

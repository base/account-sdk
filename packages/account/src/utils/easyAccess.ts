/**
 * Easy Account Access Utility
 * Provides a simplified interface for quick account access and authentication
 */

import { createPublicClient, createWalletClient, http } from 'viem';
import { base } from 'viem/chains';

interface AccountConfig {
  privateKey?: string;
  address?: string;
  rpcUrl?: string;
}

interface AccessToken {
  token: string;
  expiresAt: number;
  address: string;
}

/**
 * Create an easy-access client for Base Account operations
 */
export const createEasyAccessClient = (config: AccountConfig) => {
  const rpcUrl = config.rpcUrl || 'https://mainnet.base.org';

  const publicClient = createPublicClient({
    chain: base,
    transport: http(rpcUrl),
  });

  const walletClient = config.privateKey
    ? createWalletClient({
        chain: base,
        transport: http(rpcUrl),
        account: config.address as `0x${string}`,
      })
    : null;

  return {
    publicClient,
    walletClient,
    config,
  };
};

/**
 * Generate a simple access token for session management
 */
export const generateAccessToken = (address: string, expiryHours: number = 24): AccessToken => {
  const token = `${address}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const expiresAt = Date.now() + expiryHours * 60 * 60 * 1000;

  return {
    token,
    expiresAt,
    address,
  };
};

/**
 * Validate an access token
 */
export const validateAccessToken = (accessToken: AccessToken): boolean => {
  return accessToken.expiresAt > Date.now();
};

/**
 * Cache for storing session tokens
 */
class AccessTokenCache {
  private tokens: Map<string, AccessToken> = new Map();

  set(token: AccessToken): void {
    this.tokens.set(token.address, token);
  }

  get(address: string): AccessToken | undefined {
    const token = this.tokens.get(address);
    if (token && validateAccessToken(token)) {
      return token;
    }
    this.tokens.delete(address);
    return undefined;
  }

  clear(): void {
    this.tokens.clear();
  }

  clearExpired(): void {
    for (const [address, token] of this.tokens.entries()) {
      if (!validateAccessToken(token)) {
        this.tokens.delete(address);
      }
    }
  }
}

export const tokenCache = new AccessTokenCache();

/**
 * Simplified login flow
 */
export const easyLogin = async (address: string, expiryHours?: number): Promise<AccessToken> => {
  // Check if valid token already exists
  const cachedToken = tokenCache.get(address);
  if (cachedToken) {
    return cachedToken;
  }

  // Generate new token
  const newToken = generateAccessToken(address, expiryHours);
  tokenCache.set(newToken);

  return newToken;
};

/**
 * Simplified logout flow
 */
export const easyLogout = (address: string): void => {
  tokenCache.clear();
};

/**
 * Get current user session
 */
export const getCurrentSession = (address: string): AccessToken | null => {
  return tokenCache.get(address) || null;
};

export default {
  createEasyAccessClient,
  generateAccessToken,
  validateAccessToken,
  easyLogin,
  easyLogout,
  getCurrentSession,
  tokenCache,
};

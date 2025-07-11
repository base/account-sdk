import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveENS } from './ensResolution.js';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('resolveENS', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should resolve ENS name to address successfully', async () => {
    const mockResponse = {
      result: {
        profiles: {
          'vitalik.eth': {
            address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
            name: 'vitalik.eth',
            displayName: 'Vitalik Buterin',
          },
        },
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await resolveENS('vitalik.eth');

    expect(result).toBe('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.wallet.coinbase.com/rpc/v2/getBasicPublicProfiles?names=vitalik.eth',
      {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        },
      }
    );
  });

  it('should handle ENS name not found', async () => {
    const mockResponse = {
      result: {
        profiles: {},
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    await expect(resolveENS('nonexistent.eth')).rejects.toThrow(
      'Failed to resolve ENS name "nonexistent.eth": ENS name "nonexistent.eth" not found'
    );
  });

  it('should handle profile without address', async () => {
    const mockResponse = {
      result: {
        profiles: {
          'test.eth': {
            name: 'test.eth',
            address: null,
          },
        },
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    await expect(resolveENS('test.eth')).rejects.toThrow(
      'Failed to resolve ENS name "test.eth": No address found for ENS name "test.eth"'
    );
  });

  it('should handle missing result object', async () => {
    const mockResponse = {};

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    await expect(resolveENS('test.eth')).rejects.toThrow(
      'Failed to resolve ENS name "test.eth": Invalid response format for ENS name "test.eth"'
    );
  });

  it('should handle missing profiles object', async () => {
    const mockResponse = {
      result: {},
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    await expect(resolveENS('test.eth')).rejects.toThrow(
      'Failed to resolve ENS name "test.eth": Invalid response format for ENS name "test.eth"'
    );
  });

  it('should handle API error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(resolveENS('test.eth')).rejects.toThrow(
      'Failed to resolve ENS name "test.eth": ENS resolution failed: 404 Not Found'
    );
  });

  it('should handle network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(resolveENS('test.eth')).rejects.toThrow(
      'Failed to resolve ENS name "test.eth": Network error'
    );
  });

  it('should handle invalid JSON response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    });

    await expect(resolveENS('test.eth')).rejects.toThrow(
      'Failed to resolve ENS name "test.eth": Invalid JSON'
    );
  });
}); 
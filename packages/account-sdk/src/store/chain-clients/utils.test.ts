import { base, baseSepolia, optimismSepolia, sepolia } from 'viem/chains';

import { ChainClients } from './store.js';
import { createClients } from './utils.js';

describe('chain-clients/utils', () => {
  beforeEach(() => {
    // Clear the ChainClients state before each test
    ChainClients.setState(() => ({}), true);
  });

  it('should create clients', () => {
    createClients([
      {
        id: sepolia.id,
        rpcUrl: sepolia.rpcUrls.default.http[0],
        nativeCurrency: {
          name: sepolia.nativeCurrency.name,
          symbol: sepolia.nativeCurrency.symbol,
          decimal: sepolia.nativeCurrency.decimals,
        },
      },
    ]);
    expect(Object.keys(ChainClients.getState()).length).toBe(1);
  });

  it('should create clients for multiple chains', () => {
    createClients([
      {
        id: sepolia.id,
        rpcUrl: sepolia.rpcUrls.default.http[0],
        nativeCurrency: {
          name: sepolia.nativeCurrency.name,
          symbol: sepolia.nativeCurrency.symbol,
          decimal: sepolia.nativeCurrency.decimals,
        },
      },
      {
        id: optimismSepolia.id,
        rpcUrl: optimismSepolia.rpcUrls.default.http[0],
        nativeCurrency: {
          name: optimismSepolia.nativeCurrency.name,
          symbol: optimismSepolia.nativeCurrency.symbol,
          decimal: optimismSepolia.nativeCurrency.decimals,
        },
      },
    ]);
    expect(Object.keys(ChainClients.getState()).length).toBe(2);
    expect(ChainClients.getState()[sepolia.id].client).toBeDefined();
    expect(ChainClients.getState()[optimismSepolia.id].client).toBeDefined();

    expect(ChainClients.getState()[sepolia.id].bundlerClient).toBeDefined();
    expect(ChainClients.getState()[optimismSepolia.id].bundlerClient).toBeDefined();
  });

  describe('fallback RPC URLs', () => {
    it('should use fallback RPC URL for Base mainnet when wallet does not provide one', () => {
      createClients([
        {
          id: base.id, // Base mainnet
          // No rpcUrl provided
        },
      ]);

      expect(ChainClients.getState()[base.id]).toBeDefined();
      expect(ChainClients.getState()[base.id].client).toBeDefined();
      expect(ChainClients.getState()[base.id].bundlerClient).toBeDefined();
    });

    it('should use fallback RPC URL for Base Sepolia when wallet does not provide one', () => {
      createClients([
        {
          id: baseSepolia.id, // Base Sepolia
          // No rpcUrl provided
        },
      ]);

      expect(ChainClients.getState()[baseSepolia.id]).toBeDefined();
      expect(ChainClients.getState()[baseSepolia.id].client).toBeDefined();
      expect(ChainClients.getState()[baseSepolia.id].bundlerClient).toBeDefined();
    });

    it('should prefer wallet-provided RPC URL over fallback for Base mainnet', () => {
      const customRpcUrl = 'https://custom.base.rpc.url';
      createClients([
        {
          id: base.id, // Base mainnet
          rpcUrl: customRpcUrl,
        },
      ]);

      expect(ChainClients.getState()[base.id]).toBeDefined();
      expect(ChainClients.getState()[base.id].client).toBeDefined();
      // We can't directly test the RPC URL used, but we can verify the client was created
    });

    it('should not create client for unsupported chain without RPC URL', () => {
      createClients([
        {
          id: 999999, // Unsupported chain
          // No rpcUrl provided
        },
      ]);

      expect(ChainClients.getState()[999999]).toBeUndefined();
    });

    it('should handle mixed chains with and without RPC URLs', () => {
      createClients([
        {
          id: base.id, // Base mainnet - will use fallback
        },
        {
          id: sepolia.id,
          rpcUrl: sepolia.rpcUrls.default.http[0],
        },
        {
          id: 999999, // Unsupported chain - will be skipped
        },
        {
          id: baseSepolia.id, // Base Sepolia - will use fallback
        },
      ]);

      expect(Object.keys(ChainClients.getState()).length).toBe(3);
      expect(ChainClients.getState()[base.id]).toBeDefined();
      expect(ChainClients.getState()[sepolia.id]).toBeDefined();
      expect(ChainClients.getState()[baseSepolia.id]).toBeDefined();
      expect(ChainClients.getState()[999999]).toBeUndefined();
    });
  });
});

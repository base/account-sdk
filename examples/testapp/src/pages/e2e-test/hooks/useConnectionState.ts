/**
 * Hook for managing wallet connection state
 * 
 * Consolidates connection status, current account, and chain ID tracking.
 * Provides helper functions for ensuring connection is established.
 */

import { useCallback, useState } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface UseConnectionStateReturn {
  // State
  connected: boolean;
  currentAccount: string | null;
  allAccounts: string[];
  chainId: number | null;
  
  // Actions
  setConnected: (connected: boolean) => void;
  setCurrentAccount: (account: string | null) => void;
  setAllAccounts: (accounts: string[]) => void;
  setChainId: (chainId: number | null) => void;
  
  // Helpers
  updateConnectionFromProvider: (provider: any) => Promise<void>;
}

// ============================================================================
// Hook
// ============================================================================

export function useConnectionState(): UseConnectionStateReturn {
  const [connected, setConnected] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);
  const [allAccounts, setAllAccounts] = useState<string[]>([]);
  const [chainId, setChainId] = useState<number | null>(null);

  /**
   * Update connection state from provider
   * Queries provider for current account and chain ID
   */
  const updateConnectionFromProvider = useCallback(
    async (provider: any) => {
      if (!provider) {
        return;
      }

      try {
        // Get accounts
        const accounts = await provider.request({
          method: 'eth_accounts',
          params: [],
        });

        if (accounts && accounts.length > 0) {
          setCurrentAccount(accounts[0]);
          setAllAccounts(accounts);
          setConnected(true);
        } else {
          setCurrentAccount(null);
          setAllAccounts([]);
          setConnected(false);
        }

        // Get chain ID
        const chainIdHex = await provider.request({
          method: 'eth_chainId',
          params: [],
        });
        const chainIdNum = parseInt(chainIdHex, 16);
        setChainId(chainIdNum);
      } catch (error) {
        console.error('Failed to update connection from provider:', error);
      }
    },
    []
  );

  return {
    // State
    connected,
    currentAccount,
    allAccounts,
    chainId,
    
    // Actions
    setConnected,
    setCurrentAccount,
    setAllAccounts,
    setChainId,
    
    // Helpers
    updateConnectionFromProvider,
  };
}


/**
 * Hook for managing SDK loading and state
 * 
 * Consolidates SDK source selection, loading, version management,
 * and SDK instance state into a single hook.
 */

import { useState, useCallback } from 'react';
import { loadSDK, type LoadedSDK, type SDKSource } from '../../../utils/sdkLoader';
import type { BaseAccountSDK } from '../types';
import { SDK_CONFIG } from '../../../utils/e2e-test-config';

// ============================================================================
// Types
// ============================================================================

export interface UseSDKStateReturn {
  // State
  sdkSource: SDKSource;
  loadedSDK: LoadedSDK | null;
  sdk: BaseAccountSDK | null;
  provider: any | null; // EIP1193Provider type
  isLoadingSDK: boolean;
  sdkLoadError: string | null;
  
  // Actions
  setSdkSource: (source: SDKSource) => void;
  loadAndInitializeSDK: (config?: { appName?: string; appLogoUrl?: string; appChainIds?: number[]; walletUrl?: string }) => Promise<void>;
  setSdk: (sdk: BaseAccountSDK | null) => void;
  setProvider: (provider: any | null) => void;
}

// ============================================================================
// Hook
// ============================================================================

export function useSDKState(): UseSDKStateReturn {
  const [sdkSource, setSdkSource] = useState<SDKSource>('local');
  const [loadedSDK, setLoadedSDK] = useState<LoadedSDK | null>(null);
  const [sdk, setSdk] = useState<BaseAccountSDK | null>(null);
  const [provider, setProvider] = useState<any | null>(null);
  const [isLoadingSDK, setIsLoadingSDK] = useState(false);
  const [sdkLoadError, setSdkLoadError] = useState<string | null>(null);

  const loadAndInitializeSDK = useCallback(
    async (config?: { appName?: string; appLogoUrl?: string; appChainIds?: number[]; walletUrl?: string }) => {
      setIsLoadingSDK(true);
      setSdkLoadError(null);

      try {
        const loaded = await loadSDK({ source: sdkSource });
        setLoadedSDK(loaded);

        // Initialize SDK instance with provided or default config
        const sdkInstance = loaded.createBaseAccountSDK({
          appName: config?.appName || SDK_CONFIG.APP_NAME,
          appLogoUrl: config?.appLogoUrl || SDK_CONFIG.APP_LOGO_URL,
          appChainIds: config?.appChainIds || [...SDK_CONFIG.DEFAULT_CHAIN_IDS],
          preference: {
            walletUrl: config?.walletUrl,
          },
        });

        setSdk(sdkInstance);
        const providerInstance = sdkInstance.getProvider();
        setProvider(providerInstance);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setSdkLoadError(errorMessage);
        throw error; // Re-throw so caller can handle
      } finally {
        setIsLoadingSDK(false);
      }
    },
    [sdkSource]
  );

  return {
    // State
    sdkSource,
    loadedSDK,
    sdk,
    provider,
    isLoadingSDK,
    sdkLoadError,
    
    // Actions
    setSdkSource,
    loadAndInitializeSDK,
    setSdk,
    setProvider,
  };
}


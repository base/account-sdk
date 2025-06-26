import { createProvider } from '@coinbase/wallet-sdk';

import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DisconnectedAlert } from '../components/alerts/DisconnectedAlert';
import { useEventListeners } from '../hooks/useEventListeners';
import { useSpyOnDisconnectedError } from '../hooks/useSpyOnDisconnectedError';
import { scwUrls } from '../store/config';
import { useConfig } from './ConfigContextProvider';

type EIP1193ProviderContextProviderProps = {
  children: ReactNode;
};

type EIP1193ProviderContextType = {
  provider: ReturnType<typeof createProvider>;
};

const EIP1193ProviderContext = createContext<EIP1193ProviderContextType | null>(null);

export function EIP1193ProviderContextProvider({ children }: EIP1193ProviderContextProviderProps) {
  const { scwUrl, config, subAccountsConfig } = useConfig();
  const { addEventListeners, removeEventListeners } = useEventListeners();
  const {
    spyOnDisconnectedError,
    isOpen: isDisconnectedAlertOpen,
    onClose: onDisconnectedAlertClose,
  } = useSpyOnDisconnectedError();

  const [provider, setProvider] = useState(null);

  useEffect(() => {
    const sdkParams = {
      appName: 'SDK Playground',
      appChainIds: [84532, 8452],
      preference: {
        attribution: config.attribution,
        keysUrl: scwUrl ?? scwUrls[0],
      },
      subAccounts: subAccountsConfig,
    };

    const newProvider = createProvider(sdkParams);
    // biome-ignore lint/suspicious/noConsole: developer feedback
    console.log('Provider:', newProvider);

    addEventListeners(newProvider);
    spyOnDisconnectedError(newProvider);

    // @ts-ignore convenience for testing
    window.ethereum = newProvider;
    setProvider(newProvider);

    return () => {
      removeEventListeners(newProvider);
    };
  }, [
    scwUrl,
    config,
    subAccountsConfig,
    spyOnDisconnectedError,
    addEventListeners,
    removeEventListeners,
  ]);

  const value = useMemo(
    () => ({
      provider,
    }),
    [provider]
  );

  return (
    <EIP1193ProviderContext.Provider value={value}>
      <>
        {children}
        <DisconnectedAlert isOpen={isDisconnectedAlertOpen} onClose={onDisconnectedAlertClose} />
      </>
    </EIP1193ProviderContext.Provider>
  );
}

export function useEIP1193Provider() {
  const context = useContext(EIP1193ProviderContext);
  if (context === undefined) {
    throw new Error('useEIP1193Provider must be used within a EIP1193ProviderContextProvider');
  }
  return context;
}

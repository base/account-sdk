/**
 * Utility to dynamically load SDK from npm or use local workspace version
 */

export type SDKSource = 'local' | 'npm';

export interface SDKLoaderConfig {
  source: SDKSource;
}

export interface LoadedSDK {
  base: any;
  createBaseAccountSDK: any;
  createProlinkUrl: any;
  decodeProlink: any;
  encodeProlink: any;
  getCryptoKeyAccount?: any; // Only available in local SDK
  VERSION: string;
  CHAIN_IDS: any;
  TOKENS: any;
  getPaymentStatus: any;
  getSubscriptionStatus: any;
  spendPermission: {
    fetchPermission: any;
    fetchPermissions: any;
    getHash: any;
    getPermissionStatus: any;
    prepareRevokeCallData: any;
    prepareSpendCallData: any;
    requestSpendPermission: any;
  };
}

/**
 * Load SDK from npm package (published version)
 */
async function loadFromNpm(): Promise<LoadedSDK> {
  console.log('[SDK Loader] Loading from npm (@base-org/account-npm)...');
  
  // Dynamic import of npm package (installed as @base-org/account-npm alias)
  // @ts-expect-error - TypeScript doesn't recognize yarn aliases, but package is installed
  const mainModule = await import('@base-org/account-npm');
  // @ts-expect-error - TypeScript doesn't recognize yarn aliases, but package is installed
  const spendPermissionModule = await import('@base-org/account-npm/spend-permission');
  
  console.log('[SDK Loader] NPM module loaded');
  console.log('[SDK Loader] VERSION:', mainModule.VERSION);
  
  return {
    base: mainModule.base,
    createBaseAccountSDK: mainModule.createBaseAccountSDK,
    createProlinkUrl: mainModule.createProlinkUrl,
    decodeProlink: mainModule.decodeProlink,
    encodeProlink: mainModule.encodeProlink,
    getCryptoKeyAccount: mainModule.getCryptoKeyAccount, // May or may not be available
    VERSION: mainModule.VERSION,
    CHAIN_IDS: mainModule.CHAIN_IDS,
    TOKENS: mainModule.TOKENS,
    getPaymentStatus: mainModule.getPaymentStatus,
    getSubscriptionStatus: mainModule.getSubscriptionStatus,
    spendPermission: {
      fetchPermission: spendPermissionModule.fetchPermission,
      fetchPermissions: spendPermissionModule.fetchPermissions,
      getHash: spendPermissionModule.getHash,
      getPermissionStatus: spendPermissionModule.getPermissionStatus,
      prepareRevokeCallData: spendPermissionModule.prepareRevokeCallData,
      prepareSpendCallData: spendPermissionModule.prepareSpendCallData,
      requestSpendPermission: spendPermissionModule.requestSpendPermission,
    },
  };
}

/**
 * Load SDK from local workspace (development version)
 */
async function loadFromLocal(): Promise<LoadedSDK> {
  console.log('[SDK Loader] Loading from local workspace...');
  
  // Dynamic import of local workspace package
  const mainModule = await import('@base-org/account');
  const spendPermissionModule = await import('@base-org/account/spend-permission');
  
  console.log('[SDK Loader] Local module loaded');
  console.log('[SDK Loader] VERSION:', mainModule.VERSION);
  console.log('[SDK Loader] getCryptoKeyAccount available:', !!mainModule.getCryptoKeyAccount);
  
  return {
    base: mainModule.base,
    createBaseAccountSDK: mainModule.createBaseAccountSDK,
    createProlinkUrl: mainModule.createProlinkUrl,
    decodeProlink: mainModule.decodeProlink,
    encodeProlink: mainModule.encodeProlink,
    getCryptoKeyAccount: mainModule.getCryptoKeyAccount,
    VERSION: mainModule.VERSION,
    CHAIN_IDS: mainModule.CHAIN_IDS,
    TOKENS: mainModule.TOKENS,
    getPaymentStatus: mainModule.getPaymentStatus,
    getSubscriptionStatus: mainModule.getSubscriptionStatus,
    spendPermission: {
      fetchPermission: spendPermissionModule.fetchPermission,
      fetchPermissions: spendPermissionModule.fetchPermissions,
      getHash: spendPermissionModule.getHash,
      getPermissionStatus: spendPermissionModule.getPermissionStatus,
      prepareRevokeCallData: spendPermissionModule.prepareRevokeCallData,
      prepareSpendCallData: spendPermissionModule.prepareSpendCallData,
      requestSpendPermission: spendPermissionModule.requestSpendPermission,
    },
  };
}

/**
 * Main SDK loader function
 */
export async function loadSDK(config: SDKLoaderConfig): Promise<LoadedSDK> {
  if (config.source === 'npm') {
    return loadFromNpm();
  } else {
    return loadFromLocal();
  }
}

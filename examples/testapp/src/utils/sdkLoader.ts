/**
 * Utility to dynamically load SDK from npm or use local workspace version
 */

export type SDKSource = 'local' | 'npm';

export interface SDKLoaderConfig {
  source: SDKSource;
  version?: string; // For npm source, e.g., "2.5.1" or "latest"
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
 * Load SDK from npm via CDN
 * Uses a hybrid approach: UMD bundle for core + ESM for Prolink/SpendPermission
 */
async function loadFromNpm(version: string = 'latest'): Promise<LoadedSDK> {
  // Use unpkg CDN to load the SDK
  const baseUrl = `https://unpkg.com/@base-org/account@${version}`;
  
  try {
    // Step 1: Load the main UMD bundle (proven to work)
    const mainModuleUrl = `${baseUrl}/dist/base-account.min.js`;
    console.log('[SDK Loader] Loading UMD bundle from unpkg:', mainModuleUrl);
    
    await loadScript(mainModuleUrl);
    
    // The SDK exposes functions directly on window and also as a UMD module
    const windowAny = window as any;
    
    // Check if the SDK loaded
    if (!windowAny.createBaseAccountSDK) {
      throw new Error('SDK not found on window after loading from CDN');
    }
    
    // The UMD module exposes everything under window.base
    const umdModule = windowAny.base;
    console.log('[SDK Loader] UMD bundle loaded successfully');
    
    // Step 2: Try to load Prolink functions via ESM (they're not in the UMD bundle)
    let prolinkModule: any = null;
    try {
      // Use esm.sh which handles complex packages well
      const prolinkUrl = `https://esm.sh/@base-org/account@${version}/prolink`;
      console.log('[SDK Loader] Attempting to load Prolink module from esm.sh:', prolinkUrl);
      prolinkModule = await import(/* @vite-ignore */ prolinkUrl);
      console.log('[SDK Loader] Prolink module loaded successfully');
    } catch (prolinkError) {
      console.warn('[SDK Loader] Prolink module not available from CDN:', prolinkError);
      // This is non-fatal - SDK still works without Prolink
    }
    
    // Step 3: Try to load Spend Permission functions via ESM
    let spendPermissionModule: any = null;
    try {
      const spendPermissionUrl = `https://esm.sh/@base-org/account@${version}/spend-permission`;
      console.log('[SDK Loader] Attempting to load Spend Permission module from esm.sh:', spendPermissionUrl);
      spendPermissionModule = await import(/* @vite-ignore */ spendPermissionUrl);
      console.log('[SDK Loader] Spend Permission module loaded successfully');
    } catch (spError) {
      console.warn('[SDK Loader] Spend Permission module not available from CDN:', spError);
      // This is non-fatal - SDK still works without Spend Permission
    }
    
    return {
      base: umdModule,
      createBaseAccountSDK: windowAny.createBaseAccountSDK,
      // Prolink functions from ESM module (if loaded)
      createProlinkUrl: prolinkModule?.createProlinkUrl || undefined,
      decodeProlink: prolinkModule?.decodeProlink || undefined,
      encodeProlink: prolinkModule?.encodeProlink || undefined,
      // getCryptoKeyAccount not available in npm CDN builds
      getCryptoKeyAccount: undefined,
      VERSION: windowAny.BaseAccountSDK?.VERSION || umdModule.VERSION || version,
      CHAIN_IDS: umdModule.CHAIN_IDS,
      TOKENS: umdModule.TOKENS,
      getPaymentStatus: umdModule.getPaymentStatus,
      getSubscriptionStatus: umdModule.getSubscriptionStatus,
      // Spend permission functions from ESM module (if loaded)
      spendPermission: {
        fetchPermission: spendPermissionModule?.fetchPermission || undefined,
        fetchPermissions: spendPermissionModule?.fetchPermissions || undefined,
        getHash: spendPermissionModule?.getHash || undefined,
        getPermissionStatus: spendPermissionModule?.getPermissionStatus || undefined,
        prepareRevokeCallData: spendPermissionModule?.prepareRevokeCallData || undefined,
        prepareSpendCallData: spendPermissionModule?.prepareSpendCallData || undefined,
        requestSpendPermission: spendPermissionModule?.requestSpendPermission || undefined,
      },
    };
  } catch (error) {
    console.error('[SDK Loader] Failed to load SDK from npm:', error);
    throw new Error(`Failed to load SDK from npm: ${error}`);
  }
}

/**
 * Load a script dynamically
 */
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Remove existing script if present
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      existingScript.remove();
    }
    
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

/**
 * Load SDK from local workspace (static import)
 */
async function loadFromLocal(): Promise<LoadedSDK> {
  // Dynamic import of local modules
  const mainModule = await import('@base-org/account');
  const spendPermissionModule = await import('@base-org/account/spend-permission');
  
  console.log('[SDK Loader] Local module loaded');
  console.log('[SDK Loader] mainModule keys:', Object.keys(mainModule));
  console.log('[SDK Loader] getCryptoKeyAccount available:', !!mainModule.getCryptoKeyAccount);
  console.log('[SDK Loader] getCryptoKeyAccount type:', typeof mainModule.getCryptoKeyAccount);
  
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
    return loadFromNpm(config.version);
  } else {
    return loadFromLocal();
  }
}

/**
 * Get available npm versions (fetch from npm registry)
 */
export async function getAvailableVersions(): Promise<string[]> {
  try {
    const response = await fetch('https://registry.npmjs.org/@base-org/account');
    const data = await response.json();
    const versions = Object.keys(data.versions).reverse(); // Most recent first
    return ['latest', ...versions.slice(0, 10)]; // Return latest + 10 most recent
  } catch (error) {
    console.error('Failed to fetch versions:', error);
    return ['latest', '2.5.1', '2.5.0', '2.4.0']; // Fallback versions
  }
}


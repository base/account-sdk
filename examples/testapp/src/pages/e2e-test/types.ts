/**
 * Type definitions for E2E Test Suite
 */

import type { EIP1193Provider } from 'viem';

// ============================================================================
// Test Status & Results Types
// ============================================================================

export type TestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';

export interface TestResult {
  name: string;
  status: TestStatus;
  error?: string;
  details?: string;
  duration?: number;
}

export interface TestCategory {
  name: string;
  tests: TestResult[];
  expanded: boolean;
}

export interface TestResults {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
}

// ============================================================================
// SDK Types
// ============================================================================

export interface BaseAccountSDK {
  getProvider: () => EIP1193Provider;
}

export interface PayOptions {
  amount: string;
  to: string;
  testnet?: boolean;
  token?: string;
}

export interface PayResult {
  id: string;
  status?: string;
}

export interface SubscribeOptions {
  recurringCharge: string;
  subscriptionOwner: string;
  periodInDays: number;
  testnet?: boolean;
  token?: string;
}

export interface SubscribeResult {
  id: string;
}

export interface PaymentStatus {
  status: string;
  [key: string]: unknown;
}

export interface SubscriptionStatus {
  isSubscribed: boolean;
  recurringCharge: string;
  remainingChargeInPeriod?: string;
  periodInDays?: number;
  nextPeriodStart?: Date;
  [key: string]: unknown;
}

export interface PrepareChargeOptions {
  id: string;
  amount: string | 'max-remaining-charge';
  testnet?: boolean;
}

export interface GetPaymentStatusOptions {
  id: string;
  testnet?: boolean;
  maxRetries?: number;
  retryDelayMs?: number;
}

export interface GetSubscriptionStatusOptions {
  id: string;
  testnet?: boolean;
}

export interface Call {
  to: string;
  data: string;
  value?: string;
}

export interface SpendPermission {
  account: string;
  spender: string;
  token: string;
  allowance: bigint;
  period: number;
  start: number;
  end: number;
  salt: bigint;
  extraData: string;
  chainId: number;
  permissionHash?: string;
}

export interface RequestSpendPermissionOptions {
  provider: EIP1193Provider;
  account: string;
  spender: string;
  token: string;
  chainId: number;
  allowance: bigint;
  periodInDays: number;
}

export interface RequestSpendPermissionResult {
  permissionHash: string;
  permission: SpendPermission;
}

export interface PermissionStatus {
  remainingSpend: string;
  [key: string]: unknown;
}

export interface FetchPermissionsOptions {
  provider: EIP1193Provider;
  account: string;
  spender: string;
  chainId: number;
}

// Using a more flexible approach for LoadedSDK to match actual SDK exports
// We use 'any' strategically here because the SDK has complex types that vary
// between local and npm versions. Tests will validate actual behavior.
export interface LoadedSDK {
  base: any; // Actual type varies, includes pay, subscribe, subscription methods
  createBaseAccountSDK: (config: SDKConfig) => any; // Returns SDK instance with getProvider
  createProlinkUrl?: (encoded: string) => string;
  decodeProlink?: (encoded: string) => Promise<any>;
  encodeProlink?: (request: any) => Promise<string>;
  getCryptoKeyAccount?: () => Promise<{ account: any }>; // Only available in local SDK
  VERSION: string;
  CHAIN_IDS: Record<string, number>;
  TOKENS: Record<string, any>;
  getPaymentStatus: (options: any) => Promise<any>;
  getSubscriptionStatus?: (options: any) => Promise<any>;
  spendPermission?: {
    fetchPermission: (options: { permissionHash: string }) => Promise<any>;
    fetchPermissions: (options: any) => Promise<any[]>;
    getHash?: (permission: any) => Promise<string>;
    getPermissionStatus: (permission: any) => Promise<any>;
    prepareRevokeCallData: (permission: any) => Promise<any>;
    prepareSpendCallData: (permission: any, amount: bigint | string, recipient?: string) => Promise<any>;
    requestSpendPermission: (options: any) => Promise<any>;
  };
}

export interface SDKConfig {
  appName: string;
  appLogoUrl?: string;
  appChainIds: number[];
  preference?: {
    walletUrl?: string;
    attribution?: any;
    telemetry?: boolean;
  };
}

export interface CryptoKeyAccount {
  address: string;
  publicKey?: string;
  type?: string;
}

// ============================================================================
// SDK Loader Types
// ============================================================================

export type SDKSource = 'local' | 'npm';

export interface SDKLoaderConfig {
  source: SDKSource;
}

// ============================================================================
// Test Context & Handler Types
// ============================================================================

export interface TestContext {
  provider: EIP1193Provider;
  loadedSDK: LoadedSDK;
  connected: boolean;
  currentAccount: string | null;
  chainId: number | null;
  // Shared test data
  paymentId: string | null;
  subscriptionId: string | null;
  permissionHash: string | null;
  subAccountAddress: string | null;
  // Configuration
  skipModal: boolean;
  walletUrl?: string;
}

export interface TestHandlers {
  updateTestStatus: (
    category: string,
    testName: string,
    status: TestStatus,
    error?: string,
    details?: string,
    duration?: number
  ) => void;
  requestUserInteraction?: (testName: string, skipModal?: boolean) => Promise<void>;
}

export interface TestConfig {
  category: string;
  name: string;
  requiresProvider?: boolean;
  requiresSDK?: boolean;
  requiresConnection?: boolean;
  requiresUserInteraction?: boolean;
}

export interface TestFunction<T = unknown> {
  (context: TestContext): Promise<T>;
}

// ============================================================================
// Format Results Types
// ============================================================================

export type ResultFormat = 'full' | 'abbreviated' | 'section';

export interface FormatOptions {
  format: ResultFormat;
  categoryName?: string; // For section format
  sdkInfo: {
    version: string;
    source: string;
  };
}

// ============================================================================
// Header Props Types
// ============================================================================

export interface HeaderProps {
  sdkVersion: string;
  sdkSource: SDKSource;
  onSourceChange: (source: SDKSource) => void;
  isLoadingSDK?: boolean;
}


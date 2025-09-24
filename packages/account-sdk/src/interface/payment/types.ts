import type { Address, Hex } from 'viem';

/**
 * Information request type for payment data callbacks
 */
export interface InfoRequest {
  /** The type of information being requested */
  type: 'email' | 'physicalAddress' | 'phoneNumber' | 'name' | 'onchainAddress' | string;
  /** Whether this information is optional */
  optional?: boolean;
}

/**
 * Information responses collected from info requests
 */
export interface PayerInfoResponses {
  /** User's email address */
  email?: string;
  /** User's physical address */
  physicalAddress?: {
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    countryCode: string;
    name?: {
      firstName: string;
      familyName: string;
    };
  };
  /** User's phone number */
  phoneNumber?: {
    number: string;
    country: string;
  };
  /** User's name */
  name?: {
    firstName: string;
    familyName: string;
  };
  /** User's on-chain address */
  onchainAddress?: string;
}

/**
 * Payer information configuration for payment data callbacks
 */
export interface PayerInfo {
  /** Information requests from the payer */
  requests: InfoRequest[];
  /** Callback URL for sending the payer information */
  callbackURL?: string;
}

/**
 * Options for making a payment
 */
export interface PaymentOptions {
  /** Amount of USDC to send as a string (e.g., "10.50") */
  amount: string;
  /** Ethereum address to send payment to */
  to: string;
  /** Whether to use testnet (Base Sepolia). Defaults to false (mainnet) */
  testnet?: boolean;
  /** Optional payer information configuration for data callbacks */
  payerInfo?: PayerInfo;
  walletUrl?: string;
  /** Whether to enable telemetry logging. Defaults to true */
  telemetry?: boolean;
}

/**
 * Successful payment result
 */
export interface PaymentSuccess {
  success: true;
  /** Transaction ID (hash) of the payment */
  id: string;
  /** The amount that was sent */
  amount: string;
  /** The address that received the payment */
  to: Address;
  /** Optional responses from information requests */
  payerInfoResponses?: PayerInfoResponses;
}

/**
 * Result of a payment transaction
 */
export type PaymentResult = PaymentSuccess;

/**
 * Options for checking payment status
 */
export interface PaymentStatusOptions {
  /** Transaction ID (userOp hash) to check status for */
  id: string;
  /** Whether to check on testnet (Base Sepolia). Defaults to false (mainnet) */
  testnet?: boolean;
  /** Whether to enable telemetry logging. Defaults to true */
  telemetry?: boolean;
}

/**
 * Possible payment status types
 */
export type PaymentStatusType = 'pending' | 'completed' | 'failed' | 'not_found';

/**
 * Payment status information
 */
export interface PaymentStatus {
  /** Current status of the payment */
  status: PaymentStatusType;
  /** Transaction ID that was checked */
  id: Hex;
  /** Human-readable message about the status */
  message: string;

  // Additional fields that may be present depending on status
  /** Sender address (present for pending, completed, and failed) */
  sender?: string;
  /** Amount sent (present for completed transactions, parsed from logs) */
  amount?: string;
  /** Recipient address (present for completed transactions, parsed from logs) */
  recipient?: string;
  /** Reason for transaction failure (present for failed status - describes why the transaction failed on-chain) */
  reason?: string;
}

/**
 * Options for creating a subscription
 */
export interface SubscriptionOptions {
  /** Amount of USDC to charge per period as a string (e.g., "10.50") */
  recurringCharge: string;
  /** Ethereum address that will be the spender (your application's address) */
  subscriptionOwner: string;
  /** The period in days for the subscription (e.g., 30 for monthly) */
  periodInDays?: number;
  /**
   * TEST ONLY: The period in seconds for the subscription.
   * ⚠️ WARNING: This parameter is ONLY available when testnet is true.
   * Using this in production (testnet=false) will throw an error.
   * This is intended for testing shorter subscription periods on testnet.
   * @testOnly
   */
  periodInSeconds?: number;
  /** Whether to use testnet (Base Sepolia). Defaults to false (mainnet) */
  testnet?: boolean;
  /** Optional wallet URL to use */
  walletUrl?: string;
  /** Whether to enable telemetry logging. Defaults to true */
  telemetry?: boolean;
}

/**
 * Successful subscription result
 */
export interface SubscriptionResult {
  /** The subscription ID (permission hash) */
  id: string;
  /** The address that owns/controls the subscription (your application) */
  subscriptionOwner: Address;
  /** The address that will be charged (the user's wallet) */
  subscriptionPayer: Address;
  /** The recurring charge amount (USD denoted e.g. "9.99") */
  recurringCharge: string;
  /** The period in days for the subscription */
  periodInDays: number;
  /**
   * TEST ONLY: The period in seconds if specified on testnet
   * Only present when using periodInSeconds on testnet
   */
  periodInSeconds?: number;
}

/**
 * Options for checking subscription status
 */
export interface SubscriptionStatusOptions {
  /** The subscription ID (permission hash) to check status for */
  id: string;
  /** Whether to check on testnet (Base Sepolia). Defaults to false (mainnet) */
  testnet?: boolean;
}

/**
 * Subscription status information
 */
export interface SubscriptionStatus {
  /** Whether the user has an active (non-revoked) subscription */
  isSubscribed: boolean;
  /** The recurring charge amount in USD (e.g., "9.99") */
  recurringCharge: string;
  /** Remaining amount that can be charged in the current period in USD */
  remainingChargeInPeriod?: string;
  /** Start of the current period */
  currentPeriodStart?: Date;
  /** Start date of the next payment period (only available if subscription is active) */
  nextPeriodStart?: Date;
  /** The subscription period in days */
  periodInDays?: number;
  /** The wallet address of the account that owns this subscription */
  subscriptionOwner?: string;
}

/**
 * Options for preparing subscription charge call data
 */
export interface PrepareChargeOptions {
  /** The subscription ID (permission hash) */
  id: string;
  /** Amount of USDC to charge as a string (e.g., "10.50") or 'max-remaining-charge' */
  amount: string | 'max-remaining-charge';
  /** Whether to use testnet (Base Sepolia). Defaults to false (mainnet) */
  testnet?: boolean;
  /** Optional recipient address to receive the charged USDC */
  recipient?: Address;
}

/**
 * Call data for approving and/or spending from a subscription
 */
export interface PrepareChargeCall {
  /** The address to call */
  to: Address;
  /** The encoded call data */
  data: Hex;
  /** The value to send (always 0n for spend permissions) */
  value: bigint;
}

/**
 * Result of preparing subscription charge call data
 */
export type PrepareChargeResult = PrepareChargeCall[];

/**
 * Options for getting or creating a subscription owner smart account
 */
export interface GetOrCreateSubscriptionOwnerWalletOptions {
  /** CDP API key ID. Falls back to CDP_API_KEY_ID env var */
  cdpApiKeyId?: string;
  /** CDP API key secret. Falls back to CDP_API_KEY_SECRET env var */
  cdpApiKeySecret?: string;
  /** CDP wallet secret. Falls back to CDP_WALLET_SECRET env var */
  cdpWalletSecret?: string;
  /** Custom wallet name. Defaults to "subscription owner" */
  walletName?: string;
  /** Whether to use testnet (Base Sepolia). Defaults to false (mainnet) */
  testnet?: boolean;
}

/**
 * Result from getting or creating a subscription owner smart account
 */
export interface GetOrCreateSubscriptionOwnerWalletResult {
  /** The Ethereum address of the subscription owner smart account */
  address: Address;
  /** The name of the wallet */
  walletName: string;
  /** The EOA address that owns the smart account (for reference) */
  eoaAddress?: Address;
}

/**
 * Options for charging a subscription
 */
export interface ChargeOptions extends PrepareChargeOptions {
  /** CDP API key ID. Falls back to CDP_API_KEY_ID env var */
  cdpApiKeyId?: string;
  /** CDP API key secret. Falls back to CDP_API_KEY_SECRET env var */
  cdpApiKeySecret?: string;
  /** CDP wallet secret. Falls back to CDP_WALLET_SECRET env var */
  cdpWalletSecret?: string;
  /** Custom wallet name. Defaults to "subscription owner" */
  walletName?: string;
  /** Paymaster URL for transaction sponsorship. Falls back to PAYMASTER_URL env var */
  paymasterUrl?: string;
}

/**
 * Result of charging a subscription
 */
export interface ChargeResult {
  /** Whether the charge was successful */
  success: true;
  /** Transaction ID (hash) of the charge */
  id: string;
  /** The subscription ID that was charged */
  subscriptionId: string;
  /** The amount that was charged */
  amount: string;
  /** The address that executed the charge (subscription owner) */
  subscriptionOwner: Address;
  /** The recipient address that received the USDC (if specified) */
  recipient?: Address;
}

/**
 * Internal type for payment execution result
 */

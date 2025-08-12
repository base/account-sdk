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
 * Internal type for payment execution result
 */

import type { Address, Hex } from 'viem';

/**
 * Information request type for payment data callbacks
 */
export interface InfoRequest {
  /** The type of information being requested */
  request: 'email' | 'physicalAddress' | 'phoneNumber' | 'name' | 'onchainAddress' | string;
  /** Whether this information is optional */
  optional?: boolean;
}

/**
 * Information responses collected from info requests
 */
export interface InfoResponses {
  /** User's email address */
  email?: string;
  /** User's physical address */
  physicalAddress?: string;
  /** User's phone number */
  phoneNumber?: {
    number: string;
    country: string;
  };
  /** User's name */
  name?: string;
  /** User's on-chain address */
  onchainAddress?: string;
}

/**
 * Options for making a payment
 */
export interface PaymentOptions {
  /** Amount of USDC to send as a string (e.g., "10.50") */
  amount: string;
  /** Ethereum address or ENS name of the recipient */
  recipient: string;
  /** Whether to use testnet (Base Sepolia). Defaults to false (mainnet) */
  testnet?: boolean;
  /** Optional information requests for data callbacks */
  infoRequests?: InfoRequest[];
}

/**
 * Result of a payment transaction
 */
export interface PaymentResult {
  /** Whether the payment was initiated successfully */
  success: boolean;
  /** The transaction hash (userOp hash) if successful */
  id?: Hex;
  /** Error message if payment failed */
  error?: string;
  /** The amount that was attempted to be sent */
  amount: string;
  /** The recipient address (resolved from ENS if applicable) */
  recipient: Address;
  /** Information responses collected from info requests (if any) */
  infoResponses?: InfoResponses;
}

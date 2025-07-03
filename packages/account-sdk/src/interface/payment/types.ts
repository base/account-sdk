import type { Address, Hex } from 'viem';

/**
 * Options for making a payment
 */
export interface PaymentOptions {
  /** Amount of USDC to send as a string (e.g., "10.50") */
  amount: string;
  /** Ethereum address of the recipient */
  recipient: string;
  /** Whether to use testnet (Base Sepolia). Defaults to false (mainnet) */
  testnet?: boolean;
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
  /** The recipient address */
  recipient: Address;
}

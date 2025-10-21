// Copyright (c) 2018-2025 Coinbase, Inc. <https://www.coinbase.com/>

/**
 * High-level utilities for creating prolink URIs
 */

import { encodeFunctionData, type Address, type Hex, type TypedDataDefinition } from 'viem';
import { encodeProlink } from './index.js';

// ERC20 transfer ABI
const ERC20_TRANSFER_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
] as const;

/**
 * Options for creating a payment prolink
 */
export type CreateProlinkForPaymentOptions = {
  /** Recipient address */
  recipient: Address;
  /** Amount in smallest unit (wei for native, token units for ERC20) */
  amount: bigint;
  /** Chain ID */
  chainId: number;
  /** Token address (omit for native transfer) */
  token?: Address;
  /** Sender address (optional) */
  from?: Address;
  /** Additional capabilities */
  capabilities?: Record<string, unknown>;
};

/**
 * Options for creating a sign prolink
 */
export type CreateProlinkForSignOptions = {
  /** EIP-712 typed data */
  typedData: TypedDataDefinition;
  /** Chain ID */
  chainId: number;
  /** RPC version (optional, defaults to "1") */
  version?: string;
  /** Additional capabilities */
  capabilities?: Record<string, unknown>;
};

/**
 * Options for creating a calls prolink
 */
export type CreateProlinkForCallsOptions = {
  /** Array of calls to execute */
  calls: Array<{
    to: Address;
    data?: Hex;
    value?: bigint;
  }>;
  /** Chain ID */
  chainId: number;
  /** Sender address (optional) */
  from?: Address;
  /** RPC version (optional, defaults to "1.0") */
  version?: string;
  /** Additional capabilities */
  capabilities?: Record<string, unknown>;
};

/**
 * Validate an Ethereum address
 */
function validateAddress(address: string, fieldName: string): void {
  if (!address.match(/^0x[0-9a-fA-F]{40}$/)) {
    throw new Error(`${fieldName} must be a valid Ethereum address (0x followed by 40 hex chars)`);
  }
}

/**
 * Validate amount is non-negative
 */
function validateAmount(amount: bigint, fieldName: string): void {
  if (amount < 0n) {
    throw new Error(`${fieldName} must be non-negative`);
  }
}

/**
 * Create a prolink URI for a payment (native or ERC20 transfer)
 *
 * @param options - Payment options
 * @returns Base64url-encoded prolink payload
 *
 * @example
 * ```typescript
 * // Native transfer (ETH)
 * const uri = await createProlinkForPayment({
 *   recipient: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
 *   amount: 100000000000000000n, // 0.1 ETH in wei
 *   chainId: 8453, // Base
 * });
 *
 * // ERC20 transfer (USDC)
 * const uri = await createProlinkForPayment({
 *   token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
 *   recipient: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
 *   amount: 1000000n, // 1 USDC (6 decimals)
 *   chainId: 8453, // Base
 * });
 * ```
 */
export async function createProlinkForPayment(
  options: CreateProlinkForPaymentOptions
): Promise<string> {
  const { recipient, amount, chainId, token, from, capabilities } = options;

  // Validate inputs
  validateAddress(recipient, 'recipient');
  validateAmount(amount, 'amount');
  if (token) {
    validateAddress(token, 'token');
  }
  if (from) {
    validateAddress(from, 'from');
  }

  // Build the call based on transfer type
  let call: { to: Address; data: Hex; value: string };

  if (token) {
    // ERC20 transfer
    const data = encodeFunctionData({
      abi: ERC20_TRANSFER_ABI,
      functionName: 'transfer',
      args: [recipient, amount],
    });

    call = {
      to: token,
      data,
      value: '0x0',
    };
  } else {
    // Native transfer
    call = {
      to: recipient,
      data: '0x',
      value: `0x${amount.toString(16)}`,
    };
  }

  // Build wallet_sendCalls params
  const sendCallsParams: Record<string, unknown> = {
    version: '1.0',
    chainId: `0x${chainId.toString(16)}`,
    calls: [call],
  };

  if (from) {
    sendCallsParams.from = from;
  }

  if (capabilities && Object.keys(capabilities).length > 0) {
    sendCallsParams.capabilities = capabilities;
  }

  // Encode to prolink
  return encodeProlink({
    method: 'wallet_sendCalls',
    params: [sendCallsParams],
    chainId,
    capabilities,
  });
}

/**
 * Create a prolink URI for signing typed data (EIP-712)
 *
 * @param options - Sign options
 * @returns Base64url-encoded prolink payload
 *
 * @example
 * ```typescript
 * const uri = await createProlinkForSign({
 *   typedData: {
 *     domain: {
 *       name: 'MyApp',
 *       version: '1',
 *       chainId: 8453,
 *       verifyingContract: '0x...',
 *     },
 *     types: {
 *       Message: [
 *         { name: 'content', type: 'string' },
 *       ],
 *     },
 *     primaryType: 'Message',
 *     message: {
 *       content: 'Hello World',
 *     },
 *   },
 *   chainId: 8453,
 * });
 * ```
 */
export async function createProlinkForSign(options: CreateProlinkForSignOptions): Promise<string> {
  const { typedData, chainId, version = '1', capabilities } = options;

  // Validate typed data has required fields
  if (!typedData.types || !typedData.domain || !typedData.message) {
    throw new Error('typedData must include types, domain, and message');
  }

  // Build wallet_sign params
  const signParams: Record<string, unknown> = {
    version,
    chainId: `0x${chainId.toString(16)}`,
    type: '0x01', // EIP-712 typed data
    data: typedData,
  };

  // Encode to prolink
  return encodeProlink({
    method: 'wallet_sign',
    params: [signParams],
    chainId,
    capabilities,
  });
}

/**
 * Create a prolink URI for generic contract calls
 *
 * @param options - Calls options
 * @returns Base64url-encoded prolink payload
 *
 * @example
 * ```typescript
 * const uri = await createProlinkForCalls({
 *   calls: [
 *     {
 *       to: '0x...',
 *       data: '0xa9059cbb...',
 *       value: 0n,
 *     },
 *   ],
 *   chainId: 8453,
 * });
 * ```
 */
export async function createProlinkForCalls(
  options: CreateProlinkForCallsOptions
): Promise<string> {
  const { calls, chainId, from, version = '1.0', capabilities } = options;

  // Validate inputs
  if (!calls || calls.length === 0) {
    throw new Error('calls must be a non-empty array');
  }

  for (const call of calls) {
    validateAddress(call.to, 'call.to');
    if (call.value !== undefined) {
      validateAmount(call.value, 'call.value');
    }
  }

  if (from) {
    validateAddress(from, 'from');
  }

  // Normalize calls to expected format
  const normalizedCalls = calls.map((call) => ({
    to: call.to,
    data: call.data || '0x',
    value: call.value !== undefined ? `0x${call.value.toString(16)}` : '0x0',
  }));

  // Build wallet_sendCalls params
  const sendCallsParams: Record<string, unknown> = {
    version,
    chainId: `0x${chainId.toString(16)}`,
    calls: normalizedCalls,
  };

  if (from) {
    sendCallsParams.from = from;
  }

  if (capabilities && Object.keys(capabilities).length > 0) {
    sendCallsParams.capabilities = capabilities;
  }

  // Encode to prolink
  return encodeProlink({
    method: 'wallet_sendCalls',
    params: [sendCallsParams],
    chainId,
    capabilities,
  });
}

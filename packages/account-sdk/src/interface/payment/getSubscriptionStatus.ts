import { spendPermissionManagerAddress } from ':sign/base-account/utils/constants.js';
import { createPublicClient, formatUnits, http, type Hex } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { fetchPermission, getPermissionStatus } from '../public-utilities/spend-permission/index.js';
import { CHAIN_IDS, TOKENS } from './constants.js';
import type { SubscriptionStatus, SubscriptionStatusOptions } from './types.js';

/**
 * Helper function to get the last payment information from on-chain logs
 */
async function getLastPaymentFromLogs(
  permissionHash: Hex,
  chainId: number,
  fromBlock?: bigint
): Promise<{
  txHash: Hex;
  blockNumber: bigint;
  timestamp: number;
  amount: bigint;
  periodStart: bigint;
  periodEnd: bigint;
} | null> {
  // Create a public client for the appropriate chain
  const chain = chainId === CHAIN_IDS.baseSepolia ? baseSepolia : base;
  const client = createPublicClient({
    chain,
    transport: http(),
  });

  try {
    // Query SpendPermissionUsed events for this permission hash
    const logs = await client.getLogs({
      address: spendPermissionManagerAddress,
      event: {
        type: 'event',
        name: 'SpendPermissionUsed',
        inputs: [
          { type: 'bytes32', name: 'hash', indexed: true },
          { type: 'address', name: 'account', indexed: true },
          { type: 'address', name: 'spender', indexed: true },
          { type: 'address', name: 'token', indexed: false },
          { 
            type: 'tuple', 
            name: 'periodSpend', 
            indexed: false,
            components: [
              { type: 'uint48', name: 'start' },
              { type: 'uint48', name: 'end' },
              { type: 'uint160', name: 'spend' }
            ]
          },
        ],
      } as any,
      args: { hash: permissionHash },
      fromBlock: fromBlock || 'earliest',
      toBlock: 'latest',
    });

    if (!logs.length) {
      return null;
    }

    // Get the most recent log
    const lastLog = logs[logs.length - 1];
    
    // Get block timestamp
    const block = await client.getBlock({ 
      blockHash: lastLog.blockHash! 
    });

    return {
      txHash: lastLog.transactionHash!,
      blockNumber: lastLog.blockNumber!,
      timestamp: Number(block.timestamp),
      amount: (lastLog as any).args.periodSpend.spend as bigint,
      periodStart: (lastLog as any).args.periodSpend.start as bigint,
      periodEnd: (lastLog as any).args.periodSpend.end as bigint,
    };
  } catch (error) {
    console.error('Error fetching payment logs:', error);
    return null;
  }
}

/**
 * Gets the current status and details of a subscription.
 * 
 * This function fetches the subscription (spend permission) details using its ID (permission hash)
 * and returns comprehensive status information including payment history and upcoming charges.
 * 
 * @param options - Options for checking subscription status
 * @param options.id - The subscription ID (permission hash) returned from subscribe()
 * @param options.testnet - Whether to check on testnet (Base Sepolia). Defaults to false (mainnet)
 * @returns Promise<SubscriptionStatus> - Detailed subscription status information
 * @throws Error if the subscription cannot be found or if fetching fails
 * 
 * @example
 * ```typescript
 * import { getSubscriptionStatus } from '@base-org/account/payment';
 * 
 * // Check status of a subscription using its ID
 * const status = await getSubscriptionStatus({
 *   id: '0x71319cd488f8e4f24687711ec5c95d9e0c1bacbf5c1064942937eba4c7cf2984',
 *   testnet: false
 * });
 * 
 * console.log(`Subscribed: ${status.isSubscribed}`);
 * console.log(`Next payment: ${status.nextPeriodStart}`);
 * console.log(`Recurring amount: $${status.recurringAmount}`);
 * 
 * if (status.lastPaymentDate) {
 *   console.log(`Last payment: $${status.lastPaymentAmount} on ${status.lastPaymentDate}`);
 * }
 * ```
 */
export async function getSubscriptionStatus(
  options: SubscriptionStatusOptions
): Promise<SubscriptionStatus> {
  const { id, testnet = false } = options;

  try {
    // First, try to fetch the permission details using the hash
    const permission = await fetchPermission({
      permissionHash: id,
    });

    // If no permission found in the indexer, try to infer status from on-chain data
    if (!permission) {
      // Check if there are any on-chain logs for this permission
      const expectedChainId = testnet ? CHAIN_IDS.baseSepolia : CHAIN_IDS.base;
      const lastPayment = await getLastPaymentFromLogs(id as Hex, expectedChainId);
      
      if (!lastPayment) {
        // No permission found and no on-chain activity
        // This could mean:
        // 1. The subscription doesn't exist
        // 2. The subscription was just created but never used
        // For now, we return as not subscribed
        return {
          isSubscribed: false,
          recurringAmount: '0',
        };
      }

      // We found on-chain activity but no permission in indexer
      // This is an edge case - return what we can from the logs
      const paymentAmount = formatUnits(lastPayment.amount, 6);
      return {
        isSubscribed: false, // Can't determine without permission details
        lastPaymentDate: new Date(lastPayment.timestamp * 1000),
        lastPaymentAmount: paymentAmount,
        lastPaymentTxHash: lastPayment.txHash,
        recurringAmount: paymentAmount, // Assume last payment is the recurring amount
        hasBeenUsed: true,
        isUnusedSubscription: false,
      };
    }

    // Validate this is a USDC permission on Base/Base Sepolia
    const expectedChainId = testnet ? CHAIN_IDS.baseSepolia : CHAIN_IDS.base;
    const expectedTokenAddress = testnet 
      ? TOKENS.USDC.addresses.baseSepolia.toLowerCase()
      : TOKENS.USDC.addresses.base.toLowerCase();

    if (permission.chainId !== expectedChainId) {
      throw new Error(
        `Subscription is on chain ${permission.chainId}, expected ${expectedChainId} (${testnet ? 'Base Sepolia' : 'Base'})`
      );
    }

    if (permission.permission.token.toLowerCase() !== expectedTokenAddress) {
      throw new Error(
        `Subscription is not for USDC token. Got ${permission.permission.token}, expected ${expectedTokenAddress}`
      );
    }

    // Get the current permission status (includes period info and active state)
    const [status, lastPaymentLog] = await Promise.all([
      getPermissionStatus(permission),
      getLastPaymentFromLogs(id as Hex, permission.chainId)
    ]);

    // Get the period in seconds for calculations
    const periodInSeconds = Number(permission.permission.period);

    // Format the allowance amount from wei to USD string (USDC has 6 decimals)
    const recurringAmount = formatUnits(BigInt(permission.permission.allowance), 6);

    // Determine last payment info
    let lastPaymentDate: Date | undefined;
    let lastPaymentAmount: string | undefined;
    
    if (lastPaymentLog) {
      // Use actual on-chain data if available
      lastPaymentDate = new Date(lastPaymentLog.timestamp * 1000);
      lastPaymentAmount = formatUnits(lastPaymentLog.amount, 6);
    } else {
      // Fall back to calculating based on permission timing
      const currentTime = Math.floor(Date.now() / 1000);
      const periodStart = Number(permission.permission.start);
      
      if (currentTime >= periodStart) {
        // We're within the permission timeframe
        // Calculate the start of the current period
        const periodsSinceStart = Math.floor((currentTime - periodStart) / periodInSeconds);
        
        if (periodsSinceStart > 0) {
          // There has been at least one previous period (but no actual payment found)
          // This means the subscription exists but hasn't been charged yet
          // Don't set lastPaymentDate/Amount since no actual payment occurred
        }
      }
    }

    // A subscription is considered active if:
    // 1. The permission is active (not revoked and valid)
    // 2. We're within the permission's time bounds
    const currentTime = Math.floor(Date.now() / 1000);
    const isSubscribed = status.isActive && 
                        currentTime >= Number(permission.permission.start) &&
                        currentTime <= Number(permission.permission.end);

    // Special case: If the subscription is active but no payments have been made yet
    // This indicates a newly created subscription that hasn't had its first charge
    if (isSubscribed && !lastPaymentLog) {
      // The subscription is active but unused
      return {
        isSubscribed: true,
        lastPaymentDate: undefined,
        lastPaymentAmount: undefined,
        lastPaymentTxHash: undefined,
        nextPeriodStart: status.nextPeriodStart,
        recurringAmount,
        hasBeenUsed: false,
        isUnusedSubscription: true,
      };
    }

    return {
      isSubscribed,
      lastPaymentDate,
      lastPaymentAmount,
      lastPaymentTxHash: lastPaymentLog?.txHash,
      nextPeriodStart: status.nextPeriodStart,
      recurringAmount,
      hasBeenUsed: !!lastPaymentLog,
      isUnusedSubscription: false,
    };
  } catch (error) {
    // If we can't fetch the permission, it likely doesn't exist
    console.error('Error fetching subscription status:', error);
    return {
      isSubscribed: false,
      recurringAmount: '0',
    };
  }
}

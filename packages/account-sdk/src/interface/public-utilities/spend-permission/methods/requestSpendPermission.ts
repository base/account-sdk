import { SpendPermission } from ':core/rpc/coinbase_fetchSpendPermissions.js';

import { ProviderInterface } from ':core/provider/interface.js';
import { createSpendPermissionTypedData, dateToTimestampInSeconds } from '../utils.js';
import { getHash } from './getHash.js';

export type RequestSpendPermissionType = {
  account: string;
  spender: string;
  token: string;
  chainId: number;
  allowance: bigint; // in wei
  periodInDays: number;
  start?: Date; // default to now
  end?: Date; // default to never
  salt?: string; // default to a random value by crypto.getRandomValues
  extraData?: string; // default to '0x'
};

/**
 * Requests user approval to create a new spend permission.
 *
 * This helper method opens a prompt to ask the user to sign a spend permission.
 * To learn more about spend permissions, see the [Spend Permission documentation](https://docs.base.org/base-account/improve-ux/spend-permissions).
 *
 * The method uses EIP-712 typed data signing to create a cryptographically secure
 * permission that can be verified on-chain. The resulting permission object contains
 * the signature and all necessary data for later use.
 *
 * @param request - Configuration object containing all permission parameters.
 * @param provider - The provider interface used to make the eth_signTypedData_v4 request.
 *
 * @returns A promise that resolves to a SpendPermission object containing the signature and permission details.
 *
 * @example
 * ```typescript
 * import { requestSpendPermission } from '@base-org/account/spend-permission';
 *
 * // Request approval for a spend permission
 * const permission = await requestSpendPermission({
 *   provider, // Base Account Provider
 *   account: '0x1234...',
 *   spender: '0x5678...',
 *   token: '0xabcd...', // USDC address
 *   chainId: 8453, // Base mainnet
 *   allowance: parseUnits('100', 6), // 100 USDC
 *   periodInDays: 30, // Monthly allowance
 * });
 *
 * console.log('Permission created:', permission.signature);
 * ```
 */
export const requestSpendPermission = async (
  request: RequestSpendPermissionType & { provider: ProviderInterface }
): Promise<SpendPermission> => {
  const { provider, account, chainId } = request;

  const typedData = createSpendPermissionTypedData(request);

  const [signature, permissionHash] = await Promise.all([
    provider.request({
      method: 'eth_signTypedData_v4',
      params: [account, typedData],
    }) as Promise<string>,
    getHash({ permission: typedData.message, chainId }),
  ]);

  const permission: SpendPermission = {
    createdAt: dateToTimestampInSeconds(new Date()),
    permissionHash,
    signature,
    chainId,
    permission: typedData.message,
  };

  return permission;
};

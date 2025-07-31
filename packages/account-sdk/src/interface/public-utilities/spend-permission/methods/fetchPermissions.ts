import { ProviderInterface } from ':core/provider/interface.js';
import {
  FetchPermissionsResponse,
  SpendPermission,
} from ':core/rpc/coinbase_fetchSpendPermissions.js';

type FetchPermissionsType = {
  account: string;
  chainId: number;
  spender: string;
};

/**
 * Fetches existing spend permissions for a specific account, spender, and chain.
 *
 * This helper method retrieves all spend permissions that have been granted by a specific
 * account to a specific spender on a given chain. This is useful for checking existing
 * permissions before creating new ones, or for displaying current allowances to users.
 *
 * The method uses the coinbase_fetchPermissions RPC method to query the permissions
 * from the backend service.
 *
 * @param request - Configuration object containing account, chainId, and spender to query.
 * @param provider - The provider interface used to make the coinbase_fetchPermissions request.
 *
 * @returns A promise that resolves to an array of SpendPermission objects.
 *
 * @example
 * ```typescript
 * import { fetchPermissions } from '@base-org/account/spend-permission';
 *
 * // Fetch all permissions for an account-spender pair
 * const permissions = await fetchPermissions({
 *   account: '0x1234...',
 *   spender: '0x5678...',
 *   chainId: 8453 // Base mainnet
 * }, provider);
 *
 * console.log(`Found ${permissions.length} permissions`);
 * permissions.forEach(permission => {
 *   console.log(`Token: ${permission.permission.token}`);
 * });
 * ```
 */
export const fetchPermissions = async (
  request: FetchPermissionsType,
  provider: ProviderInterface
): Promise<SpendPermission[]> => {
  const { account, chainId, spender } = request;

  const response = (await provider.request({
    method: 'coinbase_fetchPermissions',
    params: [
      {
        account,
        chainId: `0x${chainId.toString(16)}`,
        spender,
      },
    ],
  })) as FetchPermissionsResponse;

  return response.permissions;
};

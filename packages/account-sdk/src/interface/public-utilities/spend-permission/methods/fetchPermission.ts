import {
    FetchPermissionResponse,
} from ':core/rpc/coinbase_fetchSpendPermission.js';
import { SpendPermission } from ':core/rpc/coinbase_fetchSpendPermissions.js';
import { fetchRPCRequest } from '../utils.js';
import { withTelemetry } from '../withTelemetry.js';

type FetchPermissionType = {
  permissionHash: string;
};

/**
 * Fetches a single spend permission by its hash.
 *
 * This helper method retrieves a specific spend permission using its unique hash identifier.
 * This is useful when you have a permission hash from a previous operation and need to
 * fetch the full permission details. This helper is for the browser environment.
 * For node environment or server side, use the `fetchPermission` method from the 
 * `@base-org/account/spend-permission/node` package.
 *
 * The method uses coinbase_fetchPermission RPC method to query the permission
 * from the backend service directly without requiring a provider.
 *
 * @param params - The parameters for the fetchPermission method.
 * @param params.permissionHash - The hash of the permission to fetch.
 *
 * @returns A promise that resolves to a SpendPermission object.
 *
 * @example
 * ```typescript
 * import { fetchPermission } from '@base-org/account/spend-permission';
 *
 * // Fetch a specific permission by its hash
 * const permission = await fetchPermission({
 *   permissionHash: '0x71319cd488f8e4f24687711ec5c95d9e0c1bacbf5c1064942937eba4c7cf2984'
 * });
 *
 * console.log(`Token: ${permission.permission.token}`);
 * console.log(`Spender: ${permission.permission.spender}`);
 * console.log(`Allowance: ${permission.permission.allowance}`);
 * ```
 */
const fetchPermissionFn = async ({
  permissionHash,
}: FetchPermissionType): Promise<SpendPermission> => {
  const response = (await fetchRPCRequest(
    {
      method: 'coinbase_fetchPermission',
      params: [
        {
          permissionHash,
        },
      ],
    },
    'https://rpc.wallet.coinbase.com/'
  )) as FetchPermissionResponse;

  return response.permission;
};

export const fetchPermission = withTelemetry(fetchPermissionFn);

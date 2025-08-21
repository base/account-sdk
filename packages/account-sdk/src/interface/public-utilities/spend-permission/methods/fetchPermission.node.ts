import {
    FetchPermissionResponse,
} from ':core/rpc/coinbase_fetchSpendPermission.js';
import { SpendPermission } from ':core/rpc/coinbase_fetchSpendPermissions.js';
import { fetchRPCRequest } from '../utils.js';
import { CB_WALLET_RPC_URL } from '../utils.node.js';

type FetchPermissionType = {
  permissionHash: string;
};

/**
 * Fetches a single spend permission by its hash.
 *
 * This helper method retrieves a specific spend permission using its unique hash identifier.
 * This is useful when you have a permission hash from a previous operation and need to
 * fetch the full permission details. This helper is for the node environment or server side rendering.
 *
 * The method uses coinbase_fetchPermission RPC method to query the permission
 * from the backend service.
 *
 * @param params - The parameters for the fetchPermission method.
 * @param params.permissionHash - The hash of the permission to fetch.
 *
 * @returns A promise that resolves to a SpendPermission object.
 *
 * @example
 * ```typescript
 * import { fetchPermission } from '@base-org/account/spend-permission/node';
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
export const fetchPermission = async ({
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
    CB_WALLET_RPC_URL
  )) as FetchPermissionResponse;

  return response.permission;
};

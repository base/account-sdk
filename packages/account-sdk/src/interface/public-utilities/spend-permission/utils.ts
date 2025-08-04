import { SpendPermission } from ':core/rpc/coinbase_fetchSpendPermissions.js';
import { spendPermissionManagerAddress } from ':sign/base-account/utils/constants.js';
import { Address, Hex, getAddress } from 'viem';
import { RequestSpendPermissionType } from './methods/requestSpendPermission.js';

const ETERNITY_TIMESTAMP = 281474976710655; // 2^48 - 1

const SPEND_PERMISSION_TYPED_DATA_TYPES = {
  SpendPermission: [
    {
      name: 'account',
      type: 'address',
    },
    {
      name: 'spender',
      type: 'address',
    },
    {
      name: 'token',
      type: 'address',
    },
    {
      name: 'allowance',
      type: 'uint160',
    },
    {
      name: 'period',
      type: 'uint48',
    },
    {
      name: 'start',
      type: 'uint48',
    },
    {
      name: 'end',
      type: 'uint48',
    },
    {
      name: 'salt',
      type: 'uint256',
    },
    {
      name: 'extraData',
      type: 'bytes',
    },
  ],
};

export type SpendPermissionTypedData = {
  domain: {
    name: 'Spend Permission Manager';
    version: '1';
    chainId: number;
    verifyingContract: typeof spendPermissionManagerAddress;
  };
  types: typeof SPEND_PERMISSION_TYPED_DATA_TYPES;
  primaryType: 'SpendPermission';
  message: {
    account: Address;
    spender: Address;
    token: Address;
    allowance: string;
    period: number;
    start: number;
    end: number;
    salt: string;
    extraData: Hex;
  };
};

export function createSpendPermissionTypedData(
  request: RequestSpendPermissionType
): SpendPermissionTypedData {
  const { account, spender, token, chainId, allowance, periodInDays, start, end, salt, extraData } =
    request;

  return {
    domain: {
      name: 'Spend Permission Manager',
      version: '1',
      chainId: chainId,
      verifyingContract: spendPermissionManagerAddress,
    },
    types: SPEND_PERMISSION_TYPED_DATA_TYPES,
    primaryType: 'SpendPermission',
    message: {
      account: getAddress(account),
      spender: getAddress(spender),
      token: getAddress(token),
      allowance: allowance.toString(),
      period: 86400 * periodInDays,
      start: dateToTimestampInSeconds(start ?? new Date()),
      end: end ? dateToTimestampInSeconds(end) : ETERNITY_TIMESTAMP,
      salt: salt ?? getRandomHexString(32),
      extraData: extraData ? (extraData as Hex) : '0x',
    },
  };
}

function getRandomHexString(byteLength: number): `0x${string}` {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);

  const hexString = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `0x${hexString}`;
}

/**
 * Converts a JavaScript Date object to a Unix timestamp in seconds.
 *
 * @param date - The Date object to convert.
 * @returns The Unix timestamp in seconds.
 */
export function dateToTimestampInSeconds(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

/**

 * Converts a Unix timestamp in seconds to a Date object.
 *
 * @param timestamp - The Unix timestamp in seconds.
 * @returns A Date object.
 */
export function timestampInSecondsToDate(timestamp: number): Date {
  return new Date(timestamp * 1000);
}

/**
 * Converts a SpendPermission object to the arguments expected by the SpendPermissionManager contract.
 *
 * The order of the parameters does not matter because the contract will sort them.
 *
 * @param permission - The SpendPermission object to convert.
 * @returns The arguments expected by the SpendPermissionManager contract.
 *
 * @example
 * ```typescript
 * import { toSpendPermissionArgs } from '@base-org/account/spend-permission';
 *
 * const args = toSpendPermissionArgs(permission);
 * const currentPeriod = await readContract(client, {
 *   address: spendPermissionManagerAddress,
 *   abi: spendPermissionManagerAbi,
 *   functionName: 'getCurrentPeriod',
 *   args: [args]
 * });
 * ```
 */
export function toSpendPermissionArgs(permission: SpendPermission) {
  const {
    account,
    spender,
    token,
    allowance: allowanceStr,
    salt,
    extraData,
  } = permission.permission;

  return {
    ...permission.permission,
    account: getAddress(account),
    spender: getAddress(spender),
    token: getAddress(token),
    allowance: BigInt(allowanceStr),
    salt: BigInt(salt),
    extraData: extraData as Hex,
  };
}

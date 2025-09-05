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
 * Calculates the current period for a spend permission based on the permission parameters.
 *
 * This function computes which period we're currently in based on the permission's start time,
 * period duration, and the current time. It's useful when there's no on-chain state yet.
 *
 * @param permission - The SpendPermission object to calculate the period for
 * @param currentTimestamp - Optional timestamp to use as "now" (defaults to current time)
 * @returns The current period with start, end, and spend (0 for inferred periods)
 */
export function calculateCurrentPeriod(
  permission: SpendPermission,
  currentTimestamp?: number
): {
  start: number;
  end: number;
  spend: bigint;
} {
  const now = currentTimestamp ?? Math.floor(Date.now() / 1000);
  const { start, end, period } = permission.permission;

  const permissionStart = Number(start);
  const permissionEnd = Number(end);
  const periodDuration = Number(period);

  // If we're before the permission starts, return the first period
  if (now < permissionStart) {
    return {
      start: permissionStart,
      end: Math.min(permissionStart + periodDuration - 1, permissionEnd),
      spend: BigInt(0),
    };
  }

  // If we're after the permission ends, return the last period
  if (now > permissionEnd) {
    const periodsElapsed = Math.floor((permissionEnd - permissionStart) / periodDuration);
    const lastPeriodStart = permissionStart + periodsElapsed * periodDuration;
    return {
      start: lastPeriodStart,
      end: permissionEnd,
      spend: BigInt(0),
    };
  }

  // Calculate which period we're in
  const timeElapsed = now - permissionStart;
  const currentPeriodIndex = Math.floor(timeElapsed / periodDuration);
  const currentPeriodStart = permissionStart + currentPeriodIndex * periodDuration;
  const currentPeriodEnd = Math.min(currentPeriodStart + periodDuration - 1, permissionEnd);

  return {
    start: currentPeriodStart,
    end: currentPeriodEnd,
    spend: BigInt(0), // When inferring, we assume no spend has occurred
  };
}

/**
 * Converts a SpendPermission object to the arguments expected by the SpendPermissionManager contract.
 *
 * This function creates the standard args in the correct order.
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
    period,
    start,
    end,
    salt,
    extraData,
  } = permission.permission;

  return {
    account: getAddress(account),
    spender: getAddress(spender),
    token: getAddress(token),
    allowance: BigInt(allowanceStr),
    period,
    start,
    end,
    salt: BigInt(salt),
    extraData: extraData as Hex,
  };
}

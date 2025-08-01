import { spendPermissionManagerAddress } from ':sign/base-account/utils/constants.js';
import { Address, Hex, getAddress } from 'viem';
import { RequestSpendPermissionType } from './methods/requestSpendPermission.js';

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
      start: toTimestampInSeconds(start ?? new Date()),
      end: toTimestampInSeconds(end ?? add100Years(new Date())),
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
export function toTimestampInSeconds(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

/**
 * Returns a new Date object that is 100 years after the provided date.
 *
 * @param baseDate - The starting Date.
 * @returns A Date 100 years in the future.
 */
function add100Years(baseDate: Date): Date {
  const result = new Date(baseDate);
  result.setFullYear(result.getFullYear() + 100);
  return result;
}

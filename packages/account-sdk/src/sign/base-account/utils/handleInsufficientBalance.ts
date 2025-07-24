import { InsufficientBalanceErrorData, standardErrors } from ':core/error/errors.js';
import { RequestArguments } from ':core/provider/interface.js';
import { Address } from ':core/type/index.js';
import { assertPresence } from ':util/assertPresence.js';
import { Hex, PublicClient, encodeFunctionData, erc20Abi, numberToHex } from 'viem';
import {
  createSpendPermissionBatchMessage,
  createSpendPermissionMessage,
  parseFundingOptions,
  presentSubAccountFundingDialog,
} from '../utils.js';
import { routeThroughGlobalAccount } from './routeThroughGlobalAccount.js';

export async function handleInsufficientBalanceError({
  errorData,
  globalAccountAddress,
  subAccountAddress,
  client,
  request,
  subAccountRequest,
  globalAccountRequest,
}: {
  errorData: InsufficientBalanceErrorData;
  globalAccountAddress: Address;
  subAccountAddress: Address;
  request: RequestArguments;
  client: PublicClient;
  subAccountRequest: (request: RequestArguments) => Promise<any>;
  globalAccountRequest: (request: RequestArguments) => Promise<any>;
}) {
  const chainId = client.chain?.id;
  assertPresence(chainId, standardErrors.rpc.internal(`invalid chainId`));

  // Build spend permission requests for each token and check
  // that each token has global account as sufficient source
  // If not, will throw error
  const spendPermissionRequests = parseFundingOptions({
    errorData,
    sourceAddress: globalAccountAddress,
  });

  // Present options to user via snackbar
  const userChoice = await presentSubAccountFundingDialog();

  if (userChoice === 'cancel') {
    throw new Error('User cancelled funding');
  }

  let signatureRequest: RequestArguments;

  // Request 3x the amount per day -- maybe we can do something smarter here
  const defaultPeriod = 60 * 60 * 24;
  const defaultMultiplier = 3;

  if (userChoice === 'update_permission') {
    if (spendPermissionRequests.length === 1) {
      const spendPermission = spendPermissionRequests[0];

      const message = createSpendPermissionMessage({
        spendPermission: {
          token: spendPermission.token,
          allowance: numberToHex(spendPermission.requiredAmount * BigInt(defaultMultiplier)),
          period: defaultPeriod,
          account: globalAccountAddress,
          spender: subAccountAddress,
          start: 0,
          end: 281474976710655,
          salt: numberToHex(BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER))),
          extraData: '0x',
        },
        chainId,
      });

      signatureRequest = {
        method: 'eth_signTypedData_v4',
        params: [globalAccountAddress, message],
      };
    } else {
      // Batch spend permission request
      const message = createSpendPermissionBatchMessage({
        spendPermissionBatch: {
          account: globalAccountAddress,
          period: defaultPeriod,
          start: 0,
          end: 281474976710655,
          permissions: spendPermissionRequests.map((spendPermission) => ({
            token: spendPermission.token,
            allowance: numberToHex(spendPermission.requiredAmount * BigInt(defaultMultiplier)),
            period: defaultPeriod,
            account: globalAccountAddress,
            spender: subAccountAddress,
            salt: '0x0',
            extraData: '0x',
          })),
        },
        chainId,
      });

      signatureRequest = {
        method: 'eth_signTypedData_v4',
        params: [globalAccountAddress, message],
      };
    }

    try {
      // Request the signature - will be stored in backend
      await globalAccountRequest(signatureRequest);
    } catch (error) {
      console.error(error);
      // If the signature request is denied, we throw the original error
      throw new Error('User denied spend permission request');
    }

    // Retry the original request after updating permissions
    return subAccountRequest(request);
  }

  /* Handle continue_popup path */
  // Construct calls to transfer required tokens to sub account
  const transferCalls: {
    to: Address;
    value: Hex;
    data: Hex;
  }[] = spendPermissionRequests.map((spendPermission) => {
    const isNative =
      spendPermission.token.toLowerCase() ===
      '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'.toLowerCase();

    if (isNative) {
      return {
        to: subAccountAddress,
        value: numberToHex(spendPermission.requiredAmount),
        data: '0x',
      };
    }

    return {
      to: spendPermission.token,
      value: '0x0',
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'transfer',
        args: [subAccountAddress, spendPermission.requiredAmount],
      }),
    };
  });

  const result = await routeThroughGlobalAccount({
    request,
    globalAccountAddress,
    subAccountAddress,
    client,
    globalAccountRequest,
    prependCalls: transferCalls,
    chainId,
  });

  return result;
}

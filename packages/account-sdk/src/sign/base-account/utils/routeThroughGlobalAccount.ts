import { RequestArguments } from ':core/provider/interface.js';
import { spendPermissions } from ':store/store.js';
import {
  Address,
  Hex,
  PublicClient,
  SendCallsReturnType,
  WalletSendCallsParameters,
  encodeFunctionData,
  hexToBigInt,
} from 'viem';

import {
  createWalletSendCallsRequest,
  injectRequestCapabilities,
  isEthSendTransactionParams,
  isSendCallsParams,
  waitForCallsTransactionHash,
} from '../utils.js';
import { abi } from './constants.js';

/**
 * This function is used to send a request to the global account.
 * It is used to execute a request that requires a spend permission through the global account.
 * @returns The result of the request.
 */
export async function routeThroughGlobalAccount({
  request,
  globalAccountAddress,
  subAccountAddress,
  client,
  globalAccountRequest,
  chainId,
  prependCalls,
}: {
  /** The request to send to the global account. */
  request: RequestArguments;
  /** The address of the global account. */
  globalAccountAddress: Address;
  /** The address of the sub account. */
  subAccountAddress: Address;
  /** The client to use to send the request. */
  client: PublicClient;
  /** The chain id to use to send the request. */
  chainId: number;
  /** Optional calls to prepend to the request. */
  prependCalls?: { to: Address; data: Hex; value: Hex }[] | undefined;
  /** The function to use to send the request to the global account. */
  globalAccountRequest: (request: RequestArguments) => Promise<any>;
}) {
  // Construct call to execute the original calls using executeBatch
  let originalSendCallsParams: WalletSendCallsParameters[0];

  if (request.method === 'wallet_sendCalls' && isSendCallsParams(request.params)) {
    originalSendCallsParams = request.params[0];
  } else if (
    request.method === 'eth_sendTransaction' &&
    isEthSendTransactionParams(request.params)
  ) {
    const sendCallsRequest = createWalletSendCallsRequest({
      calls: [request.params[0]],
      chainId,
      from: request.params[0].from,
    });

    originalSendCallsParams = sendCallsRequest.params[0];
  } else {
    throw new Error(`Could not get original call from ${request.method} request`);
  }

  const subAccountCallData = encodeFunctionData({
    abi,
    functionName: 'executeBatch',
    args: [
      originalSendCallsParams.calls.map((call) => ({
        target: call.to!,
        value: hexToBigInt(call.value ?? '0x0'),
        data: call.data ?? '0x',
      })),
    ],
  });

  // Send using wallet_sendCalls
  const calls: { to: Address; data: Hex; value: Hex }[] = [
    ...(prependCalls ?? []),
    { data: subAccountCallData, to: subAccountAddress, value: '0x0' },
  ];

  const requestToParent = injectRequestCapabilities(
    {
      method: 'wallet_sendCalls',
      params: [
        {
          ...originalSendCallsParams,
          calls,
          from: globalAccountAddress,
          version: '2.0.0',
          atomicRequired: true,
        },
      ],
    },
    {
      spendPermissions: {
        request: {
          spender: subAccountAddress,
        },
      },
    }
  );

  const result = (await globalAccountRequest(requestToParent)) as SendCallsReturnType;

  let callsId = result.id;

  // Cache returned spend permissions
  if (result.capabilities?.spendPermissions) {
    spendPermissions.set(result.capabilities.spendPermissions.permissions);
  }

  // Wait for transaction hash if sending a transaction
  if (request.method === 'eth_sendTransaction') {
    return waitForCallsTransactionHash({
      client,
      id: callsId,
    });
  }

  return result;
}

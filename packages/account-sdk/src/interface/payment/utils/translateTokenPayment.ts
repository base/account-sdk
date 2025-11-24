import { encodeFunctionData, toHex, type Address, type Hex } from 'viem';

import { ERC20_TRANSFER_ABI } from '../constants.js';
import type { PayerInfo, PaymasterOptions } from '../types.js';
import type { WalletSendCallsRequestParams } from './sdkManager.js';
import type { ResolvedToken } from './tokenRegistry.js';

function buildDataCallbackCapability(payerInfo?: PayerInfo) {
  if (!payerInfo || payerInfo.requests.length === 0) {
    return undefined;
  }

  return {
    requests: payerInfo.requests.map((request) => ({
      type: request.type,
      optional: request.optional ?? false,
    })),
    ...(payerInfo.callbackURL && { callbackURL: payerInfo.callbackURL }),
  };
}

function buildPaymasterCapability(paymaster: PaymasterOptions | undefined) {
  if (!paymaster) {
    throw new Error('paymaster configuration is required');
  }

  const capability: Record<string, unknown> = {};

  if (paymaster.url) {
    capability.url = paymaster.url;
  }

  if (paymaster.context) {
    capability.context = paymaster.context;
  }

  if (paymaster.paymasterAndData) {
    capability.paymasterAndData = paymaster.paymasterAndData;
  }

  if (Object.keys(capability).length === 0) {
    throw new Error('paymaster configuration must include either a url or paymasterAndData value');
  }

  return capability;
}

export function buildTokenPaymentRequest({
  recipient,
  amount,
  chainId,
  token,
  payerInfo,
  paymaster,
}: {
  recipient: Address;
  amount: bigint;
  chainId: number;
  token: ResolvedToken;
  payerInfo?: PayerInfo;
  paymaster: PaymasterOptions;
}): WalletSendCallsRequestParams {
  const capabilities: Record<string, unknown> = {};

  const paymasterCapability = buildPaymasterCapability(paymaster);
  capabilities.paymasterService = paymasterCapability;

  const dataCallbackCapability = buildDataCallbackCapability(payerInfo);
  if (dataCallbackCapability) {
    capabilities.dataCallback = dataCallbackCapability;
  }

  const calls =
    token.isNativeEth === true
      ? ([
          {
            to: recipient as Hex,
            data: '0x' as Hex,
            value: toHex(amount),
          },
        ] as const)
      : ([
          {
            to: token.address as Hex,
            data: encodeFunctionData({
              abi: ERC20_TRANSFER_ABI,
              functionName: 'transfer',
              args: [recipient, amount],
            }),
            value: '0x0' as Hex,
          },
        ] as const);

  return {
    version: '2.0.0',
    chainId,
    calls: [...calls],
    capabilities,
  };
}



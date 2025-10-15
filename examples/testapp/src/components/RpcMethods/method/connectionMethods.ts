import { type Hex, numberToHex } from 'viem';
import { RpcRequestInput } from './RpcRequestInput';

const ethRequestAccounts: RpcRequestInput = {
  method: 'eth_requestAccounts',
  params: [],
};

const ethAccounts: RpcRequestInput = {
  method: 'eth_accounts',
  params: [],
};

const walletConnect: RpcRequestInput = {
  method: 'wallet_connect',
  params: [
    {
      key: 'version',
      required: true,
    },
    {
      key: 'chainIds',
    },
    {
      key: 'capabilities',
    },
  ],
  format: (data: Record<string, string>) => {
    const chainIds = (data.chainIds ?? '')
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0)
      .map((v) => {
        try {
          return numberToHex(BigInt(v));
        } catch (_) {
          return undefined;
        }
      })
      .filter((v): v is Hex => Boolean(v));

    const payload: Record<string, unknown> = { version: data.version };
    if (chainIds.length > 0) payload.chainIds = chainIds;
    if (data.capabilities) payload.capabilities = data.capabilities;
    return [payload];
  },
};

export const connectionMethods = [ethRequestAccounts, ethAccounts, walletConnect];

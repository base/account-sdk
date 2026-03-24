import { createPublicClient, http } from 'viem';
import * as chains from 'viem/chains';
import { CLIError } from '../../types/errors.js';

const ERC20_BALANCE_OF_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export type BalanceResult = {
  address: string;
  contract: string;
  balance: string;
};

const chainById: ReadonlyMap<number, (typeof chains)[keyof typeof chains]> = new Map(
  Object.values(chains)
    .filter((v) => typeof v === 'object' && v !== null && 'id' in v)
    .map((c) => [c.id, c] as const)
);

function getPublicClient(numericChainId: number) {
  const viemChain = chainById.get(numericChainId);
  if (!viemChain) {
    throw new CLIError('UNSUPPORTED_CHAIN', `No viem chain found for chain ID ${numericChainId}`);
  }
  return createPublicClient({ chain: viemChain, transport: http() });
}

export async function getBalance(
  address: `0x${string}`,
  numericChainId: number,
  contract?: `0x${string}`
): Promise<BalanceResult> {
  const client = getPublicClient(numericChainId);

  if (contract) {
    const balance = await client.readContract({
      address: contract,
      abi: ERC20_BALANCE_OF_ABI,
      functionName: 'balanceOf',
      args: [address],
    });
    return {
      address,
      contract,
      balance: balance.toString(),
    };
  }

  const balance = await client.getBalance({ address });
  return {
    address,
    contract: 'native',
    balance: balance.toString(),
  };
}

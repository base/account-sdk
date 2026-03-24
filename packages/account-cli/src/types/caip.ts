/** CAIP-2 chain identifier, e.g. "eip155:8453" */
export type ChainId = `${string}:${string}`;

export type ParsedChainId = {
  namespace: string;
  reference: string;
};

export const KNOWN_CHAINS = {
  base: 'eip155:8453',
  'base-sepolia': 'eip155:84532',
} as const satisfies Record<string, ChainId>;

export type ChainAlias = keyof typeof KNOWN_CHAINS;

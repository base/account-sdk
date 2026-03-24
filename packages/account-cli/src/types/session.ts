import type { ChainId } from './caip.js';

export const SESSION_VERSION = 1;

export type SessionResolvedVia = 'env_var' | 'auto_select' | 'interactive';

export const SESSION_MODES = ['operator', 'smart-wallet', 'external-eoa'] as const;
export type SessionMode = (typeof SESSION_MODES)[number];

/**
 * Direct owner access to the base account. The operator directly requests operations
 * to user's base account — no sub-account or spend permissions are applied.
 */
export type OperatorSession = {
  version: typeof SESSION_VERSION;
  mode: 'operator';
  account: string;
  createdAt: string;
};

/**
 * CLI-managed smart wallet sub account. Created by the CLI as a child of
 * user's base account. An optional signer can be delegated to sign
 * on behalf of the sub-account without exposing its root key.
 */
export type SmartWalletSession = {
  version: typeof SESSION_VERSION;
  mode: 'smart-wallet';
  account: string;
  subAccount: `0x${string}`;
  chainId?: ChainId;
  signer: `0x${string}`;
  createdAt: string;
};

/**
 * Externally-owned account brought by an agent. The EOA is not created or
 * managed by the CLI — the agent provides its own key. It is registered as
 * a sub-account of the parent base account for policy and access scoping.
 */
export type ExternalEoaSession = {
  version: typeof SESSION_VERSION;
  mode: 'external-eoa';
  account: string;
  eoa: `0x${string}`;
  chainId?: ChainId;
  createdAt: string;
};

export type Session = OperatorSession | SmartWalletSession | ExternalEoaSession;

export type ResolvedSession = Session & {
  resolvedVia: SessionResolvedVia;
};

import { type ChainAlias, type ChainId, KNOWN_CHAINS, type ParsedChainId } from '../types/caip.js';

const CAIP2_RE = /^[-a-z0-9]{3,8}:[-_a-zA-Z0-9]{1,64}$/;

/** Parse a CAIP-2 chain identifier into namespace and reference. Returns null if invalid. */
export function parseChainId(chainId: string): ParsedChainId | null {
  if (!CAIP2_RE.test(chainId)) return null;
  const idx = chainId.indexOf(':');
  return {
    namespace: chainId.slice(0, idx),
    reference: chainId.slice(idx + 1),
  };
}

/** Validate that a string is a well-formed CAIP-2 chain identifier. */
export function isValidChainId(value: string): value is ChainId {
  return CAIP2_RE.test(value);
}

/**
 * Resolve a chain alias (e.g. "base") or CAIP-2 identifier to a canonical ChainId.
 * Returns null if the input is neither a known alias nor valid CAIP-2.
 */
export function resolveChainId(input: string): ChainId | null {
  if (input in KNOWN_CHAINS) {
    return KNOWN_CHAINS[input as ChainAlias];
  }
  if (isValidChainId(input)) return input;
  return null;
}

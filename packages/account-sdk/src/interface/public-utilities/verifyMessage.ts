import type { PublicClient } from 'viem';
import { type VerifyMessageParameters, verifyMessage as viemVerifyMessage } from 'viem/actions';

/**
 * Verifies that a message was signed by the provided address.
 *
 * Unlike viem's standalone `verifyMessage` utility, this helper supports both
 * externally owned accounts and smart contract accounts. Smart contract
 * signatures are intentionally not restricted to the 64- or 65-byte ECDSA
 * formats because ERC-1271 accounts can define their own signature encoding.
 *
 * @example
 * ```typescript
 * import { verifyMessage } from '@base-org/account';
 * import { createPublicClient, http } from 'viem';
 * import { base } from 'viem/chains';
 *
 * const client = createPublicClient({
 *   chain: base,
 *   transport: http(),
 * });
 *
 * const valid = await verifyMessage(client, {
 *   address,
 *   message,
 *   signature,
 * });
 * ```
 *
 * @param client - Viem public client configured for the account's chain
 * @param parameters - The address, message, and signature to verify
 * @returns Whether the signature is valid for the address
 *
 * @public
 */
export async function verifyMessage(
  client: PublicClient,
  parameters: VerifyMessageParameters
): Promise<boolean> {
  if (!client) {
    throw new Error('Public client is required to verify a message');
  }

  return viemVerifyMessage(client, parameters);
}

import type { Address } from 'viem';
import { VERSION, WALLET_RPC_URL } from '../constants.js';

/**
 * ENS resolution endpoint
 */
const ENS_ENDPOINT = 'getBasicPublicProfiles';

/**
 * Response type for ENS resolution API
 */
interface ENSResolutionResponse {
  result: {
    profiles: {
      [ensName: string]: {
        address: string;
        name: string;
        displayName?: string;
        avatar?: string;
      };
    };
  };
}

/**
 * Constructs the ENS resolution API URL
 * @returns The complete API URL for ENS resolution
 */
function buildENSApiUrl(): string {
  return `${WALLET_RPC_URL}/${VERSION}/${ENS_ENDPOINT}`;
}

/**
 * Resolves an ENS name to an Ethereum address using Coinbase Wallet API
 * @param ensName - The ENS name to resolve (e.g., "vitalik.eth")
 * @returns Promise<Address> - The resolved Ethereum address
 * @throws Error if resolution fails or returns no address
 */
export async function resolveENS(ensName: string): Promise<Address> {
  try {
    const apiUrl = buildENSApiUrl();
    const url = new URL(apiUrl);
    url.searchParams.append('names', ensName);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`ENS resolution failed: ${response.status} ${response.statusText}`);
    }

    const data: ENSResolutionResponse = await response.json();

    if (!data.result || !data.result.profiles) {
      throw new Error(`Invalid response format for ENS name "${ensName}"`);
    }

    const profile = data.result.profiles[ensName];
    if (!profile) {
      throw new Error(`ENS name "${ensName}" not found`);
    }

    if (!profile.address) {
      throw new Error(`No address found for ENS name "${ensName}"`);
    }

    return profile.address as Address;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to resolve ENS name "${ensName}": ${error.message}`);
    }
    throw new Error(`Failed to resolve ENS name "${ensName}": Unknown error`);
  }
} 
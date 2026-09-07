import { http, type PublicClient, createPublicClient, size } from 'viem';
import { verifyMessage as viemVerifyMessage } from 'viem/actions';
import { base } from 'viem/chains';
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import { verifyMessage } from './verifyMessage.js';

vi.mock('viem/actions', () => ({
  verifyMessage: vi.fn(),
}));

describe('verifyMessage', () => {
  let client: PublicClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = createPublicClient({
      chain: base,
      transport: http(),
    }) as PublicClient;
  });

  it('accepts the variable-length smart account signature from issue #230', async () => {
    const parameters = {
      address: '0x17046ccf43e0d7f0d44e98be223f4ba25af0f59f',
      message: 'Hello, viem! 这是一条测试消息。',
      signature:
        '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000041f71592b5fd91490f5c86b56bb2246b59eb099a6efadef8a882297d5f3e3d0b1a42229f5c2cd603695081cc18a90b69cd895dce707ce9d4a61618a27490afc7801c00000000000000000000000000000000000000000000000000000000000000',
    } as const;

    expect(size(parameters.signature)).toBe(224);
    (viemVerifyMessage as Mock).mockResolvedValue(true);

    await expect(verifyMessage(client, parameters)).resolves.toBe(true);
    expect(viemVerifyMessage).toHaveBeenCalledWith(client, parameters);
  });

  it('returns false when contract-aware verification rejects the signature', async () => {
    const parameters = {
      address: '0x17046ccf43e0d7f0d44e98be223f4ba25af0f59f',
      message: 'different message',
      signature: '0x1234',
    } as const;

    (viemVerifyMessage as Mock).mockResolvedValue(false);

    await expect(verifyMessage(client, parameters)).resolves.toBe(false);
  });

  it('requires a public client so smart account signatures are verified onchain', async () => {
    await expect(
      verifyMessage(null as unknown as PublicClient, {
        address: '0x17046ccf43e0d7f0d44e98be223f4ba25af0f59f',
        message: 'Hello, viem!',
        signature: '0x1234',
      })
    ).rejects.toThrow('Public client is required to verify a message');

    expect(viemVerifyMessage).not.toHaveBeenCalled();
  });
});

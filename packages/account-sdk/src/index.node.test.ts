import { describe, expect, it } from 'vitest';
import * as nodeEntry from './index.node.js';
import * as prolinkNode from './interface/public-utilities/prolink/index.node.js';

describe('node entry point', () => {
  it('exports the prolink utilities from the Node build of prolink', () => {
    expect(nodeEntry.createProlinkUrl).toBe(prolinkNode.createProlinkUrl);
    expect(nodeEntry.encodeProlink).toBe(prolinkNode.encodeProlink);
    expect(nodeEntry.decodeProlink).toBe(prolinkNode.decodeProlink);
  });

  it('round-trips a request through the root Node exports', async () => {
    const request = {
      method: 'personal_sign',
      params: ['0xdeadbeef', '0xfe21034794a5A574B94fE4fDfD16e005F1C96e51'],
      chainId: 8453,
    };

    const prolink = await nodeEntry.encodeProlink(request);
    const url = new URL(nodeEntry.createProlinkUrl(prolink));

    expect(url.searchParams.get('p')).toBe(prolink);
    await expect(nodeEntry.decodeProlink(prolink)).resolves.toMatchObject(request);
  });
});

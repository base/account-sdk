import { ShortcutType } from './ShortcutType';

const PLACEHOLDER_ADDRESS = '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

const BASE_PAY_DATA = {
  domain: {
    chainId: 8453,
    name: 'USDC',
    verifyingContract: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    version: '2',
  },
  message: {
    from: PLACEHOLDER_ADDRESS,
    nonce: '0xbda37619d3004dba4ac2491022bc82b7df64c2f68e8a349422c71983a80d16ca',
    to: '0xbc4c0191af73c4953b54f21ae0c74b31fc6cb21b',
    validAfter: '0',
    validBefore: '1914749767655',
    value: '10000',
  },
  primaryType: 'ReceiveWithAuthorization',
  types: {
    ReceiveWithAuthorization: [
      {
        name: 'from',
        type: 'address',
      },
      {
        name: 'to',
        type: 'address',
      },
      {
        name: 'value',
        type: 'uint256',
      },
      {
        name: 'validAfter',
        type: 'uint256',
      },
      {
        name: 'validBefore',
        type: 'uint256',
      },
      {
        name: 'nonce',
        type: 'bytes32',
      },
    ],
  },
};

const walletSendCallsEphemeralShortcuts: ShortcutType[] = [
  {
    key: 'wallet_sendCalls',
    data: {
      chainId: '84532',
      calls: [],
      version: '1',
    },
  },
];

const walletSignOldSpecEphemeralShortcuts: ShortcutType[] = [
  {
    key: 'Base Pay',
    data: {
      version: '1.0',
      type: '0x01',
      data: BASE_PAY_DATA,
    },
  },
];

const walletSignNewSpecEphemeralShortcuts: ShortcutType[] = [
  {
    key: 'Base Pay',
    data: {
      version: '1.0',
      request: {
        type: '0x01',
        data: BASE_PAY_DATA,
      },
    },
  },
];

export const ephemeralMethodShortcutsMap = {
  wallet_sendCalls: walletSendCallsEphemeralShortcuts,
  ['wallet_sign#old']: walletSignOldSpecEphemeralShortcuts,
  ['wallet_sign#new']: walletSignNewSpecEphemeralShortcuts,
};

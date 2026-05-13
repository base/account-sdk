import { ShortcutType } from './ShortcutType';
import { ADDR_TO_FILL, EXAMPLE_MESSAGE } from './const';

const TYPED_DATA_V4_DATA = {
  domain: {
    chainId: '84532',
    name: 'Ether Mail',
    verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
    version: '1',
  },
  message: {
    contents: 'Hello, Bob!',
    from: {
      name: 'Cow',
      wallets: [
        '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
        '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF',
      ],
    },
    to: [
      {
        name: 'Bob',
        wallets: [
          '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
          '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
          '0xB0B0b0b0b0b0B000000000000000000000000000',
        ],
      },
    ],
  },
  primaryType: 'Mail',
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    Group: [
      { name: 'name', type: 'string' },
      { name: 'members', type: 'Person[]' },
    ],
    Mail: [
      { name: 'from', type: 'Person' },
      { name: 'to', type: 'Person[]' },
      { name: 'contents', type: 'string' },
    ],
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallets', type: 'address[]' },
    ],
  },
};

const BASE_PAY_DATA = {
  domain: {
    chainId: 8453,
    name: 'USDC',
    verifyingContract: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    version: '2',
  },
  message: {
    from: ADDR_TO_FILL,
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

const personalSignShortcuts: ShortcutType[] = [
  {
    key: EXAMPLE_MESSAGE,
    data: {
      message: EXAMPLE_MESSAGE,
      address: ADDR_TO_FILL,
    },
  },
];

const ethSignTypedDataV1Shortcuts: ShortcutType[] = [
  {
    key: EXAMPLE_MESSAGE,
    data: {
      message: [
        {
          type: 'string',
          name: 'Message',
          value: EXAMPLE_MESSAGE,
        },
      ],
      address: ADDR_TO_FILL,
    },
  },
];

const ethSignTypedDataV3Shortcuts: (chainId) => ShortcutType[] = (chainId: number) => [
  {
    key: EXAMPLE_MESSAGE,
    data: {
      message: {
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'wallet', type: 'address' },
          ],
          Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person' },
            { name: 'contents', type: 'string' },
          ],
        },
        primaryType: 'Mail',
        domain: {
          name: 'Ether Mail',
          version: '1',
          chainId,
          verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
        },
        message: {
          from: {
            name: 'Cow',
            wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
          },
          to: {
            name: 'Bob',
            wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
          },
          contents: 'Hello, Bob!',
        },
      },
      address: ADDR_TO_FILL,
    },
  },
];

// -- Clear Signing test payloads (ERC-7730 descriptors exist in the registry) --

/**
 * Permit2 PermitSingle — Uniswap's canonical approval mechanism.
 * Descriptor: https://github.com/ethereum/clear-signing-erc7730-registry
 */
// USDC contract addresses per chain
const USDC_BY_CHAIN: Record<number, string> = {
  1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base
  84532: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia
  10: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', // Optimism
  42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Arbitrum
};

const PERMIT2_DATA = (chainId: number) => ({
  domain: {
    name: 'Permit2',
    chainId: Number(chainId),
    verifyingContract: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
  },
  types: {
    PermitSingle: [
      { name: 'details', type: 'PermitDetails' },
      { name: 'spender', type: 'address' },
      { name: 'sigDeadline', type: 'uint256' },
    ],
    PermitDetails: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint160' },
      { name: 'expiration', type: 'uint48' },
      { name: 'nonce', type: 'uint48' },
    ],
  },
  primaryType: 'PermitSingle',
  message: {
    details: {
      token: USDC_BY_CHAIN[chainId] ?? USDC_BY_CHAIN[8453],
      amount: '1000000000', // 1,000 USDC (6 decimals)
      expiration: '1767225600', // 2026-01-01
      nonce: '0',
    },
    spender: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD', // Uniswap Universal Router
    sigDeadline: '1767225600',
  },
});

/**
 * ERC-20 Permit (EIP-2612) — gasless token approval.
 * Used by USDC, DAI, and many other tokens.
 */
const ERC20_PERMIT_DATA = (chainId: number) => ({
  domain: {
    name: 'USD Coin',
    version: '2',
    chainId: Number(chainId),
    verifyingContract: USDC_BY_CHAIN[chainId] ?? USDC_BY_CHAIN[8453],
  },
  types: {
    Permit: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
  },
  primaryType: 'Permit',
  message: {
    owner: ADDR_TO_FILL,
    spender: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', // Uniswap SwapRouter02
    value: '1000000', // 1 USDC (6 decimals)
    nonce: '0',
    deadline: '1767225600', // 2026-01-01
  },
});

/**
 * Seaport order — OpenSea's marketplace protocol.
 * Simplified order for NFT listing.
 */
const SEAPORT_ORDER_DATA = (chainId: number) => ({
  domain: {
    name: 'Seaport',
    version: '1.6',
    chainId: Number(chainId),
    verifyingContract: '0x0000000000000068F116a894984e2DB1123eB395',
  },
  types: {
    OrderComponents: [
      { name: 'offerer', type: 'address' },
      { name: 'zone', type: 'address' },
      { name: 'offer', type: 'OfferItem[]' },
      { name: 'consideration', type: 'ConsiderationItem[]' },
      { name: 'orderType', type: 'uint8' },
      { name: 'startTime', type: 'uint256' },
      { name: 'endTime', type: 'uint256' },
      { name: 'zoneHash', type: 'bytes32' },
      { name: 'salt', type: 'uint256' },
      { name: 'conduitKey', type: 'bytes32' },
      { name: 'counter', type: 'uint256' },
    ],
    OfferItem: [
      { name: 'itemType', type: 'uint8' },
      { name: 'token', type: 'address' },
      { name: 'identifierOrCriteria', type: 'uint256' },
      { name: 'startAmount', type: 'uint256' },
      { name: 'endAmount', type: 'uint256' },
    ],
    ConsiderationItem: [
      { name: 'itemType', type: 'uint8' },
      { name: 'token', type: 'address' },
      { name: 'identifierOrCriteria', type: 'uint256' },
      { name: 'startAmount', type: 'uint256' },
      { name: 'endAmount', type: 'uint256' },
      { name: 'recipient', type: 'address' },
    ],
  },
  primaryType: 'OrderComponents',
  message: {
    offerer: ADDR_TO_FILL,
    zone: '0x0000000000000000000000000000000000000000',
    offer: [
      {
        itemType: 2, // ERC721
        token: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D', // BAYC
        identifierOrCriteria: '1234',
        startAmount: '1',
        endAmount: '1',
      },
    ],
    consideration: [
      {
        itemType: 0, // ETH
        token: '0x0000000000000000000000000000000000000000',
        identifierOrCriteria: '0',
        startAmount: '1000000000000000000', // 1 ETH
        endAmount: '1000000000000000000',
        recipient: ADDR_TO_FILL,
      },
    ],
    orderType: 0,
    startTime: '1700000000',
    endTime: '1735689600',
    zoneHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    salt: '12345',
    conduitKey: '0x0000000000000000000000000000000000000000000000000000000000000000',
    counter: '0',
  },
});

const ethSignTypedDataV4Shortcuts: (chainId: number) => ShortcutType[] = (chainId: number) => [
  {
    key: EXAMPLE_MESSAGE,
    data: {
      message: TYPED_DATA_V4_DATA,
      address: ADDR_TO_FILL,
    },
  },
  {
    key: 'Permit2 (Clear Signing)',
    data: {
      message: PERMIT2_DATA(chainId),
      address: ADDR_TO_FILL,
    },
  },
  {
    key: 'ERC-20 Permit (Clear Signing)',
    data: {
      message: ERC20_PERMIT_DATA(chainId),
      address: ADDR_TO_FILL,
    },
  },
  {
    key: 'Seaport Order (Clear Signing)',
    data: {
      message: SEAPORT_ORDER_DATA(chainId),
      address: ADDR_TO_FILL,
    },
  },
  {
    key: 'Grant Permission',
    data: {
      message: {
        domain: {
          name: 'Spend Permission Manager',
          version: '1',
          chainId: Number(chainId),
          verifyingContract: '0xf85210B21cC50302F477BA56686d2019dC9b67Ad',
        },
        types: {
          SpendPermission: [
            { name: 'account', type: 'address' },
            { name: 'spender', type: 'address' },
            { name: 'token', type: 'address' },
            { name: 'allowance', type: 'uint160' },
            { name: 'period', type: 'uint48' },
            { name: 'start', type: 'uint48' },
            { name: 'end', type: 'uint48' },
            { name: 'salt', type: 'uint256' },
            { name: 'extraData', type: 'bytes' },
          ],
        },
        primaryType: 'SpendPermission',
        message: {
          account: 'YOUR_ADDRESS_HERE',
          spender: '0xd4e17478581878A967aA22d45a5158A9fE96AA08',
          token: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          allowance: '1000000',
          period: 86400,
          start: 1724264802,
          end: 17242884802,
          salt: '0x1',
          extraData: '0x',
        },
      },
      address: ADDR_TO_FILL,
    },
  },
];

const walletSignOldSpecShortcuts: ShortcutType[] = [
  {
    key: 'Base Pay',
    data: {
      version: '1.0',
      type: '0x01',
      address: ADDR_TO_FILL,
      data: BASE_PAY_DATA,
    },
  },
  {
    key: 'Typed Data',
    data: {
      version: '1.0',
      type: '0x01',
      address: ADDR_TO_FILL,
      data: TYPED_DATA_V4_DATA,
    },
  },
  {
    key: 'Personal Sign',
    data: {
      version: '1.0',
      type: '0x45',
      address: ADDR_TO_FILL,
      data: {
        message: 'Hello, World!',
      },
    },
  },
];

const walletSignNewSpecShortcuts: ShortcutType[] = [
  {
    key: 'Base Pay',
    data: {
      version: '1.0',
      request: {
        type: '0x01',
        data: BASE_PAY_DATA,
      },
      address: ADDR_TO_FILL,
    },
  },
  {
    key: 'Typed Data',
    data: {
      version: '1.0',
      request: {
        type: '0x01',
        data: TYPED_DATA_V4_DATA,
      },
      address: ADDR_TO_FILL,
    },
  },
  {
    key: 'Personal Sign',
    data: {
      version: '1.0',
      request: {
        type: '0x45',
        data: {
          message: 'Hello, World!',
        },
      },
      address: ADDR_TO_FILL,
    },
  },
];

export const signMessageShortcutsMap = (chainId: number) => ({
  personal_sign: personalSignShortcuts,
  eth_signTypedData_v1: ethSignTypedDataV1Shortcuts,
  eth_signTypedData_v3: ethSignTypedDataV3Shortcuts(chainId),
  eth_signTypedData_v4: ethSignTypedDataV4Shortcuts(chainId),
  ['wallet_sign#old']: walletSignOldSpecShortcuts,
  ['wallet_sign#new']: walletSignNewSpecShortcuts,
});

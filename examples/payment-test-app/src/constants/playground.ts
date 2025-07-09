export const DEFAULT_PAY_CODE = `import { pay } from '@base-org/account-sdk'

const result = await pay({
  amount: '.01',
  to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  testnet: true
})

return result`;

export const PAY_CODE_WITH_INFO_REQUESTS = `import { pay } from '@base-org/account-sdk'

const result = await pay({
  amount: '.01',
  to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  testnet: true,
  infoRequests: [
    { request: 'email' },
    { request: 'phoneNumber', optional: true }
  ]
})

return result`;

export const PAY_QUICK_TIPS = [
  'Get testnet ETH at <a href="https://faucet.circle.com/" target="_blank" rel="noopener noreferrer">https://faucet.circle.com/</a> - select "Base Sepolia" as the network',
  'Make sure to return the result at the end of your code',
  'testnet (`true`) toggles base sepolia testnet',
  'Amount is in USDC (e.g., "1" = 1 USDC)',
  'Only USDC on base and base sepolia are supported',
  'infoRequests can be used to request user information (email, physicalAddress, phoneNumber, name, onchainAddress)',
  'Set optional: true to make info requests optional, otherwise they are required by default',
];

export const QUICK_TIPS = PAY_QUICK_TIPS;

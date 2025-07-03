export const DEFAULT_PAY_CODE = `import { pay } from '@coinbase/wallet-sdk/payment'

const result = await pay({
  amount: '.01',
  recipient: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
  testnet: true
})

return result`;

export const PAY_QUICK_TIPS = [
  'Get testnet ETH at <a href="https://faucet.circle.com/" target="_blank" rel="noopener noreferrer">https://faucet.circle.com/</a> - select "Base Sepolia" as the network',
  'Make sure to return the result at the end of your code',
  'testnet (`true`) toggles base sepolia testnet',
  'Amount is in USDC (e.g., "1" = 1 USDC)',
  'Only USDC on base and base sepolia are supported',
];

export const QUICK_TIPS = PAY_QUICK_TIPS;

export const DEFAULT_SUBSCRIBE_CODE = `import { base } from '@base-org/account'

try {
  const result = await base.subscribe({
    amount: '10.00',
    to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // Your app's spender address
    periodInDays: 30, // Monthly subscription
    testnet: true
  })
  
  return result;
} catch (error) {
  console.error('Subscription failed:', error.message);
  throw error;
}`;

export const SUBSCRIBE_QUICK_TIPS = [
  'Creates a spend permission for recurring payments',
  'Uses wallet_sign RPC to avoid connection before request',
  'Amount is the maximum USDC per period (e.g., "10" = $10 USDC)',
  'periodInDays sets the recurring interval (e.g., 30 for monthly)',
  'The "to" address is the spender (your application)',
  'Only USDC on Base and Base Sepolia are supported',
  'The wallet will replace the account placeholder with the actual user address',
];

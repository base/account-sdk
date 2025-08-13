export const DEFAULT_PAY_CODE = `import { base } from '@base-org/account'

try {
  const result = await base.pay({
    amount: '.01',
    to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    testnet: true
  })
  
  return result;
} catch (error) {
  console.error('Payment failed:', error.message);
  throw error;
}`;

export const PAY_CODE_WITH_PAYER_INFO = `import { base } from '@base-org/account'

try {
  const result = await base.pay({
    amount: '.01',
    to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    testnet: true,
    payerInfo: {
      requests: [
        { type: 'name'},
        { type: 'email' },
        { type: 'phoneNumber', optional: true },
        { type: 'physicalAddress', optional: true },
        { type: 'onchainAddress' }
      ]
    }
  })
  
  return result;
} catch (error) {
  console.error('Payment failed:', error.message);
  throw error;
}`;

export const DEFAULT_GET_PAYMENT_STATUS_CODE = `import { base } from '@base-org/account'

try {
  const result = await base.getPaymentStatus({
    id: '0x...', // Automatically filled with your recent transaction
    testnet: true
  })
  
  return result;
} catch (error) {
  // This will catch network errors if any occur
  console.error('Failed to check payment status:', error.message);
  throw error;
}`;

export const PAY_QUICK_TIPS = [
  'Get testnet ETH at <a href="https://faucet.circle.com/" target="_blank" rel="noopener noreferrer">https://faucet.circle.com/</a> - select "Base Sepolia" as the network',
  'testnet (`true`) toggles base sepolia testnet',
  'Amount is in USDC (e.g., "1" = $1 of USDC)',
  'Only USDC on base and base sepolia are supported',
  'Use payerInfo to request user information.',
];

export const GET_PAYMENT_STATUS_QUICK_TIPS = [
  'Use an `id` returned from the pay function',
  'Status can be: pending, completed, failed, or not_found',
  'For completed payments, you can see the amount and recipient',
  'For failed payments, you can see the failure reason',
  'Make sure to use the same testnet setting as the original payment',
];

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

export const QUICK_TIPS = PAY_QUICK_TIPS;

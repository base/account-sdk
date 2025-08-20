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

export const DEFAULT_GET_STATUS_CODE = `import { base } from '@base-org/account'

try {
  // Option 1: Using a subscription hash/ID directly
  const status = await base.subscription.getStatus({
    subscription: '0x...', // Replace with your subscription hash
    testnet: true
  })
  
  // Option 2: Using a subscription result object
  // const subscription = await base.subscribe({ ... })
  // const status = await base.subscription.getStatus({
  //   subscription: subscription,
  //   testnet: true
  // })
  
  console.log('Subscription active:', status.isSubscribed);
  console.log('Last payment:', status.lastPaymentAmount, 'on', status.lastPaymentDate);
  console.log('Next period starts:', status.nextPeriodStart);
  console.log('Recurring amount:', status.recurringAmount);
  
  return status;
} catch (error) {
  console.error('Failed to get subscription status:', error.message);
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

export const GET_STATUS_QUICK_TIPS = [
  'Checks the current status of a subscription',
  'Accepts either a subscription hash or a SubscriptionResult object',
  'Returns isSubscribed: true if permission is non-revoked',
  'Shows last payment date and amount if available',
  'Shows next period start date for active subscriptions',
  'Returns recurring amount from the permission details',
  'Use testnet: true for Base Sepolia subscriptions',
];

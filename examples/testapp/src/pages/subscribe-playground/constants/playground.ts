export const DEFAULT_SUBSCRIBE_CODE = `import { base } from '@base-org/account'

try {
  const subscription = await base.subscription.subscribe({
    recurringCharge: "10.50",
    subscriptionOwner: "0xFe21034794A5a574B94fE4fDfD16e005F1C96e51", // Your app's address
    periodInDays: 30,
    testnet: true
  })
  
  return subscription;
} catch (error) {
  console.error('Subscription failed:', error.message);
  throw error;
}`;

export const SUBSCRIBE_CODE_WITH_TEST_PERIOD = `import { base } from '@base-org/account'

try {
  const subscription = await base.subscription.subscribe({
    recurringCharge: "0.01",
    subscriptionOwner: "0xFe21034794A5a574B94fE4fDfD16e005F1C96e51", // Your app's address
    overridePeriodInSecondsForTestnet: 300, // 5 minutes for testing - (only works on testnet)
    testnet: true
  })
  
  return subscription;
} catch (error) {
  console.error('Subscription failed:', error.message);
  throw error;
}`;

export const DEFAULT_GET_SUBSCRIPTION_STATUS_CODE = `import { base } from '@base-org/account'

try {
  const result = await base.subscription.getStatus({
    id: '0x...', // Automatically filled with your recent subscription
    testnet: true
  })
  
  return result;
} catch (error) {
  console.error('Failed to check subscription status:', error.message);
  throw error;
}`;

export const SUBSCRIBE_QUICK_TIPS = [
  'Get testnet USDC at <a href="https://faucet.circle.com/" target="_blank" rel="noopener noreferrer">https://faucet.circle.com/</a> - select "Base Sepolia" as the network',
  'subscriptionOwner is your application\'s address that will control the subscription',
  'recurringCharge is the amount of USDC to charge per period (e.g., "10.50" = $10.50)',
  'periodInDays sets the billing cycle (default: 30 days)',
  'overridePeriodInSecondsForTestnet allows faster testing cycles on testnet only',
  'The user can revoke the subscription at any time through their wallet',
];

export const GET_SUBSCRIPTION_STATUS_QUICK_TIPS = [
  'Use the subscription ID returned from the subscribe function',
  'isSubscribed indicates if the subscription is active (not revoked)',
  'remainingChargeInPeriod shows how much can still be charged this period',
  'nextPeriodStart shows when the next billing period begins',
  'currentPeriodStart shows when the current billing period started',
  'Make sure to use the same testnet setting as the original subscription',
];

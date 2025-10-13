# Subscribe Playground

An interactive testing environment for the Base Account SDK's subscription functionality.

## Features

### subscribe Function
- Create recurring USDC subscriptions on Base
- Two testing variants:
  - **Default**: Standard 30-day subscription period
  - **Test Mode**: 5-minute periods for faster testing (testnet only)

### getSubscriptionStatus Function
- Check the status of any subscription
- Automatically populated with recent subscription IDs
- Shows subscription details including:
  - Active/revoked status
  - Remaining charge in current period
  - Next billing period start date
  - Subscription owner information

## Getting Started

1. Navigate to `/subscribe-playground` in the testapp
2. Get testnet USDC from [Circle's faucet](https://faucet.circle.com/) (select "Base Sepolia")
3. Modify the code in the editor to customize your subscription parameters
4. Click "Execute Code" to run the subscription
5. Use the returned subscription ID to check status

## Code Examples

### Basic Subscription
```typescript
await base.subscribe({
  recurringCharge: "10.50",
  subscriptionOwner: "0xYourAppAddress",
  periodInDays: 30,
  testnet: true
})
```

### Test Mode with Short Period
```typescript
await base.subscribe({
  recurringCharge: "0.01",
  subscriptionOwner: "0xYourAppAddress",
  overridePeriodInSecondsForTestnet: 300, // 5 minutes
  testnet: true
})
```

## Important Notes

- All subscriptions use USDC on Base (mainnet) or Base Sepolia (testnet)
- Users can revoke subscriptions at any time through their wallet
- The `subscriptionOwner` is your application's address that controls the subscription
- Test mode with custom periods only works on testnet

## Security

This playground is intended for testing purposes only. Never paste code from untrusted sources. Testnet funds hold no real value.

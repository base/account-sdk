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

export const DEFAULT_PAY_WITH_TOKEN_CODE = `import { base } from '@base-org/account'

try {
  const result = await base.payWithToken({
    amount: '1000000', // 1 token (in smallest unit, e.g., 1 USDC = 1000000 for 6 decimals)
    to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    token: 'USDC',
    testnet: true, // Use Base Sepolia for testing. Set to false for Base mainnet
    paymaster: {
      url: 'https://paymaster.example.com'
    }
  })
  
  return result;
} catch (error) {
  console.error('Token payment failed:', error.message);
  throw error;
}`;

export const PAY_WITH_TOKEN_CODE_WITH_PAYER_INFO = `import { base } from '@base-org/account'

try {
  const result = await base.payWithToken({
    amount: '1000000', // 1 token (in smallest unit, e.g., 1 USDC = 1000000 for 6 decimals)
    to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    token: 'USDC',
    testnet: true, // Use Base Sepolia for testing. Set to false for Base mainnet
    paymaster: {
      url: 'https://paymaster.example.com'
    },
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
  console.error('Token payment failed:', error.message);
  throw error;
}`;

export const DEFAULT_GET_PAYMENT_STATUS_CODE = `import { base } from '@base-org/account'

try {
  const result = await base.getPaymentStatus({
    id: '0x...', // Replace with a transaction ID
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
  'Need other ERC20s? Use base.payWithToken with a token and paymaster configuration (amounts are specified in wei). testnet parameter supports Base or Base Sepolia only.',
];

export const GET_PAYMENT_STATUS_QUICK_TIPS = [
  'Use an `id` returned from the pay function',
  'Status can be: pending, completed, failed, or not_found',
  'For completed payments, you can see the amount and recipient',
  'For failed payments, you can see the failure reason',
  'Make sure to use the same testnet setting as the original payment',
];

export const PAY_WITH_TOKEN_QUICK_TIPS = [
  "Amount is specified in the token's smallest unit (e.g., wei for ETH, or smallest unit for ERC20 tokens)",
  'For USDC (6 decimals), 1 USDC = 1000000',
  'For tokens with 18 decimals, 1 token = 1000000000000000000',
  'Token can be a contract address or a supported symbol (e.g., "USDC", "WETH")',
  'testnet parameter toggles between Base mainnet (false) and Base Sepolia (true)',
  'paymaster.url is required - configure your paymaster service',
  'Use payerInfo to request user information.',
  'Only Base and Base Sepolia are supported',
];

// Preset configurations for payWithToken
export interface PayWithTokenPreset {
  name: string;
  description: string;
  code: string;
}

export const PAY_WITH_TOKEN_PRESETS: PayWithTokenPreset[] = [
  {
    name: 'USDC on Base Mainnet',
    description: 'Send 1 USDC on Base mainnet',
    code: `import { base } from '@base-org/account'

try {
  const result = await base.payWithToken({
    amount: '1000000', // 1 USDC (6 decimals)
    to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    token: 'USDC',
    testnet: false, // Base mainnet
    paymaster: {
      url: 'https://paymaster.example.com'
    }
  })
  
  return result;
} catch (error) {
  console.error('Token payment failed:', error.message);
  throw error;
}`,
  },
  {
    name: 'USDC on Base Sepolia',
    description: 'Send 1 USDC on Base Sepolia testnet',
    code: `import { base} from '@base-org/account'

try {
  const result = await base.payWithToken({
    amount: '1000000', // 1 USDC (6 decimals)
    to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    token: 'USDC',
    testnet: true, // Base Sepolia
    paymaster: {
      url: 'https://paymaster.example.com'
    }
  })
  
  return result;
} catch (error) {
  console.error('Token payment failed:', error.message);
  throw error;
}`,
  },
  {
    name: 'USDT on Base Mainnet',
    description: 'Send 1 USDT on Base mainnet',
    code: `import { base } from '@base-org/account'

try {
  const result = await base.payWithToken({
    amount: '1000000', // 1 USDT (6 decimals)
    to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    token: 'USDT',
    testnet: false, // Base mainnet
    paymaster: {
      url: 'https://paymaster.example.com'
    }
  })
  
  return result;
} catch (error) {
  console.error('Token payment failed:', error.message);
  throw error;
}`,
  },
  {
    name: 'DAI on Base Mainnet',
    description: 'Send 1 DAI on Base mainnet',
    code: `import { base } from '@base-org/account'

try {
  const result = await base.payWithToken({
    amount: '1000000000000000000', // 1 DAI (18 decimals)
    to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    token: 'DAI',
    testnet: false, // Base mainnet
    paymaster: {
      url: 'https://paymaster.example.com'
    }
  })
  
  return result;
} catch (error) {
  console.error('Token payment failed:', error.message);
  throw error;
}`,
  },
  {
    name: 'Custom Token on Base',
    description: 'Send tokens using a custom contract address on Base',
    code: `import { base } from '@base-org/account'

try {
  const result = await base.payWithToken({
    amount: '1000000000000000000', // Amount in token's smallest unit
    to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    token: '0xYourTokenContractAddressHere', // Custom token address
    testnet: false, // Base mainnet
    paymaster: {
      url: 'https://paymaster.example.com'
    }
  })
  
  return result;
} catch (error) {
  console.error('Token payment failed:', error.message);
  throw error;
}`,
  },
];

export const QUICK_TIPS = PAY_QUICK_TIPS;

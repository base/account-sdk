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
    paymaster: {
      url: 'https://paymaster.example.com'
    }
    // chainId defaults to Base mainnet (8453) if not specified
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
    // chainId defaults to Base mainnet (8453) if not specified
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
  'Need other ERC20s? Use base.payWithToken with a token and paymaster configuration (amounts are specified in wei). chainId defaults to Base if not specified.',
];

export const GET_PAYMENT_STATUS_QUICK_TIPS = [
  'Use an `id` returned from the pay function',
  'Status can be: pending, completed, failed, or not_found',
  'For completed payments, you can see the amount and recipient',
  'For failed payments, you can see the failure reason',
  'Make sure to use the same testnet setting as the original payment',
];

export const PAY_WITH_TOKEN_QUICK_TIPS = [
  'Amount is specified in the token\'s smallest unit (e.g., wei for ETH, or smallest unit for ERC20 tokens)',
  'For USDC (6 decimals), 1 USDC = 1000000',
  'For tokens with 18 decimals, 1 token = 1000000000000000000',
  'Token can be a contract address or a supported symbol (e.g., "USDC", "WETH")',
  'chainId is optional and defaults to Base mainnet (8453). Specify chainId for other networks.',
  'paymaster.url is required - configure your paymaster service',
  'Use payerInfo to request user information.',
  'Supported tokens vary by chain - check token registry for available options',
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
    paymaster: {
      url: 'https://paymaster.example.com'
    }
    // chainId defaults to Base mainnet (8453)
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
    code: `import { base } from '@base-org/account'

try {
  const result = await base.payWithToken({
    amount: '1000000', // 1 USDC (6 decimals)
    to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    chainId: '0x14a34', // Base Sepolia (84532)
    token: 'USDC',
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
    name: 'USDC on Optimism Sepolia',
    description: 'Send 1 USDC on Optimism Sepolia testnet',
    code: `import { base } from '@base-org/account'

try {
  const result = await base.payWithToken({
    amount: '1000000', // 1 USDC (6 decimals)
    to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    chainId: '0xaa37dc', // Optimism Sepolia (11155420)
    token: 'USDC',
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
    name: 'USDC on Arbitrum Sepolia',
    description: 'Send 1 USDC on Arbitrum Sepolia testnet',
    code: `import { base } from '@base-org/account'

try {
  const result = await base.payWithToken({
    amount: '1000000', // 1 USDC (6 decimals)
    to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    chainId: '0x66eee', // Arbitrum Sepolia (421614)
    token: 'USDC',
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
    name: 'USDC on Polygon Amoy',
    description: 'Send 1 USDC on Polygon Amoy testnet',
    code: `import { base } from '@base-org/account'

try {
  const result = await base.payWithToken({
    amount: '1000000', // 1 USDC (6 decimals)
    to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    chainId: '0x13882', // Polygon Amoy (80002)
    token: 'USDC',
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
    name: 'USDC on Avalanche Fuji',
    description: 'Send 1 USDC on Avalanche Fuji testnet',
    code: `import { base } from '@base-org/account'

try {
  const result = await base.payWithToken({
    amount: '1000000', // 1 USDC (6 decimals)
    to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    chainId: '0xa869', // Avalanche Fuji (43113)
    token: 'USDC',
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
    name: 'USDC on BSC Testnet',
    description: 'Send 1 USDC on BSC testnet',
    code: `import { base } from '@base-org/account'

try {
  const result = await base.payWithToken({
    amount: '1000000', // 1 USDC (6 decimals)
    to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    chainId: '0x61', // BSC Testnet (97)
    token: 'USDC',
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
    name: 'USDC on Ethereum Sepolia',
    description: 'Send 1 USDC on Ethereum Sepolia testnet',
    code: `import { base } from '@base-org/account'

try {
  const result = await base.payWithToken({
    amount: '1000000', // 1 USDC (6 decimals)
    to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    chainId: '0xaa36a7', // Ethereum Sepolia (11155111)
    token: 'USDC',
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
    paymaster: {
      url: 'https://paymaster.example.com'
    }
    // chainId defaults to Base mainnet (8453)
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
    paymaster: {
      url: 'https://paymaster.example.com'
    }
    // chainId defaults to Base mainnet (8453)
  })
  
  return result;
} catch (error) {
  console.error('Token payment failed:', error.message);
  throw error;
}`,
  },
  {
    name: 'USDC on Optimism',
    description: 'Send 1 USDC on Optimism',
    code: `import { base } from '@base-org/account'

try {
  const result = await base.payWithToken({
    amount: '1000000', // 1 USDC (6 decimals)
    to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    chainId: '0xa', // Optimism (10)
    token: 'USDC',
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
    name: 'USDC on Arbitrum',
    description: 'Send 1 USDC on Arbitrum',
    code: `import { base } from '@base-org/account'

try {
  const result = await base.payWithToken({
    amount: '1000000', // 1 USDC (6 decimals)
    to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    chainId: '0xa4b1', // Arbitrum (42161)
    token: 'USDC',
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
    name: 'USDT on Optimism',
    description: 'Send 1 USDT on Optimism',
    code: `import { base } from '@base-org/account'

try {
  const result = await base.payWithToken({
    amount: '1000000', // 1 USDT (6 decimals)
    to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    chainId: '0xa', // Optimism (10)
    token: 'USDT',
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
    name: 'USDT on Arbitrum',
    description: 'Send 1 USDT on Arbitrum',
    code: `import { base } from '@base-org/account'

try {
  const result = await base.payWithToken({
    amount: '1000000', // 1 USDT (6 decimals)
    to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    chainId: '0xa4b1', // Arbitrum (42161)
    token: 'USDT',
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
    name: 'DAI on Optimism',
    description: 'Send 1 DAI on Optimism',
    code: `import { base } from '@base-org/account'

try {
  const result = await base.payWithToken({
    amount: '1000000000000000000', // 1 DAI (18 decimals)
    to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    chainId: '0xa', // Optimism (10)
    token: 'DAI',
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
    name: 'DAI on Arbitrum',
    description: 'Send 1 DAI on Arbitrum',
    code: `import { base } from '@base-org/account'

try {
  const result = await base.payWithToken({
    amount: '1000000000000000000', // 1 DAI (18 decimals)
    to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    chainId: '0xa4b1', // Arbitrum (42161)
    token: 'DAI',
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
    name: 'USDC on Ethereum',
    description: 'Send 1 USDC on Ethereum mainnet',
    code: `import { base } from '@base-org/account'

try {
  const result = await base.payWithToken({
    amount: '1000000', // 1 USDC (6 decimals)
    to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    chainId: '0x1', // Ethereum mainnet (1)
    token: 'USDC',
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
    name: 'USDT on Ethereum',
    description: 'Send 1 USDT on Ethereum mainnet',
    code: `import { base } from '@base-org/account'

try {
  const result = await base.payWithToken({
    amount: '1000000', // 1 USDT (6 decimals)
    to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    chainId: '0x1', // Ethereum mainnet (1)
    token: 'USDT',
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
    name: 'DAI on Ethereum',
    description: 'Send 1 DAI on Ethereum mainnet',
    code: `import { base } from '@base-org/account'

try {
  const result = await base.payWithToken({
    amount: '1000000000000000000', // 1 DAI (18 decimals)
    to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    chainId: '0x1', // Ethereum mainnet (1)
    token: 'DAI',
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
    name: 'USDC on Polygon',
    description: 'Send 1 USDC on Polygon',
    code: `import { base } from '@base-org/account'

try {
  const result = await base.payWithToken({
    amount: '1000000', // 1 USDC (6 decimals)
    to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    chainId: '0x89', // Polygon (137)
    token: 'USDC',
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
    name: 'USDT on Polygon',
    description: 'Send 1 USDT on Polygon',
    code: `import { base } from '@base-org/account'

try {
  const result = await base.payWithToken({
    amount: '1000000', // 1 USDT (6 decimals)
    to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    chainId: '0x89', // Polygon (137)
    token: 'USDT',
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
    name: 'DAI on Polygon',
    description: 'Send 1 DAI on Polygon',
    code: `import { base } from '@base-org/account'

try {
  const result = await base.payWithToken({
    amount: '1000000000000000000', // 1 DAI (18 decimals)
    to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    chainId: '0x89', // Polygon (137)
    token: 'DAI',
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
    name: 'USDC on Avalanche',
    description: 'Send 1 USDC on Avalanche C-Chain',
    code: `import { base } from '@base-org/account'

try {
  const result = await base.payWithToken({
    amount: '1000000', // 1 USDC (6 decimals)
    to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    chainId: '0xa86a', // Avalanche C-Chain (43114)
    token: 'USDC',
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
    name: 'USDT on Avalanche',
    description: 'Send 1 USDT on Avalanche C-Chain',
    code: `import { base } from '@base-org/account'

try {
  const result = await base.payWithToken({
    amount: '1000000', // 1 USDT (6 decimals)
    to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    chainId: '0xa86a', // Avalanche C-Chain (43114)
    token: 'USDT',
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
    name: 'DAI on Avalanche',
    description: 'Send 1 DAI on Avalanche C-Chain',
    code: `import { base } from '@base-org/account'

try {
  const result = await base.payWithToken({
    amount: '1000000000000000000', // 1 DAI (18 decimals)
    to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    chainId: '0xa86a', // Avalanche C-Chain (43114)
    token: 'DAI',
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
    name: 'USDC on BSC',
    description: 'Send 1 USDC on Binance Smart Chain',
    code: `import { base } from '@base-org/account'

try {
  const result = await base.payWithToken({
    amount: '1000000', // 1 USDC (6 decimals)
    to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    chainId: '0x38', // BSC (56)
    token: 'USDC',
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
    name: 'USDT on BSC',
    description: 'Send 1 USDT on Binance Smart Chain',
    code: `import { base } from '@base-org/account'

try {
  const result = await base.payWithToken({
    amount: '1000000', // 1 USDT (6 decimals)
    to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    chainId: '0x38', // BSC (56)
    token: 'USDT',
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
    name: 'DAI on BSC',
    description: 'Send 1 DAI on Binance Smart Chain',
    code: `import { base } from '@base-org/account'

try {
  const result = await base.payWithToken({
    amount: '1000000000000000000', // 1 DAI (18 decimals)
    to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    chainId: '0x38', // BSC (56)
    token: 'DAI',
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
    name: 'Custom Token Address',
    description: 'Send tokens using a custom contract address',
    code: `import { base } from '@base-org/account'

try {
  const result = await base.payWithToken({
    amount: '1000000000000000000', // Amount in token's smallest unit
    to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    token: '0xYourTokenContractAddressHere', // Custom token address
    paymaster: {
      url: 'https://paymaster.example.com'
    }
    // chainId defaults to Base mainnet (8453), specify a different one if needed
  })
  
  return result;
} catch (error) {
  console.error('Token payment failed:', error.message);
  throw error;
}`,
  },
];

export const QUICK_TIPS = PAY_QUICK_TIPS;

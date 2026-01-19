# Security Best Practices

This guide covers essential security patterns and best practices when building applications with the Base Account SDK. Following these guidelines will help you avoid common pitfalls and build more secure applications.

## Table of Contents

- [Transaction Security](#transaction-security)
  - [Safe Nonce Management](#safe-nonce-management)
  - [Gas Estimation with Safety Buffers](#gas-estimation-with-safety-buffers)
  - [Multi-Confirmation Verification](#multi-confirmation-verification)
- [Smart Contract Interactions](#smart-contract-interactions)
  - [Reentrancy Protection](#reentrancy-protection)
  - [EIP-712 Typed Data Signing](#eip-712-typed-data-signing)
- [General Security Guidelines](#general-security-guidelines)

---

## Transaction Security

### Safe Nonce Management

Always fetch the pending nonce before sending transactions to prevent nonce conflicts and stuck transactions.

```typescript
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

async function sendTransactionSafely(
  walletClient: WalletClient,
  transaction: TransactionRequest
) {
  const address = walletClient.account.address;

  // Always use 'pending' to account for in-flight transactions
  const nonce = await publicClient.getTransactionCount({
    address,
    blockTag: 'pending',
  });

  const hash = await walletClient.sendTransaction({
    ...transaction,
    nonce,
  });

  return hash;
}
```

**Why this matters:**
- Using `'latest'` instead of `'pending'` can cause nonce collisions
- Concurrent transactions without proper nonce management can fail or get stuck
- Always track pending transactions in your application state

### Gas Estimation with Safety Buffers

Never rely solely on estimated gas. Always add a safety buffer to prevent out-of-gas failures.

```typescript
import { createPublicClient, http, parseEther } from 'viem';
import { base } from 'viem/chains';

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

async function estimateGasWithBuffer(
  transaction: TransactionRequest,
  bufferPercentage: number = 20
): Promise<bigint> {
  const estimatedGas = await publicClient.estimateGas(transaction);

  // Add safety buffer (default 20%)
  const buffer = (estimatedGas * BigInt(bufferPercentage)) / 100n;
  const safeGasLimit = estimatedGas + buffer;

  return safeGasLimit;
}

// Usage example
async function sendWithSafeGas(
  walletClient: WalletClient,
  to: `0x${string}`,
  value: bigint
) {
  const transaction = {
    to,
    value,
    account: walletClient.account,
  };

  const gasLimit = await estimateGasWithBuffer(transaction);

  const hash = await walletClient.sendTransaction({
    ...transaction,
    gas: gasLimit,
  });

  return hash;
}
```

**Recommended buffer sizes:**
- Simple transfers: 10-20%
- Contract interactions: 20-30%
- Complex multi-call operations: 30-50%

### Multi-Confirmation Verification

Always wait for sufficient block confirmations before updating your application state, especially for high-value transactions.

```typescript
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

interface ConfirmationConfig {
  hash: `0x${string}`;
  requiredConfirmations: number;
  onConfirmation?: (confirmations: number) => void;
  timeout?: number;
}

async function waitForConfirmations({
  hash,
  requiredConfirmations,
  onConfirmation,
  timeout = 300000, // 5 minutes default
}: ConfirmationConfig): Promise<TransactionReceipt> {
  const startTime = Date.now();

  // First, wait for the transaction to be mined
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  if (receipt.status === 'reverted') {
    throw new Error('Transaction reverted');
  }

  // Then wait for additional confirmations
  let currentConfirmations = 0;

  while (currentConfirmations < requiredConfirmations) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Confirmation timeout exceeded');
    }

    const latestBlock = await publicClient.getBlockNumber();
    currentConfirmations = Number(latestBlock - receipt.blockNumber) + 1;

    onConfirmation?.(currentConfirmations);

    if (currentConfirmations < requiredConfirmations) {
      // Wait for next block (~2 seconds on Base)
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  return receipt;
}

// Usage example
async function processPaymentWithConfirmations(hash: `0x${string}`) {
  try {
    const receipt = await waitForConfirmations({
      hash,
      requiredConfirmations: 5,
      onConfirmation: (count) => {
        console.log(`Confirmation ${count}/5`);
        // Update UI with confirmation progress
      },
    });

    // Safe to update application state now
    console.log('Payment confirmed:', receipt.transactionHash);
    return receipt;
  } catch (error) {
    console.error('Payment failed:', error);
    throw error;
  }
}
```

**Recommended confirmation counts:**
- Low-value transactions: 1-2 confirmations
- Medium-value transactions: 3-5 confirmations
- High-value transactions: 10+ confirmations

---

## Smart Contract Interactions

### Reentrancy Protection

When building contracts that interact with the SDK, always implement reentrancy guards.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SecurePaymentProcessor is ReentrancyGuard {
    mapping(address => uint256) public balances;

    // Always use nonReentrant modifier for functions that transfer value
    function withdraw(uint256 amount) external nonReentrant {
        require(balances[msg.sender] >= amount, "Insufficient balance");

        // Update state BEFORE external call (Checks-Effects-Interactions pattern)
        balances[msg.sender] -= amount;

        // External call after state update
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }
}
```

**Client-side protection pattern:**

```typescript
// Prevent double-submission in your frontend
class TransactionManager {
  private pendingTransactions = new Set<string>();

  async executeTransaction(
    key: string,
    txFunction: () => Promise<`0x${string}`>
  ): Promise<`0x${string}`> {
    if (this.pendingTransactions.has(key)) {
      throw new Error('Transaction already pending');
    }

    this.pendingTransactions.add(key);

    try {
      const hash = await txFunction();
      return hash;
    } finally {
      this.pendingTransactions.delete(key);
    }
  }
}

// Usage
const txManager = new TransactionManager();

async function handlePayment(amount: string) {
  const txKey = `payment-${Date.now()}`;

  return txManager.executeTransaction(txKey, async () => {
    // Your transaction logic here
    return walletClient.sendTransaction({ /* ... */ });
  });
}
```

### EIP-712 Typed Data Signing

Use EIP-712 for structured data signing to prevent replay attacks and provide clear signing context to users.

```typescript
import { createWalletClient, custom } from 'viem';
import { base } from 'viem/chains';

// Define your typed data structure
const domain = {
  name: 'Base Account App',
  version: '1',
  chainId: base.id,
  verifyingContract: '0xYourContractAddress' as `0x${string}`,
} as const;

const types = {
  Payment: [
    { name: 'recipient', type: 'address' },
    { name: 'amount', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const;

interface PaymentMessage {
  recipient: `0x${string}`;
  amount: bigint;
  nonce: bigint;
  deadline: bigint;
}

async function signPaymentAuthorization(
  walletClient: WalletClient,
  message: PaymentMessage
): Promise<`0x${string}`> {
  const signature = await walletClient.signTypedData({
    domain,
    types,
    primaryType: 'Payment',
    message,
  });

  return signature;
}

// Usage with deadline for replay protection
async function createSignedPayment(
  walletClient: WalletClient,
  recipient: `0x${string}`,
  amount: bigint
) {
  const nonce = await fetchUserNonce(walletClient.account.address);

  // Set deadline to 1 hour from now
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

  const message: PaymentMessage = {
    recipient,
    amount,
    nonce,
    deadline,
  };

  const signature = await signPaymentAuthorization(walletClient, message);

  return {
    message,
    signature,
  };
}
```

**Key security considerations for EIP-712:**
- Always include `chainId` in the domain to prevent cross-chain replay attacks
- Include a `nonce` to prevent same-chain replay attacks
- Include a `deadline` for time-limited signatures
- Use `verifyingContract` to bind signatures to specific contracts

---

## General Security Guidelines

### 1. Input Validation

Always validate user inputs before processing transactions:

```typescript
import { isAddress, parseEther } from 'viem';

function validatePaymentInput(to: string, amount: string): void {
  // Validate address format
  if (!isAddress(to)) {
    throw new Error('Invalid recipient address');
  }

  // Validate amount
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw new Error('Invalid amount');
  }

  // Check for reasonable maximum
  if (parsedAmount > 1000000) {
    throw new Error('Amount exceeds maximum limit');
  }
}
```

### 2. Error Handling

Implement comprehensive error handling without exposing sensitive information:

```typescript
async function safeTransactionExecution<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    // Log full error internally
    console.error(`[${context}] Transaction error:`, error);

    // Return user-friendly error
    if (error instanceof Error) {
      if (error.message.includes('insufficient funds')) {
        throw new Error('Insufficient balance for this transaction');
      }
      if (error.message.includes('user rejected')) {
        throw new Error('Transaction was cancelled');
      }
      if (error.message.includes('nonce')) {
        throw new Error('Transaction conflict. Please try again.');
      }
    }

    throw new Error('Transaction failed. Please try again later.');
  }
}
```

### 3. Rate Limiting

Implement client-side rate limiting to prevent abuse:

```typescript
class RateLimiter {
  private requests: number[] = [];

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  canProceed(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(
      (timestamp) => now - timestamp < this.windowMs
    );

    if (this.requests.length >= this.maxRequests) {
      return false;
    }

    this.requests.push(now);
    return true;
  }
}

// Allow 10 transactions per minute
const txRateLimiter = new RateLimiter(10, 60000);

async function rateLimitedTransaction(txFn: () => Promise<void>) {
  if (!txRateLimiter.canProceed()) {
    throw new Error('Too many transactions. Please wait before trying again.');
  }

  return txFn();
}
```

### 4. Secure Storage

Never store sensitive data in localStorage or expose private keys:

```typescript
// NEVER do this
localStorage.setItem('privateKey', key); // UNSAFE!

// Instead, rely on wallet providers for key management
// The SDK handles this securely through the provider interface
```

---

## Security Checklist

Before deploying your application, verify:

- [ ] All transaction functions use pending nonce
- [ ] Gas estimates include appropriate safety buffers
- [ ] High-value transactions wait for multiple confirmations
- [ ] Smart contracts implement reentrancy guards
- [ ] EIP-712 signatures include chainId, nonce, and deadline
- [ ] User inputs are validated before processing
- [ ] Errors are handled without exposing sensitive data
- [ ] Rate limiting is implemented for transaction functions
- [ ] No sensitive data is stored in browser storage

## Reporting Security Issues

If you discover a security vulnerability, please report it responsibly:

1. **Do not** open a public GitHub issue
2. Email security concerns to [security@base.org](mailto:security@base.org)
3. Include detailed steps to reproduce the vulnerability
4. Allow reasonable time for the team to address the issue

---

## Additional Resources

- [Base Security Documentation](https://docs.base.org/security)
- [OpenZeppelin Security Best Practices](https://docs.openzeppelin.com/contracts/5.x/security)
- [Ethereum Smart Contract Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [EIP-712 Specification](https://eips.ethereum.org/EIPS/eip-712)

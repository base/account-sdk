# Security Best Practices Guide

This document outlines security recommendations and code patterns for developers using the **Base Account SDK**.

The goal is to provide secure defaults and practical examples to help avoid common pitfalls when building production-grade dApps.

---

## 1. Nonce Management

Always ensure transactions use the **latest pending nonce** to prevent collisions when multiple transactions are being signed concurrently.

```ts
import { Wallet } from "@base/account-sdk";

export async function safeSend(wallet: Wallet, tx: any) {
  // Always use the 'pending' nonce to include unmined txs
  const nonce = await wallet.getNonce("pending");

  const signed = await wallet.signTransaction({ ...tx, nonce });
  return wallet.sendTransaction(signed);
}
```

✅ **Why**: Prevents nonce reuse and transaction replacement issues.

---

## 2. Gas Estimation Buffer

Underestimation of gas can cause transactions to fail. Always add a buffer to estimated gas limits.

```ts
export async function estimateGasWithBuffer(wallet: Wallet, tx: any, buffer = 1.2) {
  const estimated = await wallet.estimateGas(tx);
  return Math.ceil(Number(estimated) * buffer);
}
```

✅ **Why**: Network congestion and contract logic can make base estimates insufficient.

---

## 3. Confirmation Handling

Wait for **multiple confirmations** before updating critical UI states or balances.

```ts
export async function waitForConfirmations(txHash: string, provider: any, confirmations = 2) {
  const receipt = await provider.waitForTransaction(txHash, confirmations);
  return receipt;
}
```

✅ **Why**: Avoids false-positive UI states due to chain reorgs or delayed finality.

---

## 4. Replay Attack Prevention (EIP-712)

Always use **domain separation** when signing EIP-712 typed data.

```ts
const domain = {
  name: "MyDApp",
  version: "1",
  chainId: 8453, // Base mainnet
  verifyingContract: contractAddress,
};
```

✅ **Why**: Ensures signatures are not valid across different domains or networks.

---

## 5. Reentrancy Protection (Solidity)

When writing contracts, guard sensitive functions with a reentrancy lock.

```solidity
pragma solidity ^0.8.0;

contract SecureVault {
    bool private locked;

    modifier noReentrancy() {
        require(!locked, "Reentrancy detected");
        locked = true;
        _;
        locked = false;
    }

    function withdraw(uint256 amount) external noReentrancy {
        // safe logic here
    }
}
```

✅ **Why**: Prevents recursive calls that could drain contract funds.

---

## 6. Example Workflow

Example combining nonce safety, gas buffering, and confirmation waiting:

```ts
import { Wallet } from "@base/account-sdk";
import { safeSend, estimateGasWithBuffer, waitForConfirmations } from "./utils";

async function sendSecureTx(wallet: Wallet, tx: any, provider: any) {
  const gasLimit = await estimateGasWithBuffer(wallet, tx);
  const response = await safeSend(wallet, { ...tx, gasLimit });
  const receipt = await waitForConfirmations(response.hash, provider);
  return receipt;
}
```

---

## 7. Checklist Before Production

| Check | Description |
|-------|-------------|
| ✅ | Nonce management using `getNonce('pending')` |
| ✅ | Gas limit buffer (≥ 1.1×) |
| ✅ | Wait for ≥ 2 confirmations |
| ✅ | EIP-712 domain separation |
| ✅ | Avoid unguarded reentrancy |
| ✅ | Catch and handle all async errors |

---

## 8. Contributing

When adding new SDK examples or utilities, ensure they:
- Follow these security guidelines.
- Include input validation.
- Provide unit tests where possible.

---


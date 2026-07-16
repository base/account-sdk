# Easy Account Access Guide

## Overview

The Easy Account Access utility provides a simplified interface for quick and secure account access to your Base Account SDK. This feature streamlines authentication and session management, making it easier to interact with your account.

## Features

✅ **Simplified Authentication** - Quick login without complex setup  
✅ **Token Management** - Automatic token generation and validation  
✅ **Session Caching** - Keep track of active sessions  
✅ **Auto-Expiry** - Tokens automatically expire after set time  
✅ **Easy Logout** - Clear sessions with one command  

## Installation

The Easy Account Access utility is included in the `@base-org/account` package. Simply import it:

```typescript
import {
  createEasyAccessClient,
  easyLogin,
  easyLogout,
  getCurrentSession,
} from '@base-org/account/utils/easyAccess';
```

## Quick Start

### 1. Create a Client

```typescript
import { createEasyAccessClient } from '@base-org/account/utils/easyAccess';

const client = createEasyAccessClient({
  address: '0x1234567890123456789012345678901234567890',
  rpcUrl: 'https://mainnet.base.org', // Optional, uses default if not provided
});
```

### 2. Login

```typescript
import { easyLogin } from '@base-org/account/utils/easyAccess';

// Login with a 24-hour expiry (default)
const token = await easyLogin('0x1234567890123456789012345678901234567890');

console.log(token);
// {
//   token: '0x1234...abc-1721178704000-x7k9m2z',
//   expiresAt: 1721265104000,
//   address: '0x1234567890123456789012345678901234567890'
// }
```

### 3. Check Current Session

```typescript
import { getCurrentSession } from '@base-org/account/utils/easyAccess';

const session = getCurrentSession('0x1234567890123456789012345678901234567890');

if (session) {
  console.log('You are logged in!');
  console.log(`Token expires at: ${new Date(session.expiresAt)}`);
} else {
  console.log('No active session');
}
```

### 4. Logout

```typescript
import { easyLogout } from '@base-org/account/utils/easyAccess';

easyLogout('0x1234567890123456789012345678901234567890');
console.log('Logged out successfully');
```

## API Reference

### `createEasyAccessClient(config: AccountConfig)`

Creates a client for Base Account operations.

**Parameters:**
- `config.privateKey` (optional): Private key for wallet operations
- `config.address` (optional): Account address
- `config.rpcUrl` (optional): Custom RPC URL (defaults to Base mainnet)

**Returns:** Object with `publicClient`, `walletClient`, and `config`

---

### `easyLogin(address: string, expiryHours?: number)`

Authenticate and create a session token.

**Parameters:**
- `address`: Your account address
- `expiryHours` (optional): Token expiry in hours (default: 24)

**Returns:** `AccessToken` object

---

### `easyLogout(address: string)`

Clear the session for an address.

**Parameters:**
- `address`: The account address to logout

---

### `getCurrentSession(address: string)`

Retrieve the current active session.

**Parameters:**
- `address`: The account address

**Returns:** `AccessToken | null`

---

### `generateAccessToken(address: string, expiryHours?: number)`

Manually generate an access token.

**Parameters:**
- `address`: The account address
- `expiryHours` (optional): Token expiry in hours (default: 24)

**Returns:** `AccessToken` object

---

### `validateAccessToken(token: AccessToken)`

Check if a token is still valid.

**Parameters:**
- `token`: The access token to validate

**Returns:** `boolean`

---

## Usage Examples

### Example 1: Simple Web App Login

```typescript
import { easyLogin, getCurrentSession, easyLogout } from '@base-org/account/utils/easyAccess';

async function handleLogin(userAddress: string) {
  try {
    const token = await easyLogin(userAddress);
    localStorage.setItem('userToken', token.token);
    console.log('Login successful!');
  } catch (error) {
    console.error('Login failed:', error);
  }
}

function handleLogout(userAddress: string) {
  easyLogout(userAddress);
  localStorage.removeItem('userToken');
  console.log('Logged out');
}

function checkIfLoggedIn(userAddress: string) {
  const session = getCurrentSession(userAddress);
  return session !== null;
}
```

### Example 2: CLI with Easy Access

```typescript
import { createEasyAccessClient, easyLogin } from '@base-org/account/utils/easyAccess';

async function cliLogin(address: string) {
  const token = await easyLogin(address, 48); // 48-hour session
  const client = createEasyAccessClient({ address });

  // Use client for operations
  const balance = await client.publicClient.getBalance({ address });
  console.log(`Balance: ${balance}`);
}
```

### Example 3: Multi-Account Management

```typescript
import { easyLogin, getCurrentSession } from '@base-org/account/utils/easyAccess';

const accounts = [
  '0x1111111111111111111111111111111111111111',
  '0x2222222222222222222222222222222222222222',
  '0x3333333333333333333333333333333333333333',
];

async function loginAllAccounts() {
  for (const account of accounts) {
    await easyLogin(account);
  }
}

function checkAllSessions() {
  accounts.forEach(account => {
    const session = getCurrentSession(account);
    console.log(`${account}: ${session ? 'Active' : 'Inactive'}`);
  });
}
```

## Token Structure

```typescript
interface AccessToken {
  token: string;        // Unique token string
  expiresAt: number;    // Expiration timestamp (milliseconds)
  address: string;      // Associated wallet address
}
```

## Security Considerations

⚠️ **Important:**
- Never expose private keys in client-side code
- Always use HTTPS in production
- Tokens expire automatically
- Clear tokens on logout
- Validate tokens before operations
- Use environment variables for sensitive data

## Error Handling

```typescript
import { easyLogin, validateAccessToken } from '@base-org/account/utils/easyAccess';

async function safeLogin(address: string) {
  try {
    const token = await easyLogin(address);
    
    if (!validateAccessToken(token)) {
      console.error('Token is invalid or expired');
      return null;
    }
    
    return token;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}
```

## Troubleshooting

### Issue: Token expires too quickly

**Solution:** Increase the `expiryHours` parameter when logging in:
```typescript
const token = await easyLogin(address, 72); // 72 hours instead of 24
```

### Issue: Session not found

**Solution:** Check if the address matches and the token hasn't expired:
```typescript
const session = getCurrentSession(address);
if (!session) {
  console.log('Session not found, please login again');
  await easyLogin(address);
}
```

### Issue: Multiple accounts interfering

**Solution:** Ensure each logout targets the correct address:
```typescript
easyLogout(specificAddress); // Don't forget the address parameter
```

## Contributing

To contribute improvements to the Easy Account Access utility:

1. Create a feature branch
2. Make your changes
3. Run tests: `yarn test`
4. Format code: `yarn format`
5. Submit a pull request

## Support

For issues or questions:
- Open an issue on GitHub
- Check existing documentation
- Review example implementations

---

**Version:** 0.1.0  
**Last Updated:** 2026-07-16

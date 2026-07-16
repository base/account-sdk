# Easy Account Access - Implementation Guide

## Overview

This guide explains how the Easy Account Access utility is implemented and how to use it effectively in your projects.

## Architecture

### High-Level Structure

```
┌─────────────────────────────────────────┐
│   Application Layer                      │
│   (Your App using easyLogin, etc)       │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│   Easy Access API Layer                  │
│   - easyLogin()                         │
│   - easyLogout()                        │
│   - getCurrentSession()                 │
│   - Token Management                    │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│   Token Cache Layer                      │
│   - Token storage                       │
│   - Expiry checking                     │
│   - Multi-account support               │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│   Client Creation Layer                  │
│   - Viem Public Client                  │
│   - Viem Wallet Client                  │
└─────────────────────────────────────────┘
```

## Component Breakdown

### 1. Token Generation

```typescript
function generateAccessToken(address: string, expiryHours: number = 24): AccessToken
```

**How it works:**
1. Creates a unique token using crypto randomization
2. Combines with timestamp for uniqueness
3. Sets expiration time based on expiryHours
4. Returns AccessToken object with all metadata

**Why this approach:**
- Simple and reliable
- No external dependencies
- Unique per generation
- Configurable expiration

### 2. Token Validation

```typescript
function validateAccessToken(token: AccessToken): boolean
```

**How it works:**
1. Checks if token exists
2. Compares current time with expiresAt
3. Returns true only if not expired
4. Automatically rejects expired tokens

**Key point:** A token at its exact expiration time is considered expired.

### 3. Token Cache System

```typescript
class TokenCache {
  private cache: Map<string, AccessToken>
}
```

**Features:**
- Stores tokens by Ethereum address
- Automatic expiry checking on retrieval
- Removes expired tokens automatically
- Supports clearing all or expired-only

**Implementation:**
```typescript
get(address: string): AccessToken | undefined
  └─> Checks if token exists
      └─> Validates expiration
          └─> Returns token or undefined

set(token: AccessToken): void
  └─> Stores in Map by address

clear(): void
  └─> Clears entire cache

clearExpired(): void
  └─> Removes only expired tokens
```

### 4. Client Creation

```typescript
function createEasyAccessClient(config: EasyAccessConfig): EasyAccessClient
```

**Creates:**
1. **Public Client** - For reading blockchain data
   - Uses provided or default RPC URL
   - No signing capability
   - Read-only operations

2. **Wallet Client** (optional) - For signing transactions
   - Only created if private key provided
   - Enables transaction signing
   - Secure private key handling

### 5. Login Flow

```typescript
async function easyLogin(address: string, expiryHours?: number): Promise<AccessToken>
```

**Step-by-step process:**
1. Check cache for existing valid token
2. If found and not expired, return cached token
3. If not found or expired:
   - Generate new token
   - Store in cache
   - Return new token

**Flow diagram:**
```
Login Request
    │
    ├─> Check Cache
    │   ├─> Found & Valid? → Return cached token ✅
    │   └─> Not found or expired?
    │       └─> Generate new token
    │           ├─> Store in cache
    │           └─> Return new token ✅
```

### 6. Session Management

```typescript
function getCurrentSession(address: string): AccessToken | null
```

**Behavior:**
1. Retrieves token from cache
2. Validates it's not expired
3. Returns token if valid, null if not

**Use cases:**
- Check if user is logged in
- Verify session validity
- Access current token data

### 7. Logout

```typescript
function easyLogout(address: string): void
```

**Behavior:**
1. Removes token from cache
2. Clears session for that address
3. Doesn't throw errors if not found

## Data Structures

### AccessToken

```typescript
interface AccessToken {
  address: string;           // Ethereum address
  token: string;            // Unique token string
  expiresAt: number;        // Unix timestamp in ms
}
```

### EasyAccessConfig

```typescript
interface EasyAccessConfig {
  address: string;
  rpcUrl?: string;          // Optional custom RPC
  privateKey?: string;      // Optional for wallet client
}
```

### EasyAccessClient

```typescript
interface EasyAccessClient {
  publicClient: PublicClient;
  walletClient: WalletClient | null;
  config: EasyAccessConfig;
}
```

## Usage Patterns

### Pattern 1: Simple Login/Logout

```typescript
import { easyLogin, easyLogout } from '@base-org/account/utils';

// Login
const token = await easyLogin('0x1234...');
console.log('Token expires at:', token.expiresAt);

// Do work...

// Logout
easyLogout('0x1234...');
```

### Pattern 2: Session Checking

```typescript
import { getCurrentSession, easyLogin } from '@base-org/account/utils';

// Check if logged in
let session = getCurrentSession('0x1234...');
if (!session) {
  // Not logged in, so login
  session = await easyLogin('0x1234...');
}

// Use session
console.log('Using token:', session.token);
```

### Pattern 3: Multi-Account Management

```typescript
const accounts = [
  '0x1111...',
  '0x2222...',
  '0x3333...'
];

// Login all accounts
const tokens = await Promise.all(
  accounts.map(addr => easyLogin(addr))
);

// Check which are logged in
accounts.forEach(addr => {
  const session = getCurrentSession(addr);
  console.log(addr, ':', session ? 'logged in' : 'logged out');
});

// Logout all
accounts.forEach(addr => easyLogout(addr));
```

### Pattern 4: Custom Token Expiry

```typescript
// 48-hour token
const token = await easyLogin('0x1234...', 48);

// 1-hour token
const token = await easyLogin('0x1234...', 1);
```

## Implementation Details

### Token Uniqueness

Tokens are generated using:
```typescript
const uniquePart = crypto.randomUUID();
const timestamp = Date.now().toString();
const token = `${uniquePart}_${timestamp}`;
```

This ensures:
- ✅ Cryptographic randomness
- ✅ Timestamp uniqueness
- ✅ No collisions possible
- ✅ Deterministic but unpredictable

### Expiration Calculation

```typescript
expiresAt = Date.now() + (expiryHours * 60 * 60 * 1000);
```

Example:
- Default: 24 hours = 86,400,000 ms
- Custom: 48 hours = 172,800,000 ms

### Cache Storage

Implemented as a simple Map:
```typescript
private cache = new Map<string, AccessToken>();
```

**Why Map?**
- O(1) lookup time
- Fast insertion/deletion
- Native JavaScript support
- Memory efficient

### Error Handling

The implementation gracefully handles:
- Missing addresses
- Expired tokens
- Invalid configurations
- Missing cache entries

## Security Considerations

### 1. Token Storage
- ✅ In-memory only (no disk storage)
- ✅ Cleared on logout
- ✅ Cleared on process restart
- ✅ Auto-expires

### 2. Private Key Handling
- ✅ Optional parameter
- ✅ Only used if provided
- ✅ Never logged or exposed
- ✅ Not stored in token

### 3. Token Validation
- ✅ Expiration checked always
- ✅ Can't use expired tokens
- ✅ Auto-cleanup of expired

### 4. Recommendations
- Use HTTPS for API calls
- Don't log tokens
- Use environment variables for RPC URLs
- Implement rate limiting in production
- Consider persistent storage for recovery

## Performance Characteristics

### Time Complexity
- Login: O(1) - cached lookup
- Logout: O(1) - cache removal
- Session check: O(1) - cache lookup
- Token generation: O(1) - fixed operations

### Space Complexity
- Per token: ~100 bytes
- 100 tokens: ~10 KB
- 1000 tokens: ~100 KB

### Optimization Tips
1. Call `clearExpired()` periodically
2. Use `easyLogin` for caching
3. Check `getCurrentSession` before operations
4. Batch operations when possible

## Testing Strategy

### Unit Tests Cover

1. **Happy Path**
   - Login/logout flow
   - Token validation
   - Session retrieval

2. **Edge Cases**
   - Expired tokens
   - Missing entries
   - Concurrent operations

3. **Integration**
   - Complete workflows
   - Multi-account scenarios
   - Rapid cycles

### Test Execution

```bash
# Run all tests
yarn test

# Run with coverage
yarn test --coverage

# Run specific test file
yarn test easyAccess.test.ts

# Watch mode
yarn test --watch
```

## Troubleshooting

### Issue: Token always expired

**Cause:** System clock out of sync  
**Solution:** Check system time is correct

### Issue: Session not found

**Cause:** Different address used  
**Solution:** Use exact same address format

### Issue: Cache not clearing

**Cause:** Manual intervention needed  
**Solution:** Call `tokenCache.clear()` manually

## Future Enhancements

Potential improvements:
1. Persistent storage (localStorage, secure storage)
2. Refresh token mechanism
3. Multi-factor authentication
4. Rate limiting
5. Analytics/logging
6. Biometric authentication
7. OAuth/SSO integration

## Integration Checklist

- [ ] Import functions from `@base-org/account/utils`
- [ ] Implement easyLogin on app start
- [ ] Add easyLogout on app close
- [ ] Use getCurrentSession for status checks
- [ ] Handle token expiration gracefully
- [ ] Test with multiple accounts
- [ ] Verify security practices
- [ ] Monitor token cache size

## Best Practices

1. **Always check session before operations**
   ```typescript
   const session = getCurrentSession(address);
   if (!session) await easyLogin(address);
   ```

2. **Use appropriate token expiry**
   - Short-lived: 1-4 hours
   - Standard: 24 hours (default)
   - Long-lived: 48+ hours

3. **Clean up on app exit**
   ```typescript
   window.addEventListener('beforeunload', () => {
     easyLogout(currentAddress);
   });
   ```

4. **Handle concurrent operations**
   ```typescript
   const tokens = await Promise.all(
     addresses.map(addr => easyLogin(addr))
   );
   ```

## References

- See `EASY_ACCESS_GUIDE.md` for API reference
- See `easyAccess.test.ts` for usage examples
- See inline JSDoc comments for function details

---

**Last Updated:** 2026-07-16  
**Version:** 0.1.0  
**Status:** Complete

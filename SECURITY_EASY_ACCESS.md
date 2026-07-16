# Security Guide - Easy Account Access

## Overview

This guide covers security best practices, considerations, and recommendations when using the Easy Account Access utility.

## Security Features

### 1. Token Auto-Expiration

✅ **Default Behavior:** Tokens expire after 24 hours
✅ **Configurable:** Set custom expiration (1 hour to weeks)
✅ **Automatic Cleanup:** Expired tokens are automatically invalidated

```typescript
// Standard 24-hour expiration
const token = await easyLogin('0x1234...');

// Custom 1-hour expiration for sensitive operations
const shortToken = await easyLogin('0x1234...', 1);

// Longer expiration for trusted environments
const longToken = await easyLogin('0x1234...', 168); // 1 week
```

### 2. Token Validation

✅ **Always Validated:** Tokens checked before use
✅ **Expiry Checking:** Automatically rejects expired tokens
✅ **No Replay:** Each token is unique and non-reusable after logout

```typescript
// Automatically validates before use
const isValid = validateAccessToken(token);
if (!isValid) {
  // Token is expired or invalid
  await easyLogin(address); // Get new token
}
```

### 3. Secure Token Generation

✅ **Cryptographically Random:** Uses `crypto.randomUUID()`
✅ **Timestamp Included:** Prevents collisions
✅ **No Pattern:** Tokens are unpredictable

```typescript
// Token format: {UUID}_{timestamp}
// Example: 550e8400-e29b-41d4-a716-446655440000_1689567890123
```

### 4. In-Memory Storage

✅ **No Disk Persistence:** Tokens stored in RAM only
✅ **Process Isolation:** Each process has isolated cache
✅ **Automatic Cleanup:** Process restart clears all tokens

```typescript
// All tokens cleared on:
// - Process restart
// - Application reload (browser)
// - App close (mobile)
```

## Threat Mitigation

### 1. Token Theft

**Risk:** Attacker steals token and uses it

**Mitigations:**
- ✅ Short token lifetime (24 hours default)
- ✅ In-memory only storage
- ✅ Token validated on each use
- ✅ Logout clears token immediately

**Best Practice:**
```typescript
// Use shorter tokens for sensitive operations
const sensitiveToken = await easyLogin(address, 1); // 1 hour
```

### 2. Session Hijacking

**Risk:** Attacker takes over user session

**Mitigations:**
- ✅ Unique tokens per session
- ✅ Address-based isolation
- ✅ Token validation on use
- ✅ Automatic expiration

**Best Practice:**
```typescript
// Verify session ownership before operations
const session = getCurrentSession(address);
if (session && validateAccessToken(session)) {
  // Perform operation
}
```

### 3. Replay Attacks

**Risk:** Attacker replays old token

**Mitigations:**
- ✅ Tokens expire after set time
- ✅ Logout immediately invalidates token
- ✅ Each login generates new token
- ✅ Token timestamp prevents reuse

**Best Practice:**
```typescript
// Logout when done
easyLogout(address);

// If replayed token used:
// - Will be detected as expired
// - User must login again
```

### 4. Private Key Exposure

**Risk:** Private key leaks in logs

**Mitigations:**
- ✅ Private keys never logged
- ✅ Never included in tokens
- ✅ Optional parameter only
- ✅ Not stored in cache

**Best Practice:**
```typescript
// ✅ Safe - private key not exposed
const client = createEasyAccessClient({
  address: '0x1234...',
  privateKey: process.env.PRIVATE_KEY // Environment variable
});

// ❌ Avoid - hardcoding private keys
const client = createEasyAccessClient({
  address: '0x1234...',
  privateKey: '0x1234...' // Never hardcode!
});
```

### 5. Man-in-the-Middle (MITM)

**Risk:** Attacker intercepts network traffic

**Mitigations:**
- ✅ Use HTTPS only
- ✅ Use secure WebSocket (wss://)
- ✅ Validate certificates
- ✅ Use HSTS headers

**Best Practice:**
```typescript
// ✅ Use HTTPS URLs only
const client = createEasyAccessClient({
  address: '0x1234...',
  rpcUrl: 'https://mainnet.base.org' // HTTPS required
});

// ❌ Avoid HTTP
const client = createEasyAccessClient({
  address: '0x1234...',
  rpcUrl: 'http://mainnet.base.org' // Not secure!
});
```

## Implementation Best Practices

### 1. Input Validation

Always validate Ethereum addresses:

```typescript
// ✅ Good - validate address format
function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

const address = '0x1234...';
if (isValidAddress(address)) {
  await easyLogin(address);
}

// ❌ Avoid - no validation
await easyLogin(userInput);
```

### 2. Error Handling

Don't expose sensitive information in errors:

```typescript
// ✅ Good - safe error message
try {
  const token = await easyLogin(address);
} catch (error) {
  console.error('Login failed');
  // Don't log details that might expose the token
}

// ❌ Avoid - exposes details
catch (error) {
  console.error('Login failed:', error); // Could expose token!
}
```

### 3. Token Logging

Never log tokens:

```typescript
// ✅ Good - safe to log
console.log('Token expires at:', new Date(token.expiresAt));

// ❌ Avoid - exposes token
console.log('Token:', token);
console.log('Full token:', token.token);
```

### 4. Token Persistence

Careful with persistent storage:

```typescript
// ✅ Safe - use sessionStorage (cleared on tab close)
sessionStorage.setItem('token', JSON.stringify(token));

// ⚠️ Risky - localStorage persists (implement encryption)
// localStorage.setItem('token', JSON.stringify(token));

// ✅ Better - encrypt before storage
import { encrypt } from 'crypto-js';
const encrypted = encrypt(JSON.stringify(token), password);
localStorage.setItem('token', encrypted);
```

### 5. Multi-Tab Synchronization

Sync sessions across tabs safely:

```typescript
// ✅ Use sessionStorage event listener
window.addEventListener('storage', (event) => {
  if (event.key === 'logout') {
    // User logged out in another tab
    // Perform local logout
  }
});

// Notify other tabs of logout
function notifyLogout(address: string) {
  sessionStorage.setItem('logout', address);
  easyLogout(address);
}
```

## Environment Security

### 1. Environment Variables

Store sensitive data in environment variables:

```bash
# .env.local (never commit this!)
PRIVATE_KEY=0x1234...
RPC_URL=https://mainnet.base.org
```

```typescript
const client = createEasyAccessClient({
  address: '0x1234...',
  privateKey: process.env.PRIVATE_KEY,
  rpcUrl: process.env.RPC_URL
});
```

### 2. Secrets Management

For production, use secrets management:

```typescript
// AWS Secrets Manager
const secret = await secretsManager.getSecretValue('private-key');

// Azure Key Vault
const secret = await keyVaultClient.getSecret('private-key');

// HashiCorp Vault
const secret = await vaultClient.read('secret/data/private-key');
```

## Network Security

### 1. HTTPS Only

Always use HTTPS:

```typescript
// ✅ Correct
rpcUrl: 'https://mainnet.base.org'

// ❌ Wrong
rpcUrl: 'http://mainnet.base.org'
```

### 2. Certificate Pinning

For sensitive applications:

```typescript
const https = require('https');
const fs = require('fs');

const agent = new https.Agent({
  ca: fs.readFileSync('path/to/cert.pem')
});

const response = await fetch(rpcUrl, { agent });
```

### 3. Rate Limiting

Implement rate limiting:

```typescript
// ✅ Implement rate limiter
const rateLimit = new Map<string, number[]>();

function checkRateLimit(address: string, maxAttempts = 5): boolean {
  const now = Date.now();
  const attempts = rateLimit.get(address) || [];
  
  // Remove old attempts (older than 1 minute)
  const recent = attempts.filter(t => now - t < 60000);
  
  if (recent.length >= maxAttempts) {
    return false; // Rate limited
  }
  
  recent.push(now);
  rateLimit.set(address, recent);
  return true;
}
```

## Frontend Security

### 1. Content Security Policy (CSP)

Add CSP headers:

```html
<!-- CSP Header -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               connect-src 'self' https://mainnet.base.org;">
```

### 2. Secure Cookies

If using cookies:

```typescript
// Set secure cookie flags
res.setHeader('Set-Cookie', [
  `token=${token}`,
  'HttpOnly', // No JavaScript access
  'Secure',   // HTTPS only
  'SameSite=Strict' // CSRF protection
].join('; '));
```

### 3. XSS Prevention

Prevent Cross-Site Scripting:

```typescript
// ✅ Good - sanitize output
const sanitized = document.createTextNode(unsafeString);
element.appendChild(sanitized);

// ❌ Avoid - innerHTML with user input
element.innerHTML = userInput; // XSS vulnerability!
```

## Compliance & Standards

### 1. OWASP Top 10

We address:
- ✅ A01: Injection - Input validation
- ✅ A02: Authentication - Token validation
- ✅ A03: Sensitive Data - Token expiration
- ✅ A04: XML External Entities - N/A
- ✅ A05: Access Control - Address-based isolation

### 2. OAuth 2.0

Token implementation follows OAuth 2.0:
- ✅ Bearer tokens
- ✅ Token expiration
- ✅ Scope support (future)

### 3. Security Headers

Implement security headers:

```typescript
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  next();
});
```

## Incident Response

### If Token is Compromised

1. **Immediately logout:**
   ```typescript
   easyLogout(address);
   ```

2. **Invalidate all sessions:**
   ```typescript
   tokenCache.clear(); // Clear entire cache
   ```

3. **Rotate private key** (if exposed):
   - Generate new private key
   - Update in secrets management
   - Notify users

4. **Review logs:**
   - Check for unauthorized access
   - Audit transaction history

## Security Checklist

- [ ] Use HTTPS only
- [ ] Validate all inputs
- [ ] Set appropriate token expiry
- [ ] Store private keys in environment
- [ ] Don't log tokens
- [ ] Implement rate limiting
- [ ] Use secure cookies
- [ ] Set CSP headers
- [ ] Regular security audits
- [ ] Keep dependencies updated
- [ ] Use HSTS headers
- [ ] Implement CORS properly

## Reporting Security Issues

**Do NOT** open a public issue for security vulnerabilities.

Instead:
1. Email security team privately
2. Include proof of concept
3. Allow time for patch
4. Do not disclose publicly until patched

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [Web Application Security](https://owasp.org/www-project-web-security-testing-guide/)
- [Ethereum Security](https://ethereum.org/en/developers/docs/smart-contracts/security/)

---

**Security is Everyone's Responsibility** 🔒

When in doubt, ask! Report security concerns responsibly.

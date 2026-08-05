# Bundle Size Analysis - @base-org/account

## Current State (BEFORE Optimization)

### Bundle Size Metrics
- **Size Limit**: 31 KB
- **Actual Size**: 204.59 KB (minified + brotlied)
- **Exceeded By**: 173.59 KB (**560% over limit**)
- **Browser Bundle (unminified)**: 1.9 MB
- **Browser Bundle (minified)**: 795 KB
- **Loading Time**: 4s on slow 3G
- **Running Time**: 5.3s on Snapdragon 410
- **Total Time**: 9.2s

## Dependencies Analysis

### Heavy Dependencies Identified

1. **viem** (v2.31.7) - ~6.4 MB cached
   - Usage: Blockchain utilities (encoding, ABI, addresses, types)
   - Imports: `encodeFunctionData`, `parseUnits`, `formatUnits`, `getAddress`, `isAddress`, `hexToBytes`, etc.
   - Risk: HIGH impact on bundle size

2. **@coinbase/cdp-sdk** (v1.0.0)
   - Usage: Smart wallet integration (`CdpClient`, `EvmSmartAccount`)
   - Includes: viem as dependency (double bundling risk)
   - Risk: HIGH impact

3. **ox** (v0.6.9) - ~1.7 MB cached
   - Usage: Minimal or indirect through viem
   - Risk: MEDIUM impact

4. **preact** (v10.24.2)
   - Usage: UI components
   - Impact: Acceptable for UI functionality

5. **zustand** (v5.0.3)
   - Usage: State management
   - Impact: Small, well tree-shaken

6. **brotli-wasm** (v3.0.0) - ~1.5 MB cached
   - Usage: Compression utilities
   - Risk: MEDIUM impact if bundled

## Import Analysis

### viem Imports (from grep analysis)
```typescript
// Used functions:
- encodeFunctionData
- decodeEventLog, decodeAbiParameters
- parseUnits, formatUnits
- getAddress, isAddress, isAddressEqual
- hexToBytes, numberToHex, toHex
- createPublicClient, http
- readContract
// Types:
- Address, Hex, ByteArray, Abi, PublicClient
```

### @coinbase/cdp-sdk Imports
```typescript
// Used:
- CdpClient
- EvmSmartAccount (type)
```

## Root Causes of Bundle Bloat

1. **Full viem bundle included** - Using multiple utilities from viem likely pulls in large portions of the library
2. **Duplicate viem versions** - Both direct dependency and through @coinbase/cdp-sdk
3. **No proper tree-shaking** - UMD format doesn't support tree-shaking well
4. **Circular dependencies** - Warning suppressed in rollup config for viem/ox
5. **Inline dynamic imports** - `inlineDynamicImports: true` prevents code splitting

## Optimization Opportunities

### Priority 1 - HIGH Impact (Target: -100KB+)

| Optimization | Estimated Saving | Risk | Effort |
|-------------|------------------|------|--------|
| Replace viem with minimal utilities | -80 to -120 KB | Medium | 8-16h |
| Externalize @coinbase/cdp-sdk | -40 to -60 KB | Low | 2-4h |
| Implement code splitting | -30 to -50 KB | Low | 4-6h |
| Remove/externalize brotli-wasm | -10 to -20 KB | Low | 2h |

### Priority 2 - MEDIUM Impact (Target: -30KB)

| Optimization | Estimated Saving | Risk | Effort |
|-------------|------------------|------|--------|
| Use ESM instead of UMD | -15 to -25 KB | Medium | 4h |
| Optimize viem imports (selective imports) | -10 to -20 KB | Low | 4h |
| Remove ox if unused | -5 to -15 KB | Low | 2h |
| Optimize preact imports | -5 to -10 KB | Low | 2h |

### Priority 3 - LOW Impact (Target: -10KB)

| Optimization | Estimated Saving | Risk | Effort |
|-------------|------------------|------|--------|
| Remove PURE comment warnings handling | -2 to -5 KB | Very Low | 1h |
| Optimize constants/enums | -2 to -5 KB | Very Low | 1h |
| Compress type definitions | -1 to -3 KB | Very Low | 1h |

## Recommended Approach

### Phase 1: Quick Wins (Target: -50KB, 8-10h)
1. ✅ Externalize @coinbase/cdp-sdk for payment features
2. ✅ Enable code splitting (remove `inlineDynamicImports`)
3. ✅ Create separate bundles for payment API vs full SDK
4. ✅ Optimize rollup config for better tree-shaking

### Phase 2: Medium Effort (Target: -80KB, 16-20h)
1. ✅ Replace viem utilities with lightweight alternatives
2. ✅ Switch to ESM format with UMD fallback
3. ✅ Implement dynamic imports for large features
4. ✅ Remove or externalize brotli-wasm

### Phase 3: Advanced (Target: -100KB+, 20-30h)
1. ✅ Create micro-packages for specific use cases
2. ✅ Implement custom encoding/decoding utilities
3. ✅ Lazy-load UI components
4. ✅ Optimize for specific environments (browser-only build)

## Implementation Plan

Starting with Phase 1 optimizations for maximum impact with minimal risk.

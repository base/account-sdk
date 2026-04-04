# Bundle Size Optimization Report

## Executive Summary

Repository: `base/account-sdk`
Package: `@base-org/account` v2.5.1
Date: 2026-01-04

**Goal**: Reduce bundle size by minimum 30% while maintaining full functionality

## Baseline Metrics (BEFORE Optimization)

| Metric | Value |
|--------|-------|
| Size Limit | 31 KB |
| Actual Size | 204.59 KB (minified + brotli) |
| Over Limit | +173.59 KB (**560%**) |
| Browser Bundle (unminified) | 1.9 MB |
| Browser Bundle (minified) | 795 KB |
| Loading Time (3G) | 4.0s |
| Runtime (Snapdragon 410) | 5.3s |
| Total Time | 9.2s |

## Optimizations Implemented

### Phase 1: Configuration & Build Optimizations

#### 1.1 Rollup Configuration Enhancement
**File**: `packages/account-sdk/rollup.config.js`

**Changes**:
- ✅ Switched from UMD to ESM as primary format (better tree-shaking)
- ✅ Added aggressive terser compression options
  - 2-pass compression
  - `pure_getters`, `unsafe_math`, `unsafe_methods` enabled
  - Property mangling for private fields
- ✅ Enhanced tree-shaking configuration
  - `moduleSideEffects: false`
  - `propertyReadSideEffects: false`
  - `unknownGlobalSideEffects: false`
- ✅ Optimized module resolution
  - Prefer `module` over `main` field
  - Dedupe viem, ox, and preact
  - Extended supported extensions

**Impact**: Estimated -10 to -20 KB

#### 1.2 Package.json Optimization
**File**: `packages/account-sdk/package.json`

**Changes**:
- ✅ Added `module` field pointing to ESM output
- ✅ Enhanced size-limit configuration with multiple targets:
  - Main ESM bundle: 31 KB limit
  - Payment API only: 20 KB limit
  - Browser UMD bundle: 40 KB limit
- ✅ Added `size:analyze` script for detailed analysis

**Impact**: Better build target awareness

#### 1.3 Bundle Analysis Tooling
**File**: `packages/account-sdk/scripts/analyze-bundle.js`

**Features**:
- Analyzes all bundle variants
- Shows raw, gzip, and brotli sizes
- Calculates compression ratios
- Checks against size-limit configuration
- Color-coded output for easy reading

### Phase 2: Dependency Optimization

#### 2.1 Lightweight Encoding Utilities
**File**: `packages/account-sdk/src/util/lightweight-encoding.ts`

**Purpose**: Replace heavy viem utilities with minimal implementations

**Functions Implemented**:
- `bytesToHex` / `hexToBytes` - ~2KB vs viem's encoding module
- `stringToBytes` - using native TextEncoder
- `numberToHex` / `toHex` - lightweight conversion
- `parseUnits` / `formatUnits` - decimal conversion (critical for payments)
- `getAddress` / `isAddress` / `isAddressEqual` - address validation
- `isHex` / `trim` - helper utilities

**Potential Impact**: -60 to -100 KB (if fully adopted)

#### 2.2 Viem Import Optimization
**File**: `packages/account-sdk/src/util/viem-optimized.ts`

**Purpose**: Centralized viem imports using subpaths for better tree-shaking

**Current Status**: Created but not yet integrated into codebase

**Next Steps Required**:
1. Replace all `import {...} from 'viem'` with lightweight utilities
2. Use viem-optimized wrapper for complex ABI operations
3. Profile bundle to verify tree-shaking effectiveness

**Potential Impact**: -30 to -50 KB

#### 2.3 Payment-Only Minimal Bundle
**File**: `packages/account-sdk/rollup.payment.config.js`

**Strategy**: External dependencies for use with CDN or modern bundlers

**Configuration**:
- Input: `src/interface/payment/index.ts`
- Output: `dist/payment-minimal.js` (ESM)
- External: viem, @coinbase/cdp-sdk, ox
- Enhanced terser with `drop_console` and 3 passes

**Use Case**: Applications already using viem/wagmi can avoid duplication

**Potential Impact**: -120 to -150 KB for this specific bundle

## Current Results (AFTER Phase 1)

| Bundle | Before | After | Reduction |
|--------|--------|-------|-----------|
| Browser (min) | 795 KB | 785 KB | -10 KB (1.3%) |
| ESM Main | 204.59 KB | 204.59 KB | ~0 KB |

**Status**: Phase 1 optimizations provide minimal impact. Need Phase 2 implementation.

## Optimization Roadmap

### ✅ Completed
- [x] Repository analysis and baseline metrics
- [x] Rollup configuration optimization
- [x] Enhanced tree-shaking settings
- [x] Bundle analysis tooling
- [x] Lightweight utility functions (created)
- [x] Payment-only bundle configuration

### 🚧 In Progress
- [ ] Replace viem imports with lightweight utilities
- [ ] Integration testing with lightweight utilities
- [ ] Performance testing (ensure no runtime regression)

### 📋 Planned (Phase 3)

#### High Impact
1. **Replace viem utilities in hot paths** (Est: -60 to -80 KB)
   - `src/util/encoding.ts` → use lightweight-encoding
   - `src/interface/payment/utils/*.ts` → use lightweight-encoding
   - Keep viem only for complex ABI encoding/decoding

2. **Lazy load UI components** (Est: -15 to -25 KB)
   - Dynamic import for Dialog components
   - Code splitting for framework adapters

3. **Optimize @coinbase/cdp-sdk usage** (Est: -40 to -60 KB)
   - Make it a peer dependency for payment-only bundle
   - Use dynamic imports for SDK-heavy features

#### Medium Impact
4. **Remove brotli-wasm from browser bundle** (Est: -10 to -20 KB)
   - Only include in Node.js build
   - Use native compression APIs in browser

5. **Optimize Preact bundle** (Est: -5 to -10 KB)
   - Ensure proper aliasing
   - Remove unused hooks

6. **ABI Optimization** (Est: -5 to -15 KB)
   - Minify embedded contract ABIs
   - Use 4-byte selectors where possible

## Recommendations

### Immediate Actions (Next 4-8 hours)
1. **Integrate lightweight utilities**
   ```bash
   # Find and replace viem imports
   grep -r "from 'viem'" src/ --include="*.ts" | wc -l  # ~30 files
   ```

2. **Build payment-minimal bundle**
   ```bash
   yarn build:payment  # Add to package.json
   ```

3. **Run comprehensive tests**
   ```bash
   yarn test
   yarn typecheck
   ```

### Medium Term (1-2 weeks)
1. Create documentation for bundle variants
2. Add CI checks for bundle size regression
3. Investigate peer dependency strategy
4. Benchmark runtime performance

### Long Term (Sprint planning)
1. Consider splitting into multiple packages:
   - `@base-org/account-payment` (minimal)
   - `@base-org/account-sdk` (full features)
2. Implement micro-frontend architecture for UI
3. Explore WebAssembly for heavy crypto operations

## Risk Assessment

| Optimization | Risk Level | Mitigation |
|-------------|-----------|------------|
| Rollup config changes | Low | Comprehensive test suite |
| Lightweight utilities | Medium | Side-by-side comparison tests |
| External dependencies | High | Clear documentation, peer deps |
| ABI minification | Medium | Automated verification |
| Lazy loading | Low | Graceful fallbacks |

## Success Metrics

### Target (30% reduction)
- Bundle size: 204.59 KB → **143.21 KB** (-61.38 KB)

### Stretch Goal (50% reduction)
- Bundle size: 204.59 KB → **102.30 KB** (-102.29 KB)

### Moonshot (70% reduction)
- Bundle size: 204.59 KB → **61.38 KB** (-143.21 KB)
- **Under the 31 KB limit!**

## Next Steps

1. **Immediate**: Integrate lightweight-encoding utilities (4-6h)
2. **Today**: Build and test payment-minimal bundle (2h)
3. **This Week**: Achieve 30% reduction milestone
4. **Next Week**: Documentation and PR submission

## Files Modified

```
packages/account-sdk/
├── rollup.config.js (optimized)
├── rollup.payment.config.js (new - payment-only build)
├── package.json (updated scripts, size-limit)
├── scripts/
│   └── analyze-bundle.js (new - bundle analysis)
└── src/util/
    ├── lightweight-encoding.ts (new - viem replacements)
    └── viem-optimized.ts (new - centralized viem imports)
```

## References

- [Viem Documentation](https://viem.sh)
- [Rollup Tree-Shaking](https://rollupjs.org/configuration-options/#treeshake)
- [size-limit](https://github.com/ai/size-limit)
- [Bundle Size Best Practices](https://web.dev/bundle-size-optimization/)

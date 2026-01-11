import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';

/**
 * Lightweight payment-only bundle configuration
 *
 * This creates a minimal bundle with only payment API functionality,
 * externalizing heavy dependencies like viem and @coinbase/cdp-sdk
 */

const terserOptions = {
  compress: {
    passes: 3,
    pure_getters: true,
    unsafe: true,
    unsafe_comps: true,
    unsafe_math: true,
    unsafe_methods: true,
    drop_console: true,
    drop_debugger: true,
  },
  mangle: {
    properties: {
      regex: /^_private/,
    },
  },
  format: {
    comments: false,
  },
};

export default {
  input: 'src/interface/payment/index.ts',
  output: [
    {
      file: 'dist/payment-minimal.js',
      format: 'esm',
      sourcemap: true,
      exports: 'named',
      inlineDynamicImports: true,
    },
    {
      file: 'dist/payment-minimal.min.js',
      format: 'esm',
      sourcemap: true,
      exports: 'named',
      inlineDynamicImports: true,
      plugins: [terser(terserOptions)],
    },
  ],
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env.DEBUG': JSON.stringify(false),
      preventAssignment: true,
    }),
    json(),
    nodeResolve({
      browser: true,
      preferBuiltins: false,
      mainFields: ['module', 'jsnext:main', 'main'],
      extensions: ['.mjs', '.js', '.json', '.ts'],
    }),
    commonjs({
      ignoreDynamicRequires: true,
    }),
    typescript({
      tsconfig: './tsconfig.build.json',
      compilerOptions: {
        module: 'esnext',
        moduleResolution: 'bundler',
        declaration: false,
        declarationMap: false,
        emitDeclarationOnly: false,
      },
    }),
  ],
  // Externalize heavy dependencies
  external: [
    'viem',
    'viem/actions',
    'viem/chains',
    '@coinbase/cdp-sdk',
    'ox',
  ],
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false,
    unknownGlobalSideEffects: false,
  },
  onwarn(warning, warn) {
    if (warning.code === 'INVALID_ANNOTATION' && warning.message.includes('/*#__PURE__*/')) {
      return;
    }
    if (
      warning.code === 'CIRCULAR_DEPENDENCY' &&
      (warning.message.includes('node_modules/viem') || warning.message.includes('node_modules/ox'))
    ) {
      return;
    }
    // Don't warn about unresolved external dependencies
    if (warning.code === 'UNRESOLVED_IMPORT') {
      return;
    }
    warn(warning);
  },
};

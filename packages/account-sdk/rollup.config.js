import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';

// Optimized terser config for better compression
const terserOptions = {
  compress: {
    passes: 2,
    pure_getters: true,
    unsafe: true,
    unsafe_comps: true,
    unsafe_math: true,
    unsafe_methods: true,
  },
  mangle: {
    properties: {
      regex: /^_/,
    },
  },
  format: {
    comments: false,
  },
};

// Enhanced node resolve for better tree-shaking
const nodeResolveOptions = {
  browser: true,
  preferBuiltins: false,
  dedupe: ['viem', 'ox', 'preact'],
  mainFields: ['module', 'jsnext:main', 'main'],
  extensions: ['.mjs', '.js', '.json', '.ts'],
};

export default {
  input: 'src/browser-entry.ts',
  output: [
    {
      file: 'dist/base-account.js',
      format: 'esm',
      sourcemap: true,
      exports: 'named',
      // Enable code splitting in future
      // inlineDynamicImports: false,
      inlineDynamicImports: true,
    },
    {
      file: 'dist/base-account.min.js',
      format: 'esm',
      sourcemap: true,
      exports: 'named',
      inlineDynamicImports: true,
      plugins: [terser(terserOptions)],
    },
    {
      file: 'dist/base-account.umd.js',
      format: 'umd',
      name: 'base',
      sourcemap: true,
      inlineDynamicImports: true,
      exports: 'named',
      plugins: [terser(terserOptions)],
    },
  ],
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
      preventAssignment: true,
      // Remove development-only code
      'process.env.DEBUG': JSON.stringify(false),
    }),
    json(),
    nodeResolve(nodeResolveOptions),
    commonjs({
      // Improve tree-shaking for CommonJS modules
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
  external: [],
  // Tree-shaking optimization
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false,
    unknownGlobalSideEffects: false,
  },
  onwarn(warning, warn) {
    // Ignore PURE comment warnings from ox and viem
    if (warning.code === 'INVALID_ANNOTATION' && warning.message.includes('/*#__PURE__*/')) {
      return;
    }
    // Ignore circular dependency warnings from viem and ox (these are handled internally)
    if (
      warning.code === 'CIRCULAR_DEPENDENCY' &&
      (warning.message.includes('node_modules/viem') || warning.message.includes('node_modules/ox'))
    ) {
      return;
    }
    warn(warning);
  },
};

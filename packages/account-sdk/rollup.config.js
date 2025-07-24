import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/interface/payment/browser-entry.ts',
  output: [
    {
      file: 'dist/base-pay.js',
      format: 'umd',
      name: 'base',
      sourcemap: true,
      inlineDynamicImports: true
    },
    {
      file: 'dist/base-pay.min.js',
      format: 'umd',
      name: 'base',
      sourcemap: true,
      inlineDynamicImports: true,
      plugins: [terser()]
    }
  ],
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
      preventAssignment: true
    }),
    json(),
    nodeResolve({
      browser: true,
      preferBuiltins: false,
      dedupe: ['viem', 'ox']
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.build.json',
      compilerOptions: {
        module: 'esnext'
      }
    })
  ],
  external: []
}; 
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

const external = ['react', 'preact'];

export default [
  // Preact bundle
  {
    input: 'src/index.preact.ts',
    output: {
      file: 'dist/index.preact.js',
      format: 'es',
      sourcemap: true,
    },
    external,
    plugins: [
      resolve({
        preferBuiltins: false,
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.build.json',
        declaration: true,
        declarationMap: true,
        declarationDir: 'dist',
        outDir: 'dist',
      }),
    ],
  },
  // React bundle
  {
    input: 'src/index.react.ts',
    output: {
      file: 'dist/index.react.js',
      format: 'es',
      sourcemap: true,
    },
    external,
    plugins: [
      resolve({
        preferBuiltins: false,
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.build.json',
        declaration: true,
        declarationMap: true,
        declarationDir: 'dist',
        outDir: 'dist',
      }),
    ],
  },
];

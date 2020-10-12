import path from 'path';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import inject from '@rollup/plugin-inject';
import nodeResolve from '@rollup/plugin-node-resolve';
import externals from 'rollup-plugin-node-externals';
import copy from 'rollup-plugin-copy';
import { terser } from 'rollup-plugin-terser';

const isTest = process.env.NODE_ENV === 'test';

const plugins = [
  isTest ? [] : babel({
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  }),
  commonjs(),
  nodeResolve({
    extensions: ['.mjs', '.js', '.ts', '.tsx'],
  }),
];

export default [
  {
    input: 'src/server.ts',
    output: [
      {
        file: 'dist/server.js',
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: 'dist/server.es.js',
        format: 'es',
        sourcemap: true,
      },
    ],
    plugins: [
      externals({ deps: true }),
      ...plugins,
      inject({
        AbortController: 'abort-controller',
        Event: path.resolve('src/polyfill/event.ts'),
        EventTarget: 'event-target-shim',
        Headers: ['node-fetch', 'Headers'],
        MessageEvent: path.resolve('src/polyfill/message-event.ts'),
        ErrorEvent: path.resolve('src/polyfill/error-event.ts'),
      }),
      copy({
        targets: [
          { src: 'LICENSE', dest: 'dist' },
          { src: 'package.json', dest: 'dist' },
          { src: 'README.md', dest: 'dist' },
        ],
      }),
    ],
  },
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'umd',
        name: 'FetchEventSource',
        sourcemap: true,
      },
      {
        file: 'dist/index.min.js',
        format: 'umd',
        name: 'FetchEventSource',
        sourcemap: true,
        plugins: [terser()],
      },
      {
        file: 'dist/index.es.js',
        format: 'es',
        sourcemap: true,
      },
    ],
    plugins,
  },
];

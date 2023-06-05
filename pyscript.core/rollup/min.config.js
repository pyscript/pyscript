// This file generates /min.js minified version of the module, which is
// the default exported as npm entry.

import {nodeResolve} from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

import {createRequire} from 'node:module';

createRequire(import.meta.url)('./build_xworker.cjs');

export default {
  input: './esm/index.js',
  plugins: [
    nodeResolve(),
    terser()
  ],
  output: {
    esModule: true,
    file: './min.js'
  }
};

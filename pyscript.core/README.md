# @pyscript/core

[![build](https://github.com/WebReflection/python/actions/workflows/node.js.yml/badge.svg)](https://github.com/WebReflection/python/actions/workflows/node.js.yml) [![Coverage Status](https://coveralls.io/repos/github/WebReflection/python/badge.svg?branch=api&t=1RBdLX)](https://coveralls.io/github/WebReflection/python?branch=api)

---

## Documentation

Please read [the documentation page](./docs/README.md) to know all the user-facing details around this module.

## Development

The working folder (source code of truth) is the `./esm` one, while the `./cjs` is populated as a dual module and to test (but it's 1:1 code, no transpilation except for imports/exports).

```sh
# install all dependencies needed by core
npm i
```

### Build / Artifacts

This project requires some automatic artifact creation to:

    * create a _Worker_ as a _Blob_ based on the same code used by this repo
    * create automatically the list of runtimes available via the module
    * create the `core.js` or the `pyscript.js` file used by most integration tests
    * create a sha256 version of the Blob content for CSP cases

Accordingly, to build latest project:

```sh
# create all artifacts needed to test core
npm run build

# optionally spin a server with CORS, COOP, and COEP enabled
npm run server
```

If **no minification** is desired or helpful while debugging potential issues, please use `NO_MIN=1` in front of the _build_ step:

```sh
NO_MIN=1 npm run build

npm run server
```

### Dev Build

Besides spinning the _localhost_ server via `npm run server`, the `npm run dev` will watch changes in the `./esm` folder and it will build automatically non optimized artifacts out of the box.

## Integration Tests

To keep it simple, and due to technical differences between what was in PyScript before and what we actually need for core (special headers, multiple interpreters, different bootstrap logic), core integration tests can be performed simply by running:

```sh
npm run test:integration
```

The package's entry takes care of eventually bootstrapping localhost, starting in parallel all tests, and shutting down the server after, if any was bootstrapped.

The tool to test integration is still _playwright_ but moves things a bit faster (from my side) tests are written in JS.

#### Integration Tests Structure

```
integration
          ├ interpreter
          │           ├ micropython
          │           ├ pyodide
          │           ├ ruby-wasm-wasi
          │           ├ wasmoon
          │           ├ xxx.yy
          │           ├ xxx.toml
          │           └ utils.js
          ├ _shared.js
          ├ micropython.js
          ├ pyodide.js
          ├ ruby-wasm-wasi.js
          └ wasmoon.js
```

-   **interpreter** this folder contains, per each interpreter, a dedicated folder with the interpreter's name. Each of these sub-folders will contain all `.html` and other files to test every specific behavior. In this folder, it's possible to share files, config, or anything else that makes sense for one or more interpreters.
-   **\_shared.js** contains some utility used across all tests. Any file prefixed with `_` (underscore) will be ignored for tests purposes but it can be used by the code itself.
-   **micropython.js** and all others contain the actual test per each interpreter. If a test is the same across multiple interpreters it can be exported via the `_shared.js` file as it is for most _Pyodide_ and _MicroPython_ cases.

The [test/integration.spec.js](./test/integration.spec.js) file simply loops over folders that match interpreters _by name_ and execute in parallel all tests.

#### Manual Test

To **test manually** an integration test, simply `npm run server` and reach the _html_ file created for that particular test.

As example, reaching http://localhost:8080/test/integration/interpreter/micropython/fetch.html would log in the console and show expectations on the page and this can be easily tested via multiple browsers by simply reaching the very same integration test.

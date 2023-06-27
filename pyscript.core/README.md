# @pyscript/core

[![build](https://github.com/WebReflection/python/actions/workflows/node.js.yml/badge.svg)](https://github.com/WebReflection/python/actions/workflows/node.js.yml) [![Coverage Status](https://coveralls.io/repos/github/WebReflection/python/badge.svg?branch=api&t=1RBdLX)](https://coveralls.io/github/WebReflection/python?branch=api)

---

## Documentation

Please read [the documentation page](./docs/README.md) to know all the user-facing details around this module.

## Development

The working folder (source code of truth) is the `./esm` one, while the `./cjs` is populated as dual module and to test (but it's 1:1 code, no transpilation except for imports/exports).

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

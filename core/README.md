# @pyscript/core

PyScript brings two Python interpreters to the browser:

* [MicroPython](https://micropython.org/) - a lean and efficient implementation 
  of the Python 3 programming language that includes a small subset of the 
  Python standard library and is optimised to run on microcontrollers and in 
  constrained environments (like the browser).
* [Pyodide](https://pyodide.org)) - a port of all CPython to WebAssembly.

These interpreters are compiled to [WebAssembly](https://webassembly.org/)
(shortened to WASM). The browser provides a secure WASM computing sandbox. Both
interpreters are compiled to web assembly with
[Emscripten](https://emscripten.org/). PyScript core maintainers work closely
with the core maintainers of both MicroPython and Pyodide (and CPython). We
work hard to ensure PyScript works efficiently in browsers on all platforms:
desktop, mobile, or elsewhere.

Our technical documentation for using this project can be
[found here](https://docs.pyscript.net/).

PyScript sits on two further projects (both written in JavaScript):

1. [polyscript](https://github.com/pyscript/polyscript/#readme) - used to
   bootstrap WASM compiled interpreters in a browser.
2. [coincident](https://github.com/WebReflection/coincident) - used to simplify
   worker based tasks.

PyScript itself is mostly written in JavaScript. The test suite for JavaScript
is in two parts: automated tests run in [playwright](https://playwright.dev/), 
and manual tests you have to run in a browser and check yourself. PyScript also
has a plugin system so third parties can extend its capabilities with
JavaScript. Our built-in core plugins can be found in the `src/plugins`
directory. We describe how to write third party plugins in our 
[developer documentation](https://docs.pyscript.net/2024.9.2/user-guide/plugins/).

We provide a `pyscript` namespace containing Python modules for common browser
based APIs and features (i.e. you can `import pyscript` in Python code running
inside PyScript, to access these features). The Python code for the `pyscript`
namespace is in  `src/stdlib/pyscript` with the associated test suite in 
`tests/python`. The tests use the browser friendly 
[uPyTest](https://github.com/ntoll/upytest) test framework for checking Python
code running *within* PyScript. All the Python tests are run in each each
available interpreter in both the main thread and a web worker (i.e. the
test suite is run four times, accounting for each combination of interpreter
and main/worker context).

When you create a local build all the automated tests (JavaScript and Python)
are run.

## Setup

## Build

## Test

## Plugins

## Python

## Development

Clone this repository then run `npm install` within this folder.

Use `npm run build` to create all artifacts and _dist_ files.

Use `npm run server` to test locally, via the `http://localhost:8080/tests/` url, smoke tests or to test manually anything you'd like to check.

### Artifacts

There are two main artifacts in this project:

-   **stdlib** and its content, where `src/stdlib/pyscript.js` exposes as object literal all the _Python_ content within the folder (recursively)
-   **plugins** and its content, where `src/plugins.js` exposes all available _dynamic imports_, able to instrument the bundler to create files a part within the _dist/_ folder, so that by default _core_ remains as small as possible

Accordingly, whenever a file contains this warning at its first line, please do not change such file directly before submitting a merge request, as that file will be overwritten at the next `npm run build` command, either here or in _CI_:

```js
// ⚠️ This file is an artifact: DO NOT MODIFY
```

### Running tests

Before running the tests, we need to create a tests environment first. To do so run the following command from the root folder of the project:

```
make setup
```

This will create a tests environment [in the root of the project, named `./env`] and install all the dependencies needed to run the tests.

A lot of problems related to `make setup` are related to node and npm being outdated. Once npm and node are updated, `make setup` should work. You can follow the steps on the [npm documentation](https://docs.npmjs.com/try-the-latest-stable-version-of-npm) to update npm (the update command for Linux should work for Mac as well). Once npm has been updated you can continue to the instructions to update node below.

To update Node run the following commands in order (most likely you'll be prompted for your user password, this is normal):

```
sudo npm cache clean -f
sudo npm install -g n
sudo n stable
```

After the `make setup` command has completed, you can run the **automated tests** with
the following command:

```
make test
```

(This essentially runs the `npm run test:integration` command in the right place. This is defined in PyScript's `package.json` file.)

Tests are found in the `tests` directory. These are organised into three locations:

1. `python` - the Python based test suite to exercise Python code **within** PyScript.
2. `javascript` - JavaScript tests to exercise PyScript itself, in the browser.
3. `manual` - containing tests to run manually in a browser, due to the complex nature of the tests.

We use [Playwright](https://playwright.dev/) to automate the running of the Python and JavaScript test suites. We use [uPyTest](https://github.com/ntoll/upytest) as a test framework for the Python test suite. uPyTest is a "PyTest inspired" framework for running tests in the browser on both MicroPython and Pyodide.

The automated (Playwright) tests are specified in the `tests/integration.spec.js` file.

## `pyscript` python package

The `pyscript` package available in _Python_ lives in the folder `src/stdlib/pyscript/`.

All _Python_ files will be embedded automatically whenever `npm run build` happens and reflected into the `src/stdlib/pyscript.js` file.

It is _core_ responsibility to ensure those files will be available through the Filesystem in either the _main_ thread, or any _worker_.

## JS plugins

While community or third party plugins don't need to be part of this repository and can be added just importing `@pyscript/core` as module, there are a few plugins that we would like to make available by default and these are considered _core plugins_.

To add a _core plugin_ to this project you can define your plugin entry-point and name in the `src/plugins` folder (see the `error.js` example) and create, if necessary, a folder with the same name where extra files or dependencies can be added.

The _build_ command will bring plugins by name as artifact so that the bundler can create ad-hoc files within the `dist/` folder.

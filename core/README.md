# @pyscript/core

PyScript brings two Python interpreters to the browser:

-   [MicroPython](https://micropython.org/) - a lean and efficient implementation
    of the Python 3 programming language that includes a small subset of the
    Python standard library and is optimised to run on microcontrollers and in
    constrained environments (like the browser).
-   [Pyodide](https://pyodide.org)) - a port of all CPython to WebAssembly.

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
[developer documentation](https://docs.pyscript.net/latest/user-guide/plugins/).

We provide a `pyscript` namespace containing Python modules for common browser
based APIs and features (i.e. you can `import pyscript` in Python code running
inside PyScript, to access these features). The Python code for the `pyscript`
namespace is in `src/stdlib/pyscript` with the associated test suite in
`tests/python`. The tests use the browser friendly
[uPyTest](https://github.com/ntoll/upytest) test framework for checking Python
code running _within_ PyScript. All the Python tests are run in each each
available interpreter in both the main thread and a web worker (i.e. the
test suite is run four times, accounting for each combination of interpreter
and main/worker context).

When you create a local build all the automated tests (JavaScript and Python)
are run.

## Developer Guide

Full instructions for setting up a working development environment, how to
build PyScript and how to test it can be
[found in our official docs](https://docs.pyscript.net/latest/developers/).

The short version is:

-   Ensure you have Python, node and npm installed.
-   Create a Python virtual environment.
-   In the root of this repository `make setup`.
-   `make build` to build PyScript.
-   As dependencies change over time, `make update` to keep in sync.

To start using the locally built version of PyScript, you'll need an HTML
page something like this (note the relative paths to assets in the `dist`
directory, in the `<head>` of the document):

```html
<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Pure Python PyScript tests</title>
        <link rel="stylesheet" href="../../dist/core.css" />
        <script type="module" src="../../dist/core.js"></script>
    </head>
    <body>
        <script type="mpy" src="./main.py" config="./conf.toml"></script>
    </body>
</html>
```

Once set up, you should be able to run the most common activities via the
`make` command:

```
$ make

There is no default Makefile target right now. Try:

make setup - check your environment and install the dependencies.
make update - update dependencies.
make clean - clean up auto-generated assets.
make build - build PyScript.
make precommit-check - run the precommit checks (run eslint).
make test - run all automated tests in playwright.
make fmt - format the code.
make fmt-check - check the code formatting.
```

## Artifacts

There are two main artifacts in this project:

-   **stdlib** and its content: `src/stdlib/pyscript.js` exposes, as a
    JavaScript object literal, all the _Python_ content within the folder
    (recursively).
-   **plugins** and its content: `src/plugins.js` exposes all available
    _dynamic imports_, and is able to instrument the bundler to create files
    apart from the `_dist/_` folder, so that by default _core_ remains as small
    as possible.

Accordingly, whenever a file contains this warning at its first line, **please
do not change such file directly before submitting a merge request**, as that
file will be overwritten at the next `npm run build` command, either here or
in _CI_:

```js
// ⚠️ This file is an artifact: DO NOT MODIFY
```

## Plugins

While community or third party plugins don't need to be part of this repository
and can be added just importing `@pyscript/core` as module, there are a few
plugins that we would like to make available by default and these are
considered _core plugins_.

To add a _core plugin_ to this project define the plugin entry-point and name
in the `src/plugins` folder (see the `error.js` example) and create, if
necessary, a folder with the same name where extra files or dependencies can be
added.

The _build_ command will include plugins by name as artifacts so that the
bundler can create ad-hoc files within the `dist/` folder.

## Python

The `pyscript` package available in _Python_ lives in the folder
`src/stdlib/pyscript/`.

All _Python_ files will be embedded automatically whenever `npm run build`
happens and reflected into the `src/stdlib/pyscript.js` file.

Its _core_ responsibility is to ensure those files will be available through
the filesystem in either the _main_ thread, or any _worker_.

## Release

To cut a new release of PyScript simply
[add a new release](https://github.com/pyscript/pyscript/releases) while
remembering to write a comprehensive changelog. A
[GitHub action](https://github.com/pyscript/pyscript/blob/main/.github/workflows/publish-release.yml)
will kick in and ensure the release is described and deployed to a URL with the
pattern: https://pyscript.net/releases/YYYY.M.v/ (year/month/version - as per
our [CalVer](https://calver.org/) versioning scheme).

Then, the following three separate repositories need updating:

-   [Documentation](https://github.com/pyscript/docs) - Change the `version.json`
    file in the root of the directory and then `node version-update.js`.
-   [Homepage](https://github.com/pyscript/pyscript.net) - Ensure the version
    referenced in `index.html` is the latest version.
-   [PSDC](https://pyscript.com) - Use discord or Anaconda Slack (if you work at
    Anaconda) to let the PSDC team know there's a new version, so they can update
    their project templates.

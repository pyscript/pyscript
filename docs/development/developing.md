# Development Process

This document is intended to help you get started in developing software for the PyScript project. It assumes that you have [a working development environment](setting-up-environment.md). It also assumes you have a remote named `upstream` pointing to PyScript's repository and one named `origin` pointing to your own repository.

* First, make sure you are using the latest version of the pyscript main branch

```
git pull upstream main
```

* Update your fork with the latest changes

```
git push origin main
```

* Activate the conda environment (this environment will contain all the necessary dependencies)

```
conda activate pyscriptjs/env/
```
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **NOTE**: We are assuming you are in the root folder. If you are in the pyscriptjs you can run `conda activate env/` instead.

* Install pre-commit (you only need to do this once)

```
pre-commit install
```
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **NOTE**: On first run, pre-commit installs a bunch of hooks that will be run when you commit changes to your branch - this will make sure that your code is following our style (it will also lint your code automatically).

* Create a branch for the issue that you want to work on

```
git checkout -b <your branch name>
```

* Work on your changes

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **NOTE**: If you are working on a python file, you may encounter linting issues when pre-commit runs. Pyscript uses [black](https://black.readthedocs.io/en/stable/) to fix any linting problems automatically. All you need to do is add the changes again and commit using your previous commit message (the previous one that failed didn't complete due to black formatting files).

* Run tests before pushing the changes

```
make test
```

To learn more about tests please refer to the session [Quick guide to pytest](## Quick guide to pytest).

* When you make changes locally, double check that your contribution follows the PyScript formatting rules by running `npm run lint`. Note that in this case you're looking for the errors, <u>**NOT**</u> the warnings (Unless the warning is created by a local change). If an error is found by the linter you should fix it <u>**before**</u> creating a pull request.

#### Rebasing changes

Sometimes you might be asked to rebase the main branch into your local branch. Please refer to this [section on git rebase from GitHub docs](https://docs.github.com/en/get-started/using-git/about-git-rebase).

If you need help with anything, feel free to reach out and ask for help!


## Updating the changelog

As you work on your changes, please update the changelog file `changelog.md` with a short description of the changes you made. This will help us keep track of what has changed in each release.

You can look at the [changelog](../changelog.md) for examples on how to add your changes to the changelog. But here's a quick example:

```
2023.02.01
=========

Bug fixes
---------

- Fixed a bug that was causing the app to crash when you tried to do something #PR_NUMBER

Enhancements
------------

- Made awesome new feature #PR_NUMBER

Documentation
-------------

- Added a new section to the docs #PR_NUMBER

```

## Quick guide to pytest

We make heavy usage of `pytest`. Here is a quick guide and collection of
useful options:

- To run all tests in the current directory and subdirectories: `pytest`

- To run tests in a specific directory or file: `pytest path/to/dir/test_foo.py`

- `-s`: disables output capturing

- `--pdb`: in case of exception, enter a `(Pdb)` prompt so that you can
  inspect what went wrong.

- `-v`: verbose mode

- `-x`: stop the execution as soon as one test fails

- `-k foo`: run only the tests whose full name contains `foo`

- `-k 'foo and bar'`

- `-k 'foo and not bar'`


### Running integration tests under pytest

`make test` is useful to run all the tests, but during the development is
useful to have more control on how tests are run. The following guide assumes
that you are in the directory `pyscriptjs/tests/integration/`.

#### To run all the integration tests, single or multi core

```
$ pytest -xv
...

test_00_support.py::TestSupport::test_basic[chromium] PASSED                                              [  0%]
test_00_support.py::TestSupport::test_console[chromium] PASSED                                            [  1%]
test_00_support.py::TestSupport::test_check_js_errors_simple[chromium] PASSED                             [  2%]
test_00_support.py::TestSupport::test_check_js_errors_expected[chromium] PASSED                           [  3%]
test_00_support.py::TestSupport::test_check_js_errors_expected_but_didnt_raise[chromium] PASSED           [  4%]
test_00_support.py::TestSupport::test_check_js_errors_multiple[chromium] PASSED                           [  5%]
...
```

`-x` means "stop at the first failure". `-v` means "verbose", so that you can
see all the test names one by one. We try to keep tests in a reasonable order,
from most basic to most complex. This way, if you introduced some bug in very
basic things, you will notice immediately.

If you have the `pytest-xdist` plugin installed, you can run all the
integration tests on 4 cores in parallel:
```
$ pytest -n 4
```

#### To run a single test, headless
```
$ pytest test_01_basic.py -k test_pyscript_hello -s
...
[  0.00 page.goto       ] pyscript_hello.html
[  0.01 request         ] 200 - fake_server - http://fake_server/pyscript_hello.html
...
[  0.17 console.info    ] [py-loader] Downloading pyodide-0.22.1...
[  0.18 request         ] 200 - CACHED - https://cdn.jsdelivr.net/pyodide/v0.22.1/full/pyodide.js
...
[  3.59 console.info    ] [pyscript/main] PyScript page fully initialized
[  3.60 console.log     ] hello pyscript
```

`-k` selects tests by pattern matching as described above. `-s` instructs
`pytest` to show the output to the terminal instead of capturing it. In the
output you can see various useful things, including network requests and JS
console messages.

#### To run a single test, headed
```
$ pytest test_01_basic.py -k test_pyscript_hello -s --headed
...
```

Same as above, but with `--headed` the browser is shown in a window, and you
can interact with it. The browser uses a fake server, which means that HTTP
requests are cached.

Unfortunately, in this mode source maps does not seem to work, and you cannot
debug the original typescript source code. This seems to be a bug in
playwright, for which we have a workaround:

```
$ pytest test_01_basic.py -k test_pyscript_hello -s --headed --no-fake-server
...
```

As the name implies, `-no-fake-server` disables the fake server: HTTP requests
are not cached, but source-level debugging works.

Finally:

```
$ pytest test_01_basic.py -k test_pyscript_hello -s --dev
...
```

`--dev` implies `--headed --no-fake-server`. In addition, it also
automatically open chrome dev tools.

#### To run only main thread or worker tests

By default, we run each test twice: one with `execution_thread = "main"` and
one with `execution_thread = "worker"`. If you want to run only half of them,
you can use `-m`:

```
$ pytest -m main    # run only the tests in the main thread
$ pytest -m worker  # ron only the tests in the web worker
```

## Fake server, HTTP cache

By default, our test machinery uses a playwright router which intercepts and
cache HTTP requests, so that for example you don't have to download pyodide
again and again. This also enables the possibility of running tests in
parallel on multiple cores.

The cache is stored using the `pytest-cache` plugin, which means that it
survives across sessions.

If you want to temporarily disable the cache, the easiest thing is to use
`--no-fake-server`, which bypasses it completely.

If you want to clear the cache, you can use the special option
`--clear-http-cache`:

```
$ pytest --clear-http-cache
...
-------------------- SmartRouter HTTP cache --------------------
Requests found in the cache:
     https://raw.githubusercontent.com/pyscript/pyscript/main/README.md
     https://cdn.jsdelivr.net/pyodide/v0.22.1/full/repodata.json
     https://cdn.jsdelivr.net/pyodide/v0.22.1/full/pyodide.asm.js
     https://cdn.jsdelivr.net/pyodide/v0.22.1/full/micropip-0.1-py3-none-any.whl
     https://cdn.jsdelivr.net/pyodide/v0.22.1/full/pyodide.asm.data
     https://cdn.jsdelivr.net/pyodide/v0.22.1/full/pyodide.js
     https://cdn.jsdelivr.net/pyodide/v0.22.1/full/pyodide.asm.wasm
     https://cdn.jsdelivr.net/pyodide/v0.22.1/full/pyodide_py.tar
     https://cdn.jsdelivr.net/pyodide/v0.22.1/full/pyparsing-3.0.9-py3-none-any.whl
     https://cdn.jsdelivr.net/pyodide/v0.22.1/full/distutils.tar
     https://cdn.jsdelivr.net/pyodide/v0.22.1/full/packaging-21.3-py3-none-any.whl
Cache cleared
```

**NOTE**: this works only if you are inside `tests/integration`, or if you
explicitly specify `tests/integration` from the command line. This is due to
how `pytest` decides to search for and load the various `conftest.py`.

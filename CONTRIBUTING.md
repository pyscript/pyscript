# Contributing to PyScript

Thank you for wanting to contribute to the PyScript project!

## Table of contents

-   [Contributing to PyScript](#contributing-to-pyscript)
    -   [Table of contents](#table-of-contents)
-   [Code of Conduct](#code-of-conduct)
-   [Contributing](#contributing)
    -   [Reporting bugs](#reporting-bugs)
    -   [Creating useful issues](#creating-useful-issues)
    -   [Reporting security issues](#reporting-security-issues)
    -   [Asking questions](#asking-questions)
    -   [Setting up your local environment and developing](#setting-up-your-local-environment-and-developing)
    -   [Developing](#developing)
    -   [Rebasing changes](#rebasing-changes)
    -   [Building the docs](#building-the-docs)
    -   [Places to start](#places-to-start)
    -   [Setting up your local environment and developing](#setting-up-your-local-environment-and-developing)
    -   [Submitting a change](#submitting-a-change)
-   [License terms for contributions](#license-terms-for-contributions)
-   [Becoming a maintainer](#becoming-a-maintainer)
-   [Trademarks](#trademarks)

# Code of Conduct

The [PyScript Code of Conduct](https://github.com/pyscript/governance/blob/main/CODE-OF-CONDUCT.md) governs the project and everyone participating in it. By participating, you are expected to uphold this code. Please report unacceptable behavior to the maintainers or administrators as described in that document.

# Contributing

## Reporting bugs

Bugs are tracked on the [project issues page](https://github.com/pyscript/pyscript/issues). Please check if your issue has already been filed by someone else by searching the existing issues before filing a new one. Once your issue is filed, it will be triaged by another contributor or maintainer. If there are questions raised about your issue, please respond promptly.

## Creating useful issues

-   Use a clear and descriptive title.
-   Describe the specific steps that reproduce the problem with as many details as possible so that someone can verify the issue.
-   Describe the behavior you observed, and the behavior you had expected.
-   Include screenshots if they help make the issue clear.

## Reporting security issues

If you aren't confident that it is appropriate to submit a security issue using the above process, you can e-mail it to security@pyscript.net

## Asking questions

If you have questions about the project, using PyScript, or anything else, please ask in the [PyScript forum](https://community.anaconda.cloud/c/tech-topics/pyscript).

## Places to start

If you would like to contribute to PyScript, but you aren't sure where to begin, here are some suggestions:

-   **Read over the existing documentation.** Are there things missing, or could they be clearer? Make some changes/additions to those documents.
-   **Review the open issues.** Are they clear? Can you reproduce them? You can add comments, clarifications, or additions to those issues. If you think you have an idea of how to address the issue, submit a fix!
-   **Look over the open pull requests.** Do you have comments or suggestions for the proposed changes? Add them.
-   **Check out the examples.** Is there a use case that would be good to have sample code for? Create an example for it.

## Setting up your local environment and developing

If you would like to contribute to PyScript, you will need to set up a local development environment. The [following instructions](https://docs.pyscript.net/latest/development/setting-up-environment.html) will help you get started.

You can also read about PyScript's [development process](https://docs.pyscript.net/latest/development/developing.html) to learn how to contribute code to PyScript, how to run tests and what's the PR etiquette of the community!

## License terms for contributions

This Project welcomes contributions, suggestions, and feedback. All contributions, suggestions, and feedback you submitted are accepted under the [Apache 2.0](./LICENSE) license. You represent that if you do not own copyright in the code that you have the authority to submit it under the [Apache 2.0](./LICENSE) license. All feedback, suggestions, or contributions are not confidential.

## Becoming a maintainer

Contributors are invited to be maintainers of the project by demonstrating good decision making in their contributions, a commitment to the goals of the project, and consistent adherence to the [code of conduct](https://github.com/pyscript/governance/blob/main/CODE-OF-CONDUCT.md). New maintainers are invited by a 3/4 vote of the existing maintainers.

## Trademarks

The Project abides by the Organization's [trademark policy](https://github.com/pyscript/governance/blob/main/TRADEMARKS.md).

---

Part of MVG-0.1-beta.
Made with love by GitHub. Licensed under the [CC-BY 4.0 License](https://creativecommons.org/licenses/by-sa/4.0/).

# Quick guide to pytest

We make heavy usage of pytest. Here is a quick guide and collection of useful options:

-   To run all tests in the current directory and subdirectories: pytest

-   To run tests in a specific directory or file: pytest path/to/dir/test_foo.py

-   -s: disables output capturing

-   --pdb: in case of exception, enter a (Pdb) prompt so that you can inspect what went wrong.

-   -v: verbose mode

-   -x: stop the execution as soon as one test fails

-   -k foo: run only the tests whose full name contains foo

-   -k 'foo and bar'

-   -k 'foo and not bar'

## Running integration tests under pytest

make test is useful to run all the tests, but during the development is useful to have more control on how tests are run. The following guide assumes that you are in the directory pyscriptjs/tests/integration/.

### To run all the integration tests, single or multi core

$ pytest -xv
...

test_00_support.py::TestSupport::test_basic[chromium] PASSED [ 0%]
test_00_support.py::TestSupport::test_console[chromium] PASSED [ 1%]
test_00_support.py::TestSupport::test_check_js_errors_simple[chromium] PASSED [ 2%]
test_00_support.py::TestSupport::test_check_js_errors_expected[chromium] PASSED [ 3%]
test_00_support.py::TestSupport::test_check_js_errors_expected_but_didnt_raise[chromium] PASSED [ 4%]
test_00_support.py::TestSupport::test_check_js_errors_multiple[chromium] PASSED [ 5%]
...

-x means "stop at the first failure". -v means "verbose", so that you can see all the test names one by one. We try to keep tests in a reasonable order, from most basic to most complex. This way, if you introduced some bug in very basic things, you will notice immediately.

If you have the pytest-xdist plugin installed, you can run all the integration tests on 4 cores in parallel:

$ pytest -n 4

### To run a single test, headless

$ pytest test_01_basic.py -k test_pyscript_hello -s
...
[ 0.00 page.goto ] pyscript_hello.html
[ 0.01 request ] 200 - fake_server - http://fake_server/pyscript_hello.html
...
[ 0.17 console.info ] [py-loader] Downloading pyodide-x.y.z...
[ 0.18 request ] 200 - CACHED - https://cdn.jsdelivr.net/pyodide/vx.y.z/full/pyodide.js
...
[ 3.59 console.info ] [pyscript/main] PyScript page fully initialized
[ 3.60 console.log ] hello pyscript

-k selects tests by pattern matching as described above. -s instructs pytest to show the output to the terminal instead of capturing it. In the output you can see various useful things, including network requests and JS console messages.

### To run a single test, headed

$ pytest test_01_basic.py -k test_pyscript_hello -s --headed
...

Same as above, but with --headed the browser is shown in a window, and you can interact with it. The browser uses a fake server, which means that HTTP requests are cached.

Unfortunately, in this mode source maps does not seem to work, and you cannot debug the original typescript source code. This seems to be a bug in playwright, for which we have a workaround:

$ pytest test_01_basic.py -k test_pyscript_hello -s --headed --no-fake-server
...

As the name implies, -no-fake-server disables the fake server: HTTP requests are not cached, but source-level debugging works.

Finally:

$ pytest test_01_basic.py -k test_pyscript_hello -s --dev
...

--dev implies --headed --no-fake-server. In addition, it also automatically open chrome dev tools.

### To run only main thread or worker tests

By default, we run each test twice: one with execution_thread = "main" and one with execution_thread = "worker". If you want to run only half of them, you can use -m:

$ pytest -m main # run only the tests in the main thread
$ pytest -m worker # ron only the tests in the web worker

## Fake server, HTTP cache

By default, our test machinery uses a playwright router which intercepts and cache HTTP requests, so that for example you don't have to download pyodide again and again. This also enables the possibility of running tests in parallel on multiple cores.

The cache is stored using the pytest-cache plugin, which means that it survives across sessions.

If you want to temporarily disable the cache, the easiest thing is to use --no-fake-server, which bypasses it completely.

If you want to clear the cache, you can use the special option --clear-http-cache:

NOTE: this works only if you are inside tests/integration, or if you explicitly specify tests/integration from the command line. This is due to how pytest decides to search for and load the various conftest.py.

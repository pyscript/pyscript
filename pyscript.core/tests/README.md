# PyScript Test Suite

There are three aspects to our test suite. These are reflected in the layout of
the test directory:

1. `python` - contains the Python based test suite to exercise Python code
   **within** PyScript. These tests are run four differeng ways to ensure all
   combination of MicroPython/Pyodide and main thread/worker contexts are
   checked.
2. `javascript` - contains JavaScript tests to exercise PyScript _itself_, in
   the browser.
3. `manual` - contains tests to run manually in a browser, due to the complex
   nature of the tests.

We use [Playwright](https://playwright.dev/) to automate the running of the
Python and JavaScript test suites. We use
[uPyTest](https://github.com/ntoll/upytest) as a test framework for the Python
test suite. uPyTest is a "PyTest inspired" framework for running tests in the
browser on both MicroPython and Pyodide.

The automated (Playwright) tests are specified in the `integration.spec.js`
file in this directory.

All automatic tests live in either the `python` or `javascript` folders. All
the tests in these folder are run by CI or locally run by `make test` in the
root of this project. Alternatively, run `npm run test:integration` in the
PyScript source directory.

Similarly, some tests can only be run manually (due to their nature or
underlying complexity). These are in the `manual` directory and are in the form
of separate directories (each containing an `index.html`) or individual `*.html`
files to which you point your browser. Each separate test may exercise
JavaScript or Python code (or both), and the context for each separate test is
kept carefully isolated.

Some rules of thumb:

* We don't test upstream projects: we assume they have their own test suites,
  and if we find bugs, we file an issue upstream with an example of how to
  recreate the problem.
* We don't test browser functionality, we just have to trust that browsers work
  as advertised. Once again, if we find an issue, we report upstream.
* All test cases should include commentary describing the **intent** and
  context of the test.
* Tests in Python use [uPyTest](https://github.com/ntoll/upytest) (see the
  README for documentation), an "inspired by PyTest" test framework that works
  with both MicroPython and Pyodide in the browser. This means that all
  Python tests should work with both interpreters.
* Tests in JavaScript... (Andrea to explain). ;-)

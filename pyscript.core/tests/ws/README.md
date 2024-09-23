# PyScript Test Suite

The test suite is a bit of a mess. We need to fix it.

There are two dimensions to our tests:

1. Whether they are automatically run or have to be run manually.
2. Whether they exercise JavaScript or Python code.

All automatic tests live in the `integration` folder. All the tests in this
folder are run by CI or locally run by `make test` in the `pyscript.core`
directory. Within the `integration` folder are two sub-folders: `js`
for JavaScript related tests, and `python` for Python related tests.

Similarly, some tests can only be run manually (due to their nature or
underlying complexity). These are in the form of separate directories, each
containing an `index.html` to which you point your browser. Each separate test
may exercise JavaScript or Python (or both) code, and the context for each
separate test is kept carefully isolated.

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

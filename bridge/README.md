# @pyscript/bridge

Import Python utilities directly in JS

```js
// main thread
const { ffi: { func_a, func_b } } = await import('./test.js');

// test.js
import bridge from 'https://esm.run/@pyscript/bridge';
export const ffi = bridge(import.meta.url, { type: 'mpy', worker: false });

// test.py
def func_a(value):
    print(f"hello {value}")

def func_b():
    import sys
    return sys.version
```

### Options

  * **pyscript**: the release version to automatically import if not already available on the page. If no version is provided the *developers' channel* version will be used instead (for developers' purposes only).
  * **type**: `py` by default to bootstrap *Pyodide*.
  * **worker**: `true` by default to bootstrap in a *Web Worker*.
  * **config**: either a *string* or a PyScript compatible config *JS literal* to make it possible to bootstrap files and whatnot. If specified, the `worker` becomes implicitly `true` to avoid multiple configs conflicting on the main thread.
  * **env**: to share the same environment across multiple modules loaded at different times.


## Tests

Run `npx mini-coi .` within this folder to then reach out `http://localhost:8080/test/` that will show:

```
PyScript Bridge
------------------
no config
```

The [test.js](./test/test.js) files uses the following defaults:

  * `pyscript` as `"2025.8.1"`
  * `type` as `"mpy"`
  * `worker` as `false`
  * `config` as `undefined`
  * `env` as `undefined`

To test any variant use query string parameters so that `?type=py` will use `py` instead, `worker` will use a worker and `config` will use a basic *config* that brings in another file from the same folder which exposes the version.

To recap: `http://localhost:8080/test/?type=py&worker&config` will show this instead:

```
PyScript Bridge
------------------
3.12.7 (main, May 15 2025, 18:47:24) ...
```

Please note when a *config* is used, the `worker` attribute is always `true`.

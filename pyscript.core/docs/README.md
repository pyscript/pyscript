# PyScript Next

<sup>A summary of <code>@pyscript/core</code> features</sup>

### Getting started

Differently from [pyscript classic](https://github.com/pyscript/pyscript), where "*classic*" is the disambiguation name we use to describe the two versions of the project, `@pyscript/core` is an *ECMAScript Module* with the follow benefits:

  * it doesn't block the page like a regular script, without a `deferred` attribute, would
  * it allows modularity in the future
  * it bootstraps itself once but it allows exports via the module

Accordingly, this is the bare minimum required output to bootstrap *PyScript Next* in your page via a CDN:

```html
<!-- Option 1: based on esm.sh which in turns is jsdlvr -->
<script type="module" src="https://cdn.jsdelivr.net/npm/@pyscript/core"></script>

<!-- Option 2: based on unpkg.com -->
<script type="module" src="https://unpkg.com/@pyscript/core"></script>

<!-- Option X: any CDN that uses npmjs registry should work -->
```

Once the module is loaded, any `<script type="py"></script>` on the page, or any `<py-script>` tag, would automatically run its own code or the file defined as `src` attribute, after bootstrapping the *pyodide* interpreter.

If no `<script type="py">` or `<py-script>` tag is present, it is still possible to use the module to bootstrap via JS a *Worker*, bypassing the need to bootstrap *pyodide* on the main thread, hence without ever blocking the page.

```html
<script type="module">
  import { PyWorker } from "https://cdn.jsdelivr.net/npm/@pyscript/core";

  const worker = PyWorker("./code.py", { config: "./config.toml" /* optional */ });
</script>
```

Alternatively, it is possible to specify a `worker` attribute to either run embedded code or the provided `src` file.

#### CSS

If you are planning to use either `<py-config>` or `<py-script>` tags on the page, where latter case is usually better off with `<script type="py">` instead, you can also use CDNs to land our custom CSS:

```html
<!-- Option 1: based on esm.sh which in turns is jsdlvr -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@pyscript/core/dist/core.css">

<!-- Option 2: based on unpkg.com -->
<link rel="stylesheet" href="https://unpkg.com/@pyscript/core/dist/core.css">

<!-- Option X: any CDN that uses npmjs registry should work -->
```

The CSS is needed to avoid seeing content on the page before *PyScript* gets a chance to initialize itself. This means both `py-config` and `py-script` tags will have a `display:none` property which is overwritten by *PyScript* once it initialize each `py-script` custom element.

Once again, if you use `<script type="py">` instead, you won't need CSS unless you also have a `py-config` on the page, instead of using an external `config` file, defined via the `config` attribute:

```html
<script type="py" config="./config.toml">
  from pyscript import display

  display("Hello PyScript Next")
</script>
```

#### HTML Example

This is a complete reference to bootstrap *PyScript* in a HTML document.

```html
<!doctype html>
<html lang="en">
  <head>
    <title>PyScript Next</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@pyscript/core/dist/core.css">
    <script type="module" src="https://cdn.jsdelivr.net/npm/@pyscript/core"></script>
  </head>
  <body>
    <script type="py">
      from pyscript import document

      document.body.textContent = "PyScript Next"
    </script>
  </body>
</html>
```


## Tag attributes API

Either `<script type="py">` or `<py-script>` can have zero, one or more attributes:

  * **src** if defined, the content of the tag is ignored and the *Python* code in the file will be evaluated instead.
  * **config** if defined, the code will be evaluated after the configuration has been parsed but this can also be directly *JSON* so that both `config='{"packages":["numpy"]}'` and `config="./config.json"`, or `config="./config.toml"`, would be valid options.
  * **async** if present, it will run the *Python* code asynchronously.
  * **worker** if present, it will not bootstrap *pyodide* on the main page, only on the worker file it points at, as in `<script type="py" worker="./worker.py"></script>`. Both `async` and `config` attributes are also available and used to bootstrap the worker as desired.

Please note that other [polyscript's attributes](https://pyscript.github.io/polyscript/#script-attributes) are available too but their usage is more advanced.


## JS Module API

The module itself is currently exporting the following utilities:

  * **PyWorker**, which allows to bootstrap a *worker* with *pyodide* and the *pyscript* module available within the code. This callback accepts a file as argument, and an additional, and optional, `options` object literal, able to understand a `config`, which could also be directly a *JS* object literal instead of a JSON string or a file to point at, and `async` which if `true` will run the worker code with top level await enabled. Please note that the returned reference is exactly the same as [the polyscript's XWorker](https://pyscript.github.io/polyscript/#the-xworker-reference), exposing exact same utilities but granting on bootstrap all hooks are in place and the type is always *pyodide*.
  * **hooks**, which allows plugins to define *ASAP* callbacks or strings that should be executed either in the main thread or the worker before, or after, the code has been executed.

```js
import { hooks } from "https://cdn.jsdelivr.net/npm/@pyscript/core";

// example
hooks.onInterpreterReady.add((utils, element) => {
  console.log(element, 'found', 'pyscript is ready');
});

// the hooks namespace
({
    // each function is invoked before or after python gets executed
    // via: callback(pyScriptUtils, currentElement)
    /** @type {Set<function>} */
    onBeforeRun: new Set(),
    /** @type {Set<function>} */
    onBeforeRunAync: new Set(),
    /** @type {Set<function>} */
    onAfterRun: new Set(),
    /** @type {Set<function>} */
    onAfterRunAsync: new Set(),

    // each function is invoked once when PyScript is ready
    // and for each element via: callback(pyScriptUtils, currentElement)
    /** @type {Set<function>} */
    onInterpreterReady: new Set(),

    // each string is prepended or appended to the worker code
    /** @type {Set<string>} */
    codeBeforeRunWorker: new Set(),
    /** @type {Set<string>} */
    codeBeforeRunWorkerAsync: new Set(),
    /** @type {Set<string>} */
    codeAfterRunWorker: new Set(),
    /** @type {Set<string>} */
    codeAfterRunWorkerAsync: new Set(),
})
```

Please note that a *worker* is a completely different environment and it's not possible, by specifications, to pass a callback to it, which is why worker sets are strings and not functions.

However, each worker string can use `from pyscript import x, y, z` as that will be available out of the box.

## PyScript Python API

The `pyscript` python package offers various utilities in either the main thread or the worker.

The commonly shared utilities are:

  * **window** in both main and worker, refers to the actual main thread global window context. In classic PyScript that'd be the equivalent of `import js` in the main, which is still available in *PyScript Next*. However, to make code easily portable between main and workers, we decided to offer this named export but please note that in workers, this is still the *main* window, not the worker global context, which would be reachable instead still via `import js`.
  * **document** in both main and worker, refers to the actual main page `document`. In classic PyScript, this is the equivalent of `from js import document` on the main thread, but this won't ever work in a worker because there is no `document` in there. Fear not though, *PyScript Next* `document` will instead work out of the box, still accessing the main document behind the scene, so that `from pyscript import document` is granted to work in both main and workers seamlessly.
  * **display** in both main and worker, refers to the good old `display` utility except:
    * in the *main* it automatically uses the current script `target` to display content
    * in the *worker* it still needs to know *where* to display content using the `target="dom-id"` named argument, as workers don't get a default target attached
    * in both main and worker, the `append=True` is the *default* behavior, which is inherited from the classic PyScript.

#### Extra main-only features

  * **PyWorker** which allows Python code to create a PyScript worker with the *pyscript* module pre-bundled. Please note that running PyScript on the main requires *pyodide* bootstrap, but also every worker requires *pyodide* bootstrap a part, as each worker is an environment / sandbox a part. This means that using *PyWorker* in the main will take, even if the main interpreter is already up and running, a bit of time to bootstrap the worker, also accordingly to the config files or packages in it.


#### Extra worker-only features

  * **sync** which allows both main and the worker to seamlessly pass any serializable data around, without the need to convert Python dictionaries to JS object literals, as that's done automatically.

```html
<script type="module">
  import { PyWorker } from "https://cdn.jsdelivr.net/npm/@pyscript/core";

  const worker = PyWorker("./worker.py");

  worker.sync.alert_message = message => {
    alert(message);
  };
</script>
```

```python
from pyscript import sync

sync.alert_message("Hello Main!")
```

### Worker requirements

To make it possible to use what looks like *synchronous* DOM APIs, or any other API available via the `window` within a *worker*, we are using latest Web features such as [Atomics](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics).

Without going into too many details, this means that the *SharedArrayBuffer* primitive must be available, and to do so, the server should enable the following headers:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Resource-Policy: cross-origin
```

These headers allow local files to be secured and yet able to load resources from the Web (i.e. pyodide library or its packages).

> ℹ️ **Careful**: we are using and testing these headers on both Desktop and Mobile to be sure all major browsers work as expected (Safari, Firefox, Chromium based browsers). If you change the value of these headers please be sure you test your target devices and browsers properly.

Please note that if you don't have control over your server's headers, it is possible to simply put [mini-coi](https://github.com/WebReflection/mini-coi#readme) script at the root of your *PyScript with Workers* enabled folder (site root, or any subfolder).

```sh
cd project-folder

# grab mini-coi content and save it locally as mini-coi.js
curl -Ls https://unpkg.com/mini-coi -o mini-coi.js
```

With either these two solutions, it should be now possible to bootstrap a *PyScript Worker* without any issue.

#### mini-coi example
```html
<!doctype html>
<script src="/mini-coi.js"></script>
<script type="module">
  import { PyWorker } from "https://unpkg.com/@pyscript/core";
  PyWorker("./test.py");
</script>
<!-- ./test.py -->
<!--
from pyscript import document
document.body.textContent = "Hello PyScript Worker"
-->
```

Please note that a local or remote web server is still needed to allow the Service Worker and `python -m http.server` would do locally, *except* we need to reach `http://localhost:8000/`, not `http://0.0.0.0:8000/`, because the browser does not consider safe non localhost sites when the insecure `http://` protocol, instead of `https://`, is reached.


#### local server example
If you'd like to test locally these headers, without needing the *mini-coi* Service Worker, you can use various projects or, if you have *NodeJS* available, simply run the following command in the folder containing the site/project:

```sh
# bootstrap a local server with all headers needed
npx static-handler --cors --coep --coop --corp .
```


### F.A.Q.

<details>
  <summary><strong>why config attribute can also contain JSON but not TOML?</strong></summary>
  <div markdown=1>

The *JSON* standard doesn't require new lines or indentation so it felt quick and desired to allow inline JSON as attribute content.

It's true that HTML attributes can be multi-line too, if properly embedded, but that looked too awkward and definitively harder to explain to me.

We might decide to allow TOML too in the future, but the direct config as attribute, instead of a proper file, or the usage of `<py-config>`, is meant for quick and simple packages or files dependencies and not much else.

  </div>
</details>

<details>
  <summary><strong>what are the worker's caveats?</strong></summary>
  <div markdown=1>

When interacting with `window` or `document` it's important to understand that these use, behind the scene, an orchestrated [postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) dance.

This means that some kind of data that cannot be passed around, specially not compatible with the [structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm).

In short, please try to stick with *JS* references when passing along, or dealing with, *DOM* or other *APIs*.

  </div>
</details>

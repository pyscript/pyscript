# @pyscript/sw

<sup>**[PyScript](https://github.com/pyscript/pyscript) Service Worker**</sup>

---

## Documentation

This module provides a single, standalone, *script* able to bootstrap a Service Worker which can drive a whole site via Python code.

Please note the file *must* be available locally and it *must not* be loaded as a module, as a Service Worker is *not a module*.

### Example

This is the bare minimal example of an `index.html` file at the root of the site.

```html
<!doctype html>
<script src="./pyscript.sw.js"
        handler="./handler.py"
        config="./handler_config.toml"
        scope="."></script>
```

  * **src** is where the PyScript Service Worker is located.
  * **handler** is where Python code is located. This *must* provide a `handle_request` method that will be invoked per each browsing *fetch* operation. Such method should return a `[body, status, headers]` tuple where *body* is the content of the page, *status* is its *HTTP* status and *headers* contain the `content-type` or any other useful header.
  * **config** is an *optional* attribute that indicates packages to load, files to fetch, and all other usual [py-config goodness](https://pyscript.github.io/docs/latest/reference/elements/py-config.html).
  * **scope** (advanced use-case) is an *optional* attribute that indicates [where the Service Worker operates](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope). By default it operates from the same folder, and any subfolder, the `pyscript.sw.js` is.

#### How to update `handle_request`

Because the Service Worker, once activated, will persist over any further session, it is pretty hard to change its operating handler.

To do so, there are two options:

  * unregister the Service Worker, clear all browsing data per that domain and hard-refresh the browser
  * change and save your `handler.py` file and, once saved, reach the `/pyscript.sw/update_handler` via browser, or run the following code in console:

```js
fetch('/pyscript.sw/update_handler')
  .then(b => b.text())
  .then(console.log, console.error);
```

This operation will be intercepted behind the scene and the new file will be parsed.

The result should be an `OK` response, with status `200`, or an error message with status `500` handled by the `console.error` or visible within the page once reached.

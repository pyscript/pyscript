# Setting a pyodide runtime

Pyscript will automatically set the runtime for you, but you can also set it manually. This is useful if you want to use a different version than the one set by default.

## Development setup

To get started, let's create a new `index.html` file and import `pyscript.js`.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />

  <title>Runtime</title>

  <link rel="stylesheet" href="https://pyscript.net/latest/pyscript.css" />
  <script defer src="https://pyscript.net/latest/pyscript.js"></script>
  </head>

  <body>

  </body>
</html>
```

We are using the pyodide CDN to setup our runtime, but you can also download the files from [the pyodide GitHub release](https://github.com/pyodide/pyodide/releases/tag/0.22.0a3), unzip them and use the `pyodide.js` file as your runtime.

## Setting the runtime

To set the runtime, you can use the `runtime` configuration in the `py-config` element. In this tutorial, we will use the default `TOML` format, but know that you can also use `json` if you prefer by changing the `type` attribute of the `py-config` element.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />

  <title>Runtime</title>

  <link rel="stylesheet" href="https://pyscript.net/latest/pyscript.css" />
  <script defer src="https://pyscript.net/latest/pyscript.js"></script>
  </head>

  <body>
    <py-config>
      [[runtimes]]
        src = "https://cdn.jsdelivr.net/pyodide/v0.22.0a3/full/pyodide.js"
        name = "pyodide-0.22.0a3"
        lang = "python"
    </py-config>
  </body>
</html>
```

## Confirming the runtime version

To confirm that the runtime is set correctly, you can open the DevTools and check the version from the console. But for the sake of this tutorial, let's create a `py-script` tag and print pyodide's version.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />

  <title>Runtime</title>

  <link rel="stylesheet" href="https://pyscript.net/latest/pyscript.css" />
  <script defer src="https://pyscript.net/latest/pyscript.js"></script>
  </head>

  <body>
    <py-config>
      [[runtimes]]
        src = "https://cdn.jsdelivr.net/pyodide/v0.22.0a3/full/pyodide.js"
        name = "pyodide-0.22.0a3"
        lang = "python"
    </py-config>
    <py-script>
      import pyodide
      print(pyodide.__version__)
    </py-script>
  </body>
</html>
```

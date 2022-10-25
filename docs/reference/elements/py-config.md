# &lt;py-config&gt;

Use the `<py-config>` tag to set and configure general metadata along with declaring dependencies for your PyScript application. The configuration has to be set in either [TOML](https://toml.io/) or [JSON](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/JSON) format.

The `<py-config>` element should be placed within the `<body>` element.

## Attributes

| attribute | type | default | description |
|----|----|----|----|
| **type** | string | "toml" | Syntax type of the `<py-config>`. Value can be `json` or `toml`. Default: "toml" if type is unspecifed. |
| **src** | url |    | Source url to an external configuration file. |

## Examples

- `<py-config>` using TOML (default)
```html
<py-config>
  autoclose_loader = true

  [[runtimes]]
  src = "https://cdn.jsdelivr.net/pyodide/v0.21.2/full/pyodide.js"
  name = "pyodide-0.21.2"
  lang = "python"
</py-config>
```
Note: `[[runtimes]]` is a TOML table. Make sure this is the last item within a py-config, as the properties created after it go into the runtimes object.

- JSON config using the `type` attribute.
```html
<py-config type="json">
  {
    "autoclose_loader": true,
    "runtimes": [{
      "src": "https://cdn.jsdelivr.net/pyodide/v0.21.2/full/pyodide.js",
      "name": "pyodide-0.21.2",
      "lang": "python"
    }]
  }
</py-config>
```

- Use of the `src` attribute:
```
<py-config src="./custom.toml"></py-config>
```
where `custom.toml` contains

```
autoclose_loader = true
[[runtimes]]
src = "https://cdn.jsdelivr.net/pyodide/v0.21.2/full/pyodide.js"
name = "pyodide-0.21.2"
lang = "python"
```

- JSON using the `type` attribute.
```
<py-config type="json" src="./custom.json"></py-config>
```
where `custom.json` contains

```
{
  "autoclose_loader": true,
  "runtimes": [{
    "src": "https://cdn.jsdelivr.net/pyodide/v0.21.2/full/pyodide.js",
    "name": "pyodide-0.21.2",
    "lang": "python"
  }]
}
```

One can also use both i.e pass the config from `src` attribute as well as specify it as `inline`. So the following snippet is also valid:

```
<py-config src="./custom.toml">
  paths = ["./utils.py"]
</py-config>
```

This can also be done via JSON using the `type` attribute.

```
<py-config type="json" src="./custom.json">
  {
    "paths": ["./utils.py"]
  }
</py-config>
```

Note: While the `<py-config>` tag supports both TOML and JSON, one cannot mix the type of config passed from 2 different sources i.e. the case when inline config is in TOML format while config from src is in JSON format is NOT allowed. Similarly for the opposite case.

---

This is helpful in cases where a number of applications share a common configuration (which can be supplied via `src`), but their specific keys need to be customised and overridden.

The keys supplied through `inline` override the values present in config supplied via `src`.

One can also declare dependencies so as to get access to many 3rd party OSS packages that are supported by PyScript.
You can also link to `.whl` files directly on disk like in our [toga example](https://github.com/pyscript/pyscript/blob/main/examples/toga/freedom.html).

Package dependencies in the `<py-config>` can be declared by using the direct link to the package URL (whl or any other format supported by the chosen runtime) or by just providing the package name [and version]. If only the name [and version] are provided, packages will be installed directly from what's provided by your runtime or from PyPI.

NOTICE that only pure python packages from PyPI will work and packages with C dependencies will not. These need to be built specifically for WASM (please, consult the Pyodide project for more information about what's supported and on how to build packages with C dependencies)

```
<py-config>
  packages = ["./static/wheels/travertino-0.1.3-py3-none-any.whl"]
</py-config>
```

OR in JSON like

```
<py-config type="json">
  {
    "packages": ["./static/wheels/travertino-0.1.3-py3-none-any.whl"]
  }
</py-config>
```

If your `.whl` is not a pure Python wheel, then open a PR or issue with [pyodide](https://github.com/pyodide/pyodide) to get it added [here](https://github.com/pyodide/pyodide/tree/main/packages).

If there's enough popular demand, the pyodide team will likely work on supporting your package. Regardless, things will likely move faster if you make the PR and consult with the team to get unblocked.

For example, NumPy and Matplotlib are available. Notice here we're using `<py-script output="plot">`
as a shortcut, which takes the expression on the last line of the script and runs `pyscript.write('plot', fig)`.

```html
<html>
    <head>
      <link rel="stylesheet" href="https://pyscript.net/latest/pyscript.css" />
      <script defer src="https://pyscript.net/latest/pyscript.js"></script>
    </head>

  <body>
    <h1>Let's plot random numbers</h1>
    <div id="plot"></div>
    <py-config type="json">
        {
          "packages": ["numpy", "matplotlib"]
        }
    </py-config>
    <py-script output="plot">
      import matplotlib.pyplot as plt
      import numpy as np
      x = np.random.randn(1000)
      y = np.random.randn(1000)
      fig, ax = plt.subplots()
      ax.scatter(x, y)
      fig
    </py-script>
  </body>
</html>
```

## Local modules

In addition to packages, you can declare local Python modules that will
be imported in the `<py-script>` tag. For example, we can place the random
number generation steps in a function in the file `data.py`.

```python
# data.py
import numpy as np
def make_x_and_y(n):
    x = np.random.randn(n)
    y = np.random.randn(n)
    return x, y
```

In the HTML tag `<py-config>`, paths to local modules are provided in the
`paths:` key.

```html
<html>
    <head>
      <link rel="stylesheet" href="https://pyscript.net/latest/pyscript.css" />
      <script defer src="https://pyscript.net/latest/pyscript.js"></script>
    </head>

  <body>
    <h1>Let's plot random numbers</h1>
    <div id="plot"></div>
    <py-config type="toml">
        packages = ["numpy", "matplotlib"]
        paths = ["./data.py"]
    </py-config>
    <py-script output="plot">
      import matplotlib.pyplot as plt
      from data import make_x_and_y
      x, y = make_x_and_y(n=1000)
      fig, ax = plt.subplots()
      ax.scatter(x, y)
      fig
    </py-script>
  </body>
</html>
```

The following optional values are supported by `<py-config>`:
| Value | Type | Description |
| ------ | ---- | ----------- |
| `name` | string | Name of the user application. This field can be any string and is to be used by the application author for their own customization purposes. |
| `description` | string | Description of the user application. This field can be any string and is to be used by the application author for their own customization purposes. |
| `version` | string | Version of the user application. This field can be any string and is to be used by the application author for their own customization purposes. It is not related to the PyScript version. |
| `schema_version` | number | The version of the config schema which determines what all keys are supported. This can be supplied by the user so PyScript knows what to expect in the config. If not supplied, the latest version for the schema is automatically used. |
| `type` | string | Type of the project. The default is an "app" i.e. a user application |
| `author_name` | string | Name of the author. |
| `author_email` | string | Email of the author. |
| `license` | string | License to be used for the user application. |
| `autoclose_loader` | boolean | If false, PyScript will not close the loading splash screen when the startup operations finish. |
| `packages` | List of Packages | Dependencies on 3rd party OSS packages are specified here. The default value is an empty list. |
| `paths` | List of Paths | Local Python modules are to be specified here. The default value is an empty list. |
| `plugins` | List of Plugins | List of Plugins are to be specified here. The default value is an empty list. |
| `runtimes` | List of Runtimes | List of runtime configurations, described below. The default value contains a single Pyodide based runtime. |

A runtime configuration consists of the following:
| Value | Type | Description |
| ----- | ---- | ----------- |
| `src` | string (Required) | URL to the runtime source. |
| `name` | string | Name of the runtime. This field can be any string and is to be used by the application author for their own customization purposes |
| `lang` | string | Programming language supported by the runtime. This field can be used by the application author to provide clarification. It currently has no implications on how PyScript behaves. |

Besides the above schema, a user can also supply any extra keys and values that are relevant as metadata information or perhaps are being used within the application.

For example, a valid config could also be with the snippet below:

```
<py-config type="toml">
  magic = "unicorn"
</py-config>
```

OR in JSON like

```
<py-config type="json">
  {
    "magic": "unicorn"
  }
</py-config>
```

If this `"magic"` key is present in config supplied via `src` and also present in config supplied via `inline`, then the value in the inline config is given priority i.e. the overriding process also works for custom keys.

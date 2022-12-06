# &lt;py-config&gt;

Use the `<py-config>` tag to set and configure general metadata along with declaring dependencies for your PyScript application. The configuration has to be set in either [TOML](https://toml.io/)(default) or [JSON](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/JSON) format.

If you are unfamiliar with TOML, consider [reading about it](https://learnxinyminutes.com/docs/toml/) or if you are unfamiliar with JSON, consider reading [freecodecamp's JSON for beginners](https://www.freecodecamp.org/news/what-is-json-a-json-file-example/) guide for more information.

The `<py-config>` element should be placed within the `<body>` element.

## Attributes

| attribute | type   | default | description                                                                                             |
|-----------|--------|---------|---------------------------------------------------------------------------------------------------------|
| **type**  | string | "toml"  | Syntax type of the `<py-config>`. Value can be `json` or `toml`. Default: "toml" if type is unspecifed. |
| **src**   | url    |         | Source url to an external configuration file.                                                           |

## Examples

### Defining an inline config

- `<py-config>` using TOML (default)

```{note}
Reminder: when using TOML, any Arrays of Tables defined with double-brackets (like `[[runtimes]]` and `[[fetch]]` must come after individual keys (like `plugins = ...` and `packages=...`)
```

```html
<py-config>
  [splashscreen]
  autoclose = true

  [[runtimes]]
  src = "https://cdn.jsdelivr.net/pyodide/v0.21.2/full/pyodide.js"
  name = "pyodide-0.21.2"
  lang = "python"
</py-config>
```

- `<py-config>` using JSON via `type` attribute

```html
<py-config type="json">
  {
    "splashscreen": {
      "autoclose": true
    },
    "runtimes": [{
      "src": "https://cdn.jsdelivr.net/pyodide/v0.21.2/full/pyodide.js",
      "name": "pyodide-0.21.2",
      "lang": "python"
    }]
  }
</py-config>
```

### Defining a file based config

- Use of the `src` attribute

```html
<py-config src="./custom.toml"></py-config>
```
where `custom.toml` contains

```toml
[splashscreen]
autoclose = true

[[runtimes]]
src = "https://cdn.jsdelivr.net/pyodide/v0.21.2/full/pyodide.js"
name = "pyodide-0.21.2"
lang = "python"
```

- JSON using the `type` and `src` attribute

```html
<py-config type="json" src="./custom.json"></py-config>
```
where `custom.json` contains

```json
{
  "splashscreen": {
    "autoclose": true,
  },
  "runtimes": [{
    "src": "https://cdn.jsdelivr.net/pyodide/v0.21.2/full/pyodide.js",
    "name": "pyodide-0.21.2",
    "lang": "python"
  }]
}
```

### Mixing inline and file based configs

One can also use both i.e pass the config from `src` attribute as well as specify it as `inline`. So the following snippet is also valid:

```html
<py-config src="./custom.toml">
  [[fetch]]
  files = ["./utils.py"]
</py-config>
```

This can also be done via JSON using the `type` attribute.

```html
<py-config type="json" src="./custom.json">
  {
    "fetch": [{
      "files": ["./utils.py"]
    }]
  }
</py-config>
```

Note: While the `<py-config>` tag supports both TOML and JSON, one cannot mix the type of config passed from 2 different sources i.e. the case when inline config is in TOML format while config from src is in JSON format is NOT allowed. Similarly for the opposite case.

---

This is helpful in cases where a number of applications share a common configuration (which can be supplied via `src`), but their specific keys need to be customised and overridden.

The keys supplied through `inline` override the values present in config supplied via `src`.

## Dependencies and Packages

One can also declare dependencies so as to get access to many 3rd party OSS packages that are supported by PyScript.
You can also link to `.whl` files directly on disk like in our [toga example](https://github.com/pyscript/pyscript/blob/main/examples/toga/freedom.html).

Package dependencies in the `<py-config>` can be declared by using the direct link to the package URL (whl or any other format supported by the chosen runtime) or by just providing the package name [and version]. If only the name [and version] are provided, packages will be installed directly from what's provided by your runtime or from PyPI.

NOTICE that only pure python packages from PyPI will work and packages with C dependencies will not. These need to be built specifically for WASM (please, consult the Pyodide project for more information about what's supported and on how to build packages with C dependencies)

```html
<py-config>
  packages = ["./static/wheels/travertino-0.1.3-py3-none-any.whl"]
</py-config>
```

OR in JSON like

```html
<py-config type="json">
  {
    "packages": ["./static/wheels/travertino-0.1.3-py3-none-any.whl"]
  }
</py-config>
```

If your `.whl` is not a pure Python wheel, then open a PR or issue with [pyodide](https://github.com/pyodide/pyodide) to get it added [here](https://github.com/pyodide/pyodide/tree/main/packages).

If there's enough popular demand, the pyodide team will likely work on supporting your package. Regardless, things will likely move faster if you make the PR and consult with the team to get unblocked.

For example, NumPy and Matplotlib are available. Notice here we're using `display(fig, target="plot")`, which takes the graph and displays it in the element with the id `plot`.


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
    <py-script>
      import matplotlib.pyplot as plt
      import numpy as np
      x = np.random.randn(1000)
      y = np.random.randn(1000)
      fig, ax = plt.subplots()
      ax.scatter(x, y)
      display(fig, target="plot")
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
`files` key within the `fetch` section. Refer to the [fetch](#fetch) section for
more details.

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

        [[fetch]]
        files = ["./data.py"]
    </py-config>
    <py-script>
      import matplotlib.pyplot as plt
      from data import make_x_and_y
      x, y = make_x_and_y(n=1000)
      fig, ax = plt.subplots()
      ax.scatter(x, y)
      display(fig, target="plot")
    </py-script>
  </body>
</html>
```

## Supported configuration values

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
| `fetch` | List of Stuff to fetch | Local Python modules OR resources from the internet are to be specified here using a Fetch Configuration, described below. The default value is an empty list. |
| `plugins` | List of Plugins | List of Plugins are to be specified here. The default value is an empty list. |
| `runtimes` | List of Runtimes | List of runtime configurations, described below. The default value contains a single Pyodide based runtime. |

### <a name="fetch">Fetch</a>

A fetch configuration consists of the following:

| Value        | Type            | Description                                     |
|--------------|-----------------|-------------------------------------------------|
| `from`       | string          | Base URL for the resource to be fetched.        |
| `to_folder`  | string          | Name of the folder to create in the filesystem. |
| `to_file`    | string          | Name of the target to create in the filesystem. |
| `files`      | List of strings | List of files to be downloaded.                 |

The parameters `to_file` and `files` shouldn't be supplied together.

#### Mechanism

The `fetch` mechanism works in the following manner:

- If both `files` and `to_file` parameters are supplied: Error!
- `from` defaults to an empty string i.e. `""` to denote relative URLs of the serving directory
- `to_folder` defaults to `.` i.e. the current working directory of the filesystem
- If `files` is specified
  - for each `file` present in the `files` array
    - the `sourcePath` is calculated as `from + file`
    - the `destination` is calculated as `to_folder + file`
      - thus, the object is downloaded from `sourcePath` to `destination`
- Else i.e. `files` is NOT specified
  - If `to_file` is specified
    - the object is downloaded from `from` to `to_folder + to_file`
  - Otherwise, calculate the `filename` at the end of `from` i.e. the part after last `/`
    - the object is downloaded from `from` to `to_folder + filename at the end of 'from'`

Learn more about `fetch` on PyScript [here](https://jeff.glass/post/whats-new-pyscript-2022-12-1)

#### Use-Cases

Assumptions:

The directory being served has the following tree structure:

```
content/
  ├─ index.html <<< File with <py-config>
  ├─ info.txt
  ├─ data/
  │  ├─ sensordata.csv
  ├─ packages/
  │  ├─ my_package/
  │  │  ├─ __init__.py
  │  │  ├─ helloworld/
  │  │  │  ├─ __init__.py
  │  │  │  ├─ greetings.py
```

1. Fetching a single file

```html
<py-config>
    [[fetch]]
    files = ['info.txt']
</py-config>
```

```html
<py-script>
    with open('info.txt', 'r') as fp:
      print(fp.read())
</py-script>
```

2. Single File with Renaming

```html
<py-config>
    [[fetch]]
    from = 'info.txt'
    to_file = 'info_loaded_from_web.txt'
</py-config>
```

```html
<py-script>
    with open('info_loaded_from_web.txt', 'r') as fp:
      print(fp.read())
</py-script>
```

3. Single File to another Directory

```html
<py-config>
    [[fetch]]
    files = ['info.txt']
    to_folder = 'infofiles/loaded_info'
</py-config>
```

```html
<py-script>
    with open('infofiles/loaded_info/info.txt', 'r') as fp:
      print(fp.read())
</py-script>
```

4. Single File to another Directory with Renaming

```html
<py-config>
    [[fetch]]
    from = 'info.txt'
    to_folder = 'infofiles/loaded_info'
    to_file = 'info_loaded_from_web.txt'
</py-config>
```

```html
<py-script>
    with open('infofiles/loaded_info/info_loaded_from_web.txt', 'r') as fp:
      print(fp.read())
</py-script>
```

5. Single file from a folder to the current working directory

```html
<py-config>
    [[fetch]]
    from = 'data/'
    files = ['sensordata.csv']
</py-config>
```

```html
<py-script>
    with open('./sensordata.csv', 'r') as fp:
      print(fp.read())
</py-script>
```

6. Single file from a folder to another folder (i.e. not the current working directory)

```html
<py-config>
    [[fetch]]
    from = 'data/'
    to_folder = './local_data'
    files = ['sensordata.csv']
</py-config>
```

```html
<py-script>
    with open('./local_data/sensordata.csv', 'r') as fp:
      print(fp.read())
</py-script>
```

7. Multiple files preserving directory structure

```html
<py-config>
    [[fetch]]
    from = 'packages/my_package/'
    files = ['__init__.py', 'helloworld/greetings.py', 'helloworld/__init__.py']
    to_folder = 'custom_pkg'
</py-config>
```

```html
<py-script>
    from custom_pkg.helloworld.greetings import say_hi
    print(say_hi())
</py-script>
```

8. From an API endpoint which doesn't end in a filename

```html
<py-config>
    [[fetch]]
    from = 'https://catfact.ninja/fact'
    to_file = './cat_fact.json'
</py-config>
```

```html
<py-script>
    import json
    with open("cat_fact.json", "r") as fp:
      data = json.load(fp)
</py-script>
```

### Runtime

A runtime configuration consists of the following:
| Value  | Type              | Description |
|--------|-------------------|-------------|
| `src`  | string (Required) | URL to the runtime source. |
| `name` | string            | Name of the runtime. This field can be any string and is to be used by the application author for their own customization purposes |
| `lang` | string            | Programming language supported by the runtime. This field can be used by the application author to provide clarification. It currently has no implications on how PyScript behaves. |

#### Example

- The default runtime is `pyodide`, another version of which can be specified as following

```html
<py-config>
  [[runtimes]]
  src = "https://cdn.jsdelivr.net/pyodide/v0.20.0/full/pyodide.js"
  name = "pyodide-0.20.0"
  lang = "python"
</py-config>
```

## Supplying extra information (or metadata)

Besides the above schema, a user can also supply any extra keys and values that are relevant as metadata information or perhaps are being used within the application.

For example, a valid config could also be with the snippet below:

```html
<py-config type="toml">
  magic = "unicorn"
</py-config>
```

OR in JSON like

```html
<py-config type="json">
  {
    "magic": "unicorn"
  }
</py-config>
```

If this `"magic"` key is present in config supplied via `src` and also present in config supplied via `inline`, then the value in the inline config is given priority i.e. the overriding process also works for custom keys.

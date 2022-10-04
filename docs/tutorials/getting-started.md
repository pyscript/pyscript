# Getting started with PyScript

This page will guide you through getting started with PyScript.

## Development setup

PyScript does not require any development environment other
than a web browser (we recommend using [Chrome](https://www.google.com/chrome/)) and a text editor, even though using your [IDE](https://en.wikipedia.org/wiki/Integrated_development_environment) of choice might be convenient.

If you're using [VSCode](https://code.visualstudio.com/), the
[Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
can be used to reload the page as you edit the HTML file.

## Trying before installing

If you're new to programming and know nothing about HTML or just want to try some of PyScript features, we recommend using the [REPL](https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop) element in the [PyScript REPL example](https://pyscript.net/examples/repl.html) instead so you can have a programming experience in a REPL that doesn't require any setup. This REPL can be used to have an interactive experience using Python directly.

 Alternatively, you can also use an online editor like W3School's [TryIt Editor](https://www.w3schools.com/html/tryit.asp?filename=tryhtml_default_default) and just plug the code below into it, as shown in the [example](https://docs.pyscript.net/latest/concepts/what-is-pyscript.html#example) page and click the run button.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />

    <title>REPL</title>

    <link rel="icon" type="image/png" href="favicon.png" />
    <link rel="stylesheet" href="https://pyscript.net/latest/pyscript.css" />
    <script defer src="https://pyscript.net/latest/pyscript.js"></script>
  </head>

  <body>
    Hello world! <br>
    This is the current date and time, as computed by Python:
    <py-script>
from datetime import datetime
now = datetime.now()
now.strftime("%m/%d/%Y, %H:%M:%S")
    </py-script>
  </body>
</html>
```

You could try changing the code above to explore and play with pyscript yourself.

## Installation

There is no installation required. In this document, we'll use
the PyScript assets served on [https://pyscript.net](https://pyscript.net).

If you want to download the source and build it yourself, follow
the instructions in the [README.md](https://github.com/pyscript/pyscript/blob/main/README.md) file.

## Your first PyScript HTML file

Here's a "Hello, world!" example using PyScript.

Using your favorite editor, create a new file called `hello.html` in
the same directory as your PyScript, JavaScript, and CSS files with the
following content, and open the file in your web browser. You can typically
open an HTML by double-clicking it in your file explorer.

```html
<html>
  <head>
    <link rel="stylesheet" href="https://pyscript.net/latest/pyscript.css" />
    <script defer src="https://pyscript.net/latest/pyscript.js"></script>
  </head>
  <body> <py-script> print('Hello, World!') </py-script> </body>
</html>
```

Notice the use of the `<py-script>` tag in the HTML body. This
is where you'll write your Python code. In the following sections, we'll
introduce the eight tags provided by PyScript.

## The py-script tag

The `<py-script>` tag lets you execute multi-line Python scripts and
print back onto the page. For example, we can compute π.

```html
<html>
  <head>
    <link rel="stylesheet" href="https://pyscript.net/latest/pyscript.css" />
    <script defer src="https://pyscript.net/latest/pyscript.js"></script>
  </head>
  <body>
      <py-script>
        print("Let's compute π:")
        def compute_pi(n):
            pi = 2
            for i in range(1,n):
                pi *= 4 * i ** 2 / (4 * i ** 2 - 1)
            return pi

        pi = compute_pi(100000)
        s = f"π is approximately {pi:.3f}"
        print(s)
      </py-script>
  </body>
</html>
```

### Writing into labeled elements

In the example above, we had a single `<py-script>` tag printing
one or more lines onto the page in order. Within the `<py-script>`, you
have access to the `pyscript` module, which provides a `.write()` method
to send strings into labeled elements on the page.

For example, we'll add some style elements and provide placeholders for
the `<py-script>` tag to write to.

```html
<html>
    <head>
      <link rel="stylesheet" href="https://pyscript.net/latest/pyscript.css" />
      <script defer src="https://pyscript.net/latest/pyscript.js"></script>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet" crossorigin="anonymous">
    </head>

  <body>
    <b><p>Today is <u><label id='today'></label></u></p></b>
    <br>
    <div id="pi" class="alert alert-primary"></div>
    <py-script>
      import datetime as dt
      pyscript.write('today', dt.date.today().strftime('%A %B %d, %Y'))

      def compute_pi(n):
          pi = 2
          for i in range(1,n):
              pi *= 4 * i ** 2 / (4 * i ** 2 - 1)
          return pi

      pi = compute_pi(100000)
      pyscript.write('pi', f'π is approximately {pi:.3f}')
    </py-script>
  </body>
</html>
```

## The py-config tag

Use the `<py-config>` tag to set and configure general metadata along with declaring dependencies for your PyScript application. The configuration has to be set in either TOML or JSON format. If you are unfamiliar with JSON, consider reading [freecodecamp's JSON for beginners](https://www.freecodecamp.org/news/what-is-json-a-json-file-example/) guide for more information. And for TOML, consider reading about it [here](https://learnxinyminutes.com/docs/toml/).

The ideal place to use `<py-config>` in between the `<body>...</body>` tags.

The `<py-config>` tag can be used as follows:

```html
<py-config>
  autoclose_loader = true

  [[runtimes]]
  src = "https://cdn.jsdelivr.net/pyodide/v0.21.2/full/pyodide.js"
  name = "pyodide-0.21.2"
  lang = "python"
</py-config>
```

Alternatively, a JSON config can be passed using the `type` attribute.

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

Besides passing the config as inline (as shown above), one can also pass it with the `src` attribute. This is demonstrated below:

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

This can also be done via JSON using the `type` attribute. By default, `type` is set to `"toml"` if not supplied.

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

### Local modules

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

Besides the above format, a user can also supply any extra keys and values that are relevant as metadata information or perhaps are being used within the application.

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

## The py-repl tag

The `<py-repl>` tag creates a REPL component that is rendered to the page as a code editor, allowing you to write executable code inline.
```html
<html>
  <head>
    <link rel="stylesheet" href="https://pyscript.net/latest/pyscript.css" />
    <script defer src="https://pyscript.net/latest/pyscript.js"></script>
  </head>
  <py-repl></py-repl>
</html>
```

## Visual component tags

The following tags can be used to add visual attributes to your HTML page.

| Tag             | Description |
| ---             | ----------- |
| `<py-inputbox>` | Adds an input box that can be used to prompt users to enter input values. |
| `<py-box>`      | Creates a container object that can be used to host one or more visual components that define how elements of `<py-box>` should align and show on the page. |
| `<py-button>`   | Adds a button to which authors can add labels and event handlers for actions on the button, such as `on_focus` or `on_click`. |
| `<py-title>`    | Adds a static text title component that styles the text inside the tag as a page title. |

```{note}
All the elements above are experimental and not implemented at their full functionality. Use them with the understanding that the APIs or full support might change or be removed until the visual components are more mature.
```

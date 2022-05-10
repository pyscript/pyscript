# Getting started with PyScript

This page will guide you through getting started with PyScript.

## Development setup

PyScript does not require any development environment other
than a web browser. We recommend using [Chrome](https://www.google.com/chrome/).

If you're using [VSCode](https://code.visualstudio.com/), the
[Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
can be used to reload the page as you edit the HTML file.

## Installation

There is no installation required. In this document we'll use
the PyScript assets served on https://pyscript.net.

If you want to download the source and build it yourself, follow
the instructions in the README.md file.

## Your first PyScript HTML file

Here's a "Hello, world!" example using PyScript.

Using your favorite editor create a new file called `hello.html` in
the same directory as your PyScript, JavaScript, and CSS files with the
following content, and open the file in your web browser. You can typically
open an HTML by double clicking it in your file explorer.

```html
<html>
  <head>
    <link rel="stylesheet" href="https://pyscript.net/alpha/pyscript.css" />
    <script defer src="https://pyscript.net/alpha/pyscript.js"></script>
  </head>
  <body> <py-script> print('Hello, World!') </py-script> </body>
</html>
```

Notice the use of the `<py-script>` tag in the HTML body. This
is where you'll write your Python code. In the following sections we'll
introduce the 8 tags provided by PyScript.

## The py-script tag

The `<py-script>` tag lets you execute multi-line Python scripts and
print back onto the page. For
example, we can compute π.

```html
<html>
  <head>
    <link rel="stylesheet" href="https://pyscript.net/alpha/pyscript.css" />
    <script defer src="https://pyscript.net/alpha/pyscript.js"></script>
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

In the example above we had a single `<py-script>` tag and it printed
one or more lines onto the page in order. Within the `<py-script>` you
have access to the `pyscript` module, which provides a `.write()` method
to send strings into labeled elements on the page.

For example we'll add some style elements and provide place holders for
the `<py-script>` tag write to.

```html
<html>
    <head>
      <link rel="stylesheet" href="https://pyscript.net/alpha/pyscript.css" />
      <script defer src="https://pyscript.net/alpha/pyscript.js"></script>
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

## Packages and modules

In addition to the [Python Standard Library](https://docs.python.org/3/library/) and
the `pyscript` module, many 3rd-party OSS packages will work out-of-the-box with PyScript.

In order to use them you will need to declare the dependencies using the `<py-env>` in the
HTML head. You can also link to `.whl` files directly on disk like in our [toga example](https://github.com/pyscript/pyscript/blob/main/pyscriptjs/examples/toga/freedom.html)

```
<py-env>
- './static/wheels/travertino-0.1.3-py3-none-any.whl'
</py-env>
```

If your `.whl` is not a pure Python wheel, then open a PR or issue with [pyodide](https://github.com/pyodide/pyodide) to get it added [here](https://github.com/pyodide/pyodide/tree/main/packages).
If there's enough popular demand the pyodide team will likely work on supporting your package, regardless things will likely move faster if you make the PR and consult with the team to get unblocked.

For example, NumPy and Matplotlib are available. Notice here we're using `<py-script output="plot">`
as a shortcut, which takes the expression on the last line of the script and runs `pyscript.write('plot', fig)`.


```html
<html>
    <head>
      <link rel="stylesheet" href="https://pyscript.net/alpha/pyscript.css" />
      <script defer src="https://pyscript.net/alpha/pyscript.js"></script>
      <py-env>
        - numpy
        - matplotlib
      </py-env>
    </head>

  <body>
    <h1>Let's plot random numbers</h1>
    <div id="plot"></div>
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

In addition to packages you can declare local Python modules that will
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

In the HTML tag `<py-env>` paths to local modules are provided in the
`paths:` key.

```html
<html>
    <head>
      <link rel="stylesheet" href="https://pyscript.net/alpha/pyscript.css" />
      <script defer src="https://pyscript.net/alpha/pyscript.js"></script>
      <py-env>
        - numpy
        - matplotlib
        - paths:
          - /data.py
      </py-env>
    </head>

  <body>
    <h1>Let's plot random numbers</h1>
    <div id="plot"></div>
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

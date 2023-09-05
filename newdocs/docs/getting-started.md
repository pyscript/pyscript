# Getting started with PyScript

To start developing a PyScript, like with most applications development, you need a **development environment** where you
write your code, a way to install the programming libraries and dependencies your code needs, and way to build and distribute
your application.

Luckily, PyScript makes many of these steps much easier.

## Requirements

To visualize a PyScript application, users only need a modern web browser.

To distribute a PyScript application, the only requirement is for the application to be hosted somewhere a browser can reach.

To create a PyScript application, users need a Development Environment, often also called [IDE](https://en.wikipedia.org/wiki/Integrated_development_environment)
where they can write their code.


**Note:** The easiest way to get the a full PyScript development environment and application hosting setup in seconds,
is to use [pyscript.com](pyscript.com) on your browser. It is a free service that helps users create new projects from
pre-created templates already structured using best practices allowing user to edit, preview and deploy their apps with
just a link, all in the same place.


### Development Environment

Like most software platforms, PyScript requires a development environment where the user can write their applications. This
means an editor where to edit files, installing all dependencies needed by the application and setting everything up so
that the application can be build and distributed. PyScript simplify these aspects for the user, reducing these needs to
an editor, a browser and ways to serve your application files.


PyScript does not require any specific development environment other than a web browser (we recommend using
[Chrome](https://www.google.com/chrome/)) and a text editor ([IDE](https://en.wikipedia.org/wiki/Integrated_development_environment))
that authors can use to write their applications. Users are free to choose according to their preference. We recommend
picking youR favorite browser and IDE, or using pyscript.com (that includes an editor in the browser itself).

**Note:** If you're using [VSCode](https://code.visualstudio.com/), the
[Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
can be used to reload the page as you edit the HTML file.

## Installation

There is no PyScript specific installation required in your system to start using PyScript in your browser. All you need to do is to
simply add a reference in your application code to where your application should get PyScript from.

If you are not an experienced developer and it all sounds very complicated, don't worry, we'll get you through it in the following steps.

## Basic Concepts

While we'll cover PyScript concepts and APIs more thoroughly in the PyScript Concepts and PyScript User Guide sections, it's important
to understand the basics.

PyScript is a Software Platform that enables users to write Python Applications that run in the Browser, with a simple and user
friendly interface. For this reason, it aims to have a small and intuitive interface that triest to enable users while staying out of
the way. In fact, there are 3 main parts of a PyScript application:

1. The application skeleton and interface. Usually this is managed in a `html` file and is also where we specify that `PyScript`` needs
to be loaded into the application.
2. The application configuration (for instance, dependencies, assets to be downloaded, etc...). PyScript supports configuration files written
in TOML or JSON formats
3. The application code/logic. These are typically Python files that host the application code. PyScript allows users to run these
through special `html` tags (such as `<script type="py">` or `<py-script>`) properly placed in their `html` file.

The `html` file acts as the entry point and center of gravity of an application.


## Writing your first PyScript application

As we hinted earlier, writing a PyScript application means writing a web application that
can run code writted in Python (and other languages) on the web. This means that creating
PyScript applications starts in a very similar way to web applications: from an `html` file.

Let's start from the most basic and popular "first application example" possible, a
"Hello, world!" application! In this case we will:

1. Write an `html` file that is the main entry point for our application.
2. Load `pyscript` in our application by using: `<script type="module" src="https://esm.sh/@pyscript/core@latest/core.js"></script>`
3. Skip a configuration file for our projects and use the default since we won't need to install any additional dependencies.
4. Add a `<py-script>` tag to use as entrypoint for our Python code, that will be executed when the page loads.

**NOTE:** We highly recommend users to reproduce and interact with the examples below on their own on pyscript.com or
with their favorite Development Environment setup.

First, create a new file called `hello.html` and paste in the following content and open it in your web browser.

**Hint:** In the example below, click on the ➕ icon to read hints about specific sections in the code examples

```html title="hello_world.py"
<!DOCTYPE html>
<html>
  <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />

      <title>My First PyScript APP: Hello World!</title>
      <script
          type="module"
          src="https://esm.sh/@pyscript/core@latest/core.js"
      ></script> <!-- (1) Load PyScript -->
  </head>
  <body>
    <!-- (2) In this case were using the default config, so don't need to specify a `<py-config>` tag -->

    <!-- (3) run the code in the `main.py` file -->
    <py-script src="main.py"></py-script>
  </body>
</html>
```

1.  ⚡️ we use a `<script>` tag to load `PyScript` in the `head` of our `HTML` document so it can
    load as soon as possible
2.  if needed to install any packages we could load a config in this point, so that any python code
    can have their dependencies installed before they run
3.  🐍 the code in `main.py` will run inside the default `Python` interpreter as soon as it's ready

and create a new `main.py` file with the following code:

```python title="main.py"
from pyscript import display # (1)
print('Hello, World!') # print "Hello, World!" to the console
display('Hello, World!') # displays "Hello, World!" in the main page
```

1.  pyscript provides the `display` funcition that can be used to display any variable on the page,
    while the Python `print` statement will automatically print objects on the browser `console`.

<a href="https://fpliger.pyscriptapps.com/hello-world-minimal-example/latest/" class="md-button" target="_blank">open this example on pyscript.com</a>

When you open application in your browser, you should see `Hello, World!` printed in your page and in your Javascript Console
(if you are new to web development and don't know what it means yet, don't worry,t, we'll get into that later).

Easy, right?


```html title="hello_world.py"
<!DOCTYPE html>
<html>
  <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />

      <title>My First PyScript APP: Hello World!</title>
      <script
          type="module"
          src="https://esm.sh/@pyscript/core@latest/core.js"
      ></script> <!-- (1)-->
  </head>
  <body>
    <py-script>  <!-- (2)-->
        # this block is normal python
        from pyscript import display
        print('Hello, World!') # some more
        display('Hello, World!')
    </py-script>
  </body>
</html>
```

## Serving your application

Now what we have written our first application, it's important talk about how we can access it.

In the example above, we were able to visualize it by simply opening the local file from our
system directly with the browser. While that's a very simple and fast way to open our application,
it is not very recommended because browsers will forbid many features when accessing files this way,
for security reasons. When this is the case, you may see your Python code in the text of the webpage,
and the [browser developer console](https://balsamiq.com/support/faqs/browserconsole/) may show an
error like *"Cross origin requests are only supported for HTTP."*

In short, when browsers visualize a web page, they expect them to be served by a
web server.

For the rest of this documentation, we'll be presenting examples and snippets and host them on
pyscript.com. Users can reference the [serving your application](serving-your-application.md) at
anytime for other options.

## A more complex example

Now that we know how you can create a simple 'Hello, World!' example, let's see a more complex example.
This example will use the Demo created by [Cheuk Ting Ho](https://github.com/Cheukting). In this example, we will use more features from PyScript.

### Setting up the base index file

Let's create a new file called `index.html` and add the following content:

```html
<html>
  <head>
    <title>Ice Cream Picker</title>
    <meta charset="utf-8">
    <link rel="stylesheet" href="https://pyscript.net/latest/pyscript.css" />
    <script defer src="https://pyscript.net/latest/pyscript.js"></script>
  </head>
  <body>

  </body>
</html>
```

In this first step, we have created the index file, imported `pyscript.css` and `pyscript.js`. We are ready to start adding the elements we need for our application.

### Importing the needed libraries

For this example, we will need to install `pandas` and `matplotlib`. We can install libraries using the `<py-config>` tag so we can import them later. Please refer to the [`<py-config>`](../reference/elements/py-config.md) documentation for more information.

```html
<html>
  <head>
    <title>Ice Cream Picker</title>
    <meta charset="utf-8">
    <link rel="stylesheet" href="https://pyscript.net/latest/pyscript.css" />
    <script defer src="https://pyscript.net/latest/pyscript.js"></script>
  </head>
  <body>

    <py-config>
      packages = ["matplotlib", "pandas"]
    </py-config>

  </body>
</html>
```

### Importing the data and exploring

Now that we have installed the needed libraries, we can import and explore the data. In this step, we need to create a `<py-script>` tag to import our dependencies, read the data with pandas and then use `py-repl` to explore the data.

You may want to read the [`<py-script>`](../reference/elements/py-script.md) and [`<py-repl>`](../reference/elements/py-repl.md) documentation for more information about these elements.


```html
<html>
  <head>
    <title>Ice Cream Picker</title>
    <meta charset="utf-8">
    <link rel="stylesheet" href="https://pyscript.net/latest/pyscript.css" />
    <script defer src="https://pyscript.net/latest/pyscript.js"></script>
  </head>
  <body>

    <py-config>
      packages = ["matplotlib", "pandas"]
    </py-config>

    <py-script>
      import pandas as pd

      from pyodide.http import open_url

      url = (
          "https://raw.githubusercontent.com/Cheukting/pyscript-ice-cream/main/bj-products.csv"
      )
      ice_data = pd.read_csv(open_url(url))
    </py-script>

    <py-repl>
      ice_data
    </py-repl>
  </body>
</html>
```

Note that we are adding `ice_data` to `py-repl` to pre-populate the REPL with this variable, so you don't have to type it yourself.

### Creating the plot

Now that we have the data, we can create the plot. We will use the `matplotlib` library to make the plot. We will use the `display` API to display the plot on the page. You may want to read the [`display`](../reference/API/display.md) documentation for more information.

```html
<html>
  <head>
    <title>Ice Cream Picker</title>
    <meta charset="utf-8">
    <link rel="stylesheet" href="https://pyscript.net/latest/pyscript.css" />
    <script defer src="https://pyscript.net/latest/pyscript.js"></script>
  </head>
  <body>

    <py-config>
      packages = ["matplotlib", "pandas"]
    </py-config>

    <py-script>
      import pandas as pd
      import matplotlib.pyplot as plt

      from pyodide.http import open_url

      url = (
          "https://raw.githubusercontent.com/Cheukting/pyscript-ice-cream/main/bj-products.csv"
      )
      ice_data = pd.read_csv(open_url(url))

      def plot(data):
        plt.rcParams["figure.figsize"] = (22,20)
        fig, ax = plt.subplots()
        bars = ax.barh(data["name"], data["rating"], height=0.7)
        ax.bar_label(bars)
        plt.title("Rating of ice cream flavours of your choice")
        display(fig, target="graph-area", append=False)

      plot(ice_data)
    </py-script>

    <py-repl>
      ice_data
    </py-repl>

    <div id="graph-area"></div>
  </body>
</html>
```

### Select specific flavours

Now that we have a way to explore the data using `py-repl` and a way to create the plot using all of the data, it's time for us to add a way to select specific flavours.

```html
<html>
  <head>
    <title>Ice Cream Picker</title>
    <meta charset="utf-8">
    <link rel="stylesheet" href="https://pyscript.net/latest/pyscript.css" />
    <script defer src="https://pyscript.net/latest/pyscript.js"></script>
  </head>
  <body>

    <py-config>
      packages = ["matplotlib", "pandas"]
    </py-config>

    <py-script>
      import js
      import pandas as pd
      import matplotlib.pyplot as plt

      from pyodide.http import open_url
      from pyodide.ffi import create_proxy

      url = (
          "https://raw.githubusercontent.com/Cheukting/pyscript-ice-cream/main/bj-products.csv"
      )
      ice_data = pd.read_csv(open_url(url))

      current_selected = []
      flavour_elements = js.document.getElementsByName("flavour")

      def plot(data):
          plt.rcParams["figure.figsize"] = (22,20)
          fig, ax = plt.subplots()
          bars = ax.barh(data["name"], data["rating"], height=0.7)
          ax.bar_label(bars)
          plt.title("Rating of ice cream flavours of your choice")
          display(fig, target="graph-area", append=False)

      def select_flavour(event):
          for ele in flavour_elements:
              if ele.checked:
                  current_selected = ele.value
                  break
          if current_selected == "ALL":
              plot(ice_data)
          else:
              filter = ice_data.apply(lambda x: ele.value in x["ingredients"], axis=1)
              plot(ice_data[filter])

      ele_proxy = create_proxy(select_flavour)

      for ele in flavour_elements:
          if ele.value == "ALL":
            ele.checked = True
            current_selected = ele.value
          ele.addEventListener("change", ele_proxy)

      plot(ice_data)

    </py-script>

    <div id="input" style="margin: 20px;">
      Select your 🍨 flavour: <br/>
      <input type="radio" id="all" name="flavour" value="ALL">
      <label for="all"> All 🍧</label>
      <input type="radio" id="chocolate" name="flavour" value="COCOA">
      <label for="chocolate"> Chocolate 🍫</label>
      <input type="radio" id="cherry" name="flavour" value="CHERRIES">
      <label for="cherry"> Cherries 🍒</label>
      <input type="radio" id="berries" name="flavour" value="BERRY">
      <label for="berries"> Berries 🍓</label>
      <input type="radio" id="cheese" name="flavour" value="CHEESE">
      <label for="cheese"> Cheese 🧀</label>
      <input type="radio" id="peanut" name="flavour" value="PEANUT">
      <label for="peanut"> Peanut 🥜</label>
    </div>

    <py-repl>
      ice_data
    </py-repl>

    <div id="graph-area"></div>
  </body>
</html>
```

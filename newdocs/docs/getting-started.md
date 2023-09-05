<base target="_blank">
# Getting started with PyScript

To start developing a PyScript, like with most applications development, you need a **development environment** where you
write your code, a way to install the programming libraries and dependencies your code needs, and way to build and distribute
your application.

Luckily, PyScript makes many of these steps much easier.

## Development setup

Almost all software platform like PyScript require a development environment the user needs to author their applications. That
usually means picking an editor of choice, installing all dependencies needed by the application and setting everything up so
that the application can be build and distributed. PyScript simplify these aspects for the user, reducing these to a bare minimum.

**tldr;** The easiest way to get the a full PyScript development setup on your browser, in seconds, is to use [pyscript.com](pyscript.com).
It is a free service that help users to create new projects from pre-created templates that already have all the project structure
created, allowing user to edit, preview and deploy their apps with just a link, all in the same place.


## Editors and Development Environment

PyScript does not require any specific development environment other than a web browser (we recommend using
[Chrome](https://www.google.com/chrome/)) and a text editor ([IDE](https://en.wikipedia.org/wiki/Integrated_development_environment))
that authors can use to write their applications. Users are free to choose according to their preference and, as mentioned above,
we recommend picking you faverite browser and IDE, or using pyscript.com (that includes an editor in the browser itself).

**Note:** If you're using [VSCode](https://code.visualstudio.com/), the
[Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
can be used to reload the page as you edit the HTML file.


## Installation

There is no PyScript specific installation required in your system to start using PyScript in your browser. All you need to do is to
simply add a reference in your application code to where your application should get PyScript from.

If you are not an experienced developer and it all sounds very complicated, don't worry, we'll get you through it in the following steps.

## Writing your first PyScript application

As we hinted earlier, writing a PyScript application means writing a web application that can run code writted in Python (and other languages)
on the web. This means that the way we create PyScript applications starts in a very similar way to how we write web applications: from an
HTML file.

To demonstrate the above, let's start from the most popular "first application example": let's write a "Hello, world!"
example using PyScript.

Using your favorite editor, create a new file called `hello.html` and paste in the following content and open it in your web browser. (You can typically
open an HTML by double-clicking it in your file explorer.):

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
      ></script>
  </head>
  <body> <!-- (1)-->
    <py-script>
        # this block is normal python
        from pyscript import display
        print('Hello, World!') # some more
        display('Hello, World!')
    </py-script>
  </body>
</html>
```

1.  :man_raising_hand: I'm a code annotation! I can contain `code`, __formatted
    text__, images, ... basically anything that can be written in Markdown.

[open this example on pyscript.com](https://fpliger.pyscriptapps.com/hello-world-minimal-example/latest/){ .md-button }
<a href="https://fpliger.pyscriptapps.com/hello-world-minimal-example/latest/" target="_blank">or open this example on pyscript.com</a>

You should see "Hello World!" printed in your page and in your Javascript Console (don't worry if
you don't know what it means yet, we'll get into that later).

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

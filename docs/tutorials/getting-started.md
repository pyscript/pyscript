# Getting started with PyScript

This page will guide you through getting started with PyScript.

## Development setup

PyScript does not require any development environment other
than a web browser (we recommend using [Chrome](https://www.google.com/chrome/)) and a text editor, even though using your [IDE](https://en.wikipedia.org/wiki/Integrated_development_environment) of choice might be convenient.

If you're using [VSCode](https://code.visualstudio.com/), the
[Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
can be used to reload the page as you edit the HTML file.

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
  <body>
    <py-script>
        print('Hello, World!')
    </py-script>
  </body>
</html>
```

### Using a Local Server

In some situations, your browser may forbid loading remote resources like `pyscript.js` and `pyscript.css` when you open an HTML file directly. When this is the case, you may see your Python code in the text of the webpage, and the [browser developer console](https://balsamiq.com/support/faqs/browserconsole/) may show an error like *"Cross origin requests are only supported for HTTP."* The fix for this is to use a [simple local server](https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Tools_and_setup/set_up_a_local_testing_server) to make your html file available to the browser.

If you have python installed on your system, you can use its basic built-in server for this purpose via the command line. Change the current working directory of your terminal or command line to the folder where your HTML file is stored. From this folder, run `python -m http.server 8080 --bind 127.0.0.1` in your terminal or command line. With the server program running, point your browser to `http://localhost:8080` to view the contents of that folder. (If a file in that folder is called `index.html`, it will be displayed by default.)

## A more complex example

Now that we know how you can create a simple 'Hello, World!' example, let's see a more complex example. This example will use the Demo created by [Cheuk Ting Ho](https://github.com/Cheukting). In this example, we will use more features from PyScript.

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

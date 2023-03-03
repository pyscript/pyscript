# Creating custom pyscript plugins

Pyscript has a few built-in plugins, but you can also create your own ones. This guide will show you how to develop both Javascript and Python plugins.

```{warning}
Pyscript plugins are currently under active development. The API is likely to go through breaking changes between releases.
```

You can add your custom plugins to the `<py-config>` tag on your page. For example:

```html
<py-config>plugins = ["http://example.com/hello-world.py"]</py-config>
```

Currently, only single files with the extension `.py` and `.js` files can be used as plugins.

## Python plugins

Python plugins allow you to write plugins in pure Python. We first need to import `Plugin` from `pyscript` and create a new instance of it.

```python
from pyscript import Plugin

plugin = Plugin("PyHelloWorld")
```

We can now create a new class containing our plugin code to add the text "Hello World" to the page.

```python
from pyscript import Plugin, js

plugin = Plugin("PyHelloWorld")

class PyHelloWorld:
    def __init__(self, element):
        self.element = element


    def connect(self):
        self.element.innerHTML = "<h1>Hello World!</h1>"
```

Let's now create our `index.html` page and add the plugin.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />

    <title>Python Plugin</title>

    <link rel="stylesheet" href="https://pyscript.net/unstable/pyscript.css" />
    <script defer src="https://pyscript.net/unstable/pyscript.js"></script>
  </head>

  <body>
    <py-config>plugins = ["./hello-world.py"]</py-config>
  </body>
</html>
```

Now we need to start a live server to serve our page. You can use Python's `http.server` module for this.

```bash
python -m http.server
```

Now you can open your browser and go to `http://localhost:8000` to see the page. You might be surprised that the text "Hello World" is not on the page. This is because we need to do a few more things to make our plugin work.

First, we must create a custom element that our plugin will use. We can use a decorator in our `PyHelloWorld` class.

```python
from pyscript import Plugin, js

plugin = Plugin("PyHelloWorld")

@plugin.register_custom_element("py-hello-world")
class PyHelloWorld:
    def __init__(self, element):
        self.element = element

    def connect(self):
        self.element.innerHTML = "<div id='hello'>Hello World!</div>"
```

Now that we have registered our custom element, we can use the custom tag `<py-hello-world>` to add our plugin to the page.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />

    <title>Python Plugin</title>

    <link rel="stylesheet" href="https://pyscript.net/unstable/pyscript.css" />
    <script defer src="https://pyscript.net/unstable/pyscript.js"></script>
  </head>

  <body>
    <py-config>plugins = ["./hello-world.py"]</py-config>

    <py-hello-world></py-hello-world>
  </body>
</html>
```

Now, if you go to `http://localhost:8000` you should see the text "Hello World" on the page.

Writing plugins in Python is an excellent way if you want to use PyScript's API's. However, if you want to write plugins in Javascript, you can do that too.

## Javascript plugins

Javascript plugins need to have a specific structure to be loaded by PyScript. The plugin export a default class with the following method, which may implement any, all, or none of the [Plugin lifecycle methods](https://github.com/pyscript/pyscript/blob/main/pyscriptjs/src/plugin.ts#L9-L65). These method will be called at the corresponding points in lifecycle of PyScript as it loads, configures itself and its Python interpreter, and executes `<py-script>` and `<py-repl>` tags.

```{note}
You need to specify the file extension `.js` when adding your custom plugin to the `<py-config>` tag.
```

### Creating a Hello World plugin

Let's create a simple plugin that will add the text "Hello World" to the page. We will create a `hello-world.js` file and write the plugin class.

```js
export default class HelloWorldPlugin {
  afterStartup(runtime) {
    // Code goes here
  }
}
```

Now we need to add the code that will add the text to the page.

```js
export default class HelloWorldPlugin {
  afterStartup(runtime) {
    const elem = document.createElement("h1");
    elem.innerText = "Hello World";
    document.body.appendChild(elem);
  }
}
```

Finally, we need to add the plugin to our page's `<py-config>` tag.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />

    <title>Javascript Plugin</title>

    <link rel="stylesheet" href="https://pyscript.net/unstable/pyscript.css" />
    <script defer src="https://pyscript.net/unstable/pyscript.js"></script>
  </head>

  <body>
    <py-config>plugins = ["./hello-world.js"]</py-config>
  </body>
</html>
```

Now we need to start a live server to serve our page. You can use Python's `http.server` module for this.

```bash
python -m http.server
```

Now you can open your browser and go to `http://localhost:8000` to see the page. You should see the text "Hello World" on the page.

```{note}
Because we are using a local file, you must start a live server. Otherwise, Pyscript will not be able to fetch the file.
```

### Expanding the Hello World plugin

As you can see, we could build all our plugin logic inside the `afterStartup` method. You may also want to create a custom html element for your plugin. Let's see how we can do that.

First, we need to create a custom html element. Let's start by creating our `PyHelloWorld` class that extends the `HTMLElement` class.

```js
class PyHelloWorld extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.innerHTML = `<h1>Hello, world!</h1>`;
    this.mount_name = this.id;
  }
}
```

We can now register our custom element in the `afterStartup` method of our `HelloWorldPlugin` class. We will also add the custom tag `py-hello-world` to the page.

```js
export default class HelloWorldPlugin {
  afterStartup(runtime) {
    // Create a custom element called <py-hello-world>
    customElements.define("py-hello-world", PyHelloWorld);

    // Add the custom element to the page so we can see it
    const elem = document.createElement("py-hello-world");
    document.body.append(elem);
  }
}
```

Now we can open our page and see the custom element on the page.

By now, you should have a good idea for creating a custom plugin. Also, how powerful it can be to create custom elements that other users could use in their PyScript pages.

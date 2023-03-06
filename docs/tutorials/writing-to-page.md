# How to write content to the page

When creating your PyScript application, you will want to write content to the page. This tutorial will explore the different methods you can use to write content to the page and their differences.

## Development setup

To get started, we will create an `index.html` file, import PyScript and start building on top of it.

```html
<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />

        <title>Writing to the page</title>

        <link
            rel="stylesheet"
            href="https://pyscript.net/latest/pyscript.css"
        />
        <script defer src="https://pyscript.net/latest/pyscript.js"></script>
    </head>

    <body></body>
</html>
```

## Writing content to an element

Let's first see how we can write content to an element on the page. We will start by creating a `div` element with an `id` of `manual-write`, then create a `py-script` tag that, upon a click of a button, will write 'Hello World' to the `div` element.

```html
<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />

        <title>Writing to the page</title>

        <link
            rel="stylesheet"
            href="https://pyscript.net/latest/pyscript.css"
        />
        <script defer src="https://pyscript.net/latest/pyscript.js"></script>
    </head>

    <body>
        <div id="manual-write"></div>
        <button py-click="write_to_page()" id="manual">Say Hello</button>

        <py-script>
            def write_to_page():
              manual_div = Element("manual-write")
              manual_div.element.innerText = "Hello World"
        </py-script>
    </body>
</html>
```

```{note}
When using `py-click` you must supply an `id` to the element you want to use as the trigger.
```

We can now open our `index.html` file and click the button. You will see that "Hello World" will appear in the `div` element. You could also write HTML using `manual_div.element.innerHTML` instead of `innerText`. For example:

```html
<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />

        <title>Writing to the page</title>

        <link
            rel="stylesheet"
            href="https://pyscript.net/latest/pyscript.css"
        />
        <script defer src="https://pyscript.net/latest/pyscript.js"></script>
    </head>

    <body>
        <div id="manual-write"></div>
        <button py-click="write_to_page()" id="manual">Say Hello</button>

        <py-script>
            def write_to_page():
              manual_div = Element("manual-write")
              manual_div.element.innerHTML = "
            <p><b>Hello World</b></p>
            "
        </py-script>
    </body>
</html>
```

## Writing content with the `display` API

The `display` API is a simple way to write content to the page. Not only does it allow you to write content to the page, but it also allows you to display a range of different content types such as images, markdown, svgs, json, etc.

Using the' display' API, let's reuse our previous example and write "Hello World" to the page.

```html
<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />

        <title>Writing to the page</title>

        <link
            rel="stylesheet"
            href="https://pyscript.net/latest/pyscript.css"
        />
        <script defer src="https://pyscript.net/latest/pyscript.js"></script>
    </head>

    <body>
        <div id="manual-write"></div>
        <button py-click="write_to_page()" id="manual">Say Hello</button>
        <div id="display-write"></div>
        <button py-click="display_to_div()" id="display">Say Things!</button>

        <py-script>
            def write_to_page():
              manual_div = Element("manual-write")
              manual_div.element.innerHTML = "
            <p><b>Hello World</b></p>
            "

                def display_to_div():
                  display("I display things!", target="display-write")
        </py-script>
    </body>
</html>
```

```{note}
When using the `display` API, you must specify the `target` parameter to tell PyScript where to write the content. If you do not use this parameter, an error will be thrown.
```

You may be interested in reading more about the `display` API in the [Display API](../reference/api/display) section of the documentation.

## Printing to the page

We couldn't have a tutorial on writing to the page without mentioning the `print` function. The `print` function is a simple way to write content to the page, that any Python developer will be familiar with. When you use the `print` function, the content will be written to the page in a `py-terminal` element.

```html
<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />

        <title>Writing to the page</title>

        <link
            rel="stylesheet"
            href="https://pyscript.net/latest/pyscript.css"
        />
        <script defer src="https://pyscript.net/latest/pyscript.js"></script>
    </head>

    <body>
        <div id="manual-write"></div>
        <button py-click="write_to_page()" id="manual">Say Hello</button>
        <div id="display-write"></div>
        <button py-click="display_to_div()" id="display">Say Things!</button>
        <button py-click="print_to_page()" id="print">Print Things!</button>

        <py-script>
            def write_to_page():
              manual_div = Element("manual-write")
              manual_div.element.innerHTML = "
            <p><b>Hello World</b></p>
            "

                def display_to_div():
                  display("I display things!", target="display-write")

                def print_to_page():
                  print("I print things!")
        </py-script>
    </body>
</html>
```

You may be surprised to see that when you click the "Print Things!" button, the content is written below the rest of the elements on the page in a black canvas. This is because the `print` function writes content to the page in a `py-terminal` element. You can read more about the `py-terminal` element in the [Terminal Element](../reference/plugins/py-terminal) section of the documentation.

PyScript comes with the `py-terminal` plugin by default and any `stdout` or `stderr` content will be shown in this element. We can be explicit about where we want the terminal to be shown by adding the `<py-terminal>` tag to our HTML.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />

  <title>Writing to the page</title>

  <link rel="stylesheet" href="https://pyscript.net/latest/pyscript.css" />
  <script defer src="https://pyscript.net/latest/pyscript.js"></script>
  </head>

  <body>
    <div id="manual-write"></div>
    <button py-click="write_to_page()" id="manual">Say Hello</button>
    <div id="display-write"></div>
    <button py-click="display_to_div()" id="display">Say Things!</button>
    <div>
      <py-terminal>
    </div>
    <button py-click="print_to_page()" id="print">Print Things!</button>

    <py-script>
    def write_to_page():
      manual_div = Element("manual-write")
      manual_div.element.innerHTML = "<p><b>Hello World</b></p>"

    def display_to_div():
      display("I display things!", target="display-write")

    def print_to_page():
      print("I print things!")
    </py-script>
  </body>
</html>
```

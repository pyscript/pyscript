# Handling click events

This tutorial will show you how to use the `py-click` attribute to handle mouse clicks on elements on your page. The `py-click` attribute is a special attribute that allows you to specify a Python function that will be called when the element is clicked.

## Development setup

Let's start by building the base HTML page. We will create an HTML page with a button and a paragraph. When the button is clicked, the paragraph will show the current time.

```html
<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />

        <title>Current Time</title>

        <link
            rel="stylesheet"
            href="https://pyscript.net/latest/pyscript.css"
        />
        <script defer src="https://pyscript.net/latest/pyscript.js"></script>
    </head>
    <body></body>
</html>
```

## Adding elements to the page

Let's add a button and a paragraph to the page. The button will have the `py-click` attribute, and the paragraph will have the `id` attribute. The `id` attribute is used to identify the element on the page, and the `py-click` attribute will be used to specify the function that will be called when the button is clicked.

```html
<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />

        <title>Current Time</title>

        <link
            rel="stylesheet"
            href="https://pyscript.net/latest/pyscript.css"
        />
        <script defer src="https://pyscript.net/latest/pyscript.js"></script>
    </head>

    <body>
        <button py-click="current_time()" id="get-time" class="py-button">
            Get current time
        </button>
        <p id="current-time"></p>
    </body>
</html>
```

There are two things to note here:

-   You must specify an id for an element that uses any `py-*` attribute
-   We used the `py-button` class to style the button, this is optional, and these rules are coming from the pyscript.css that we added in the `<head>` section.

## Creating the Python function

In this step, we will create the Python function that will be called when the button is clicked. This function will get the current time and update the paragraph with the current time. We will use a `<py-script>` tag to specify the Python code that will be executed when the page is loaded.

```html
<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />

        <title>Current Time</title>

        <link
            rel="stylesheet"
            href="https://pyscript.net/latest/pyscript.css"
        />
        <script defer src="https://pyscript.net/latest/pyscript.js"></script>
    </head>

    <body>
        <button py-click="current_time()" id="get-time" class="py-button">
            Get current time
        </button>
        <p id="current-time"></p>

        <py-script>
            import datetime def current_time(): now = datetime.datetime.now()
        </py-script>
    </body>
</html>
```

## Writing the time to the page

If you run the example, you will notice that nothing happened. This is because we still need to update the paragraph with the current time. We can do this by using the [`Element` API](../reference/API/element.md) to get the paragraph element and then update it with the current time with the `write` method.

```html
<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />

        <title>Current Time</title>

        <link
            rel="stylesheet"
            href="https://pyscript.net/latest/pyscript.css"
        />
        <script defer src="https://pyscript.net/latest/pyscript.js"></script>
    </head>

    <body>
        <button py-click="current_time()" id="get-time" class="py-button">
            Get current time
        </button>
        <p id="current-time"></p>

        <py-script>
            from pyscript import Element import datetime def current_time(): now
            = datetime.datetime.now() # Get paragraph element by id paragraph =
            Element("current-time") # Add current time to the paragraph element
            paragraph.write(now.strftime("%Y-%m-%d %H:%M:%S"))
        </py-script>
    </body>
</html>
```

Now, if you refresh the page and click the button, the paragraph will be updated with the current time.

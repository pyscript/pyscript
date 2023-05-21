# Calling an API using Requests

This tutorial will show you how to interact with an API using the [Requests](https://requests.readthedocs.io/en/master/) library. Requests is a popular library, but it doesn't work out of the box with Pyscript. We will use the [pyodide-http](https://github.com/koenvo/pyodide-http) library to patch the Requests library, so it works with Pyscript.

 We will use the [JSON Placeholder API](https://jsonplaceholder.typicode.com/), a free fake API that returns fake data.

## Development Setup

Let's build the base HTML page to add our `py-config` and `py-script` tags in the next steps.

```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />

        <title>Requests Tutorial</title>

        <link rel="stylesheet" href="https://pyscript.net/latest/pyscript.css" />
        <script defer src="https://pyscript.net/latest/pyscript.js"></script>
    </head>
    <body>
    </body>
</html>
```

## Installing the dependencies

In this step, we will install the dependencies we need to use the Requests library. We will use the `py-config` tag to specify the dependencies we need to install.

```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />

        <title>Requests Tutorial</title>

        <link rel="stylesheet" href="https://pyscript.net/latest/pyscript.css" />
        <script defer src="https://pyscript.net/latest/pyscript.js"></script>
    </head>
    <body>
      <py-config>
        packages = ["requests", "pyodide-http"]
      </py-config>
    </body>
</html>
```

## Patching the Requests library

Now that we have installed the dependencies, we need to patch the Requests library to work with Pyscript. We will use the `py-script` tag to specify the code that will be executed when the page is loaded.

```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />

        <title>Requests Tutorial</title>

        <link rel="stylesheet" href="https://pyscript.net/latest/pyscript.css" />
        <script defer src="https://pyscript.net/latest/pyscript.js"></script>
    </head>
    <body>
      <py-config>
        packages = ["requests", "pyodide-http"]
      </py-config>

      <py-script>
        import pyodide_http
        pyodide_http.patch_all()
      </py-script>
    </body>
</html>
```

## Making a request

Finally, let's make a request to the JSON Placeholder API to confirm that everything is working.

```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />

        <title>Requests Tutorial</title>

        <link rel="stylesheet" href="https://pyscript.net/latest/pyscript.css" />
        <script defer src="https://pyscript.net/latest/pyscript.js"></script>
    </head>
    <body>
      <py-config>
        packages = ["requests", "pyodide-http"]
      </py-config>

      <py-script>
        import requests
        import pyodide_http

        # Patch the Requests library so it works with Pyscript
        pyodide_http.patch_all()

        # Make a request to the JSON Placeholder API
        response = requests.get("https://jsonplaceholder.typicode.com/todos")
        print(response.json())
      </py-script>
    </body>
</html>
```

## Conclusion

In this tutorial, we learned how to use the Requests library to make requests to an API. We also learned how to use the `py-config` and `py-script` tags to install dependencies and execute code when the page is loaded.

Depending on the API you use, you may need to add additional headers to your request. You can read the [Requests documentation](https://requests.readthedocs.io/en/master/user/quickstart/#custom-headers) to learn more about how to do this.

You may also be interested in creating your module to make requests. You can read the in-depth guide on [How to make HTTP requests using `PyScript`, in pure Python](../guides/http-requests.md) to learn more about how to do this.

# How to make HTTP requests using `PyScript`, in pure Python

[Pyodide](https://pyodide.org), the runtime that underlies `PyScript`, does not have the `requests` module
(or other similar modules) available by default, which are traditionally used to make HTTP requests in Python.
However, it is possible to make HTTP requests in Pyodide using the modern `JavaScript` `fetch` API
([docs](https://developer.mozilla.org/en-US/docs/Web/API/fetch)). This example shows how to make common HTTP request
(GET, POST, PUT, DELETE) to an API, using only Python code! We will use asynchronous functions with
async/await syntax, as concurrent code is preferred for HTTP requests.

The purpose of this guide is not to teach the basics of HTTP requests, but to show how to make them
from `PyScript` using Python, since currently, the common tools such as `requests` and `httpx` are not available.

## Fetch

The `fetch` API is a modern way to make HTTP requests. It is available in all modern browsers, and in Pyodide.

Although there are two ways to use `fetch`, 1) using `JavaScript` from `PyScript`, and 2) using Pyodide's Python wrapper,
`Pyodide.http.pyfetch`, this example will only show how to use the Python wrapper. Still, the
[fetch documentation](https://developer.mozilla.org/en-US/docs/Web/API/fetch#parameters) is a useful reference, as its
parameters can be called from Python using the `pyfetch` wrapper.

## Pyodide.http, pyfetch, and FetchResponse

[Pyodide.http module](https://pyodide.org/en/stable/usage/api/python-api/http.html#module-pyodide.http) is a Python API
for dealing with HTTP requests. It provides the `pyfetch` function as a wrapper for the `fetch` API,
which returns a `FetchResponse` object whenever a request is made. Extra keyword arguments can be passed to `pyfetch`
which will be passed to the `fetch` API.

The returned object `FetchResponse` has familiar methods and properties
for dealing with the response, such as `json()` or `status`. See the
[FetchResponse documentation](https://pyodide.org/en/stable/usage/api/python-api/http.html#pyodide.http.FetchResponse)
for more information.

# Example
We will make async HTTP requests to [JSONPlaceholder](https://jsonplaceholder.typicode.com/)'s fake API using `pyfetch`.
First we write a helper function in pure Python that makes a request and returns the response. This function
makes it easier to make specific types of requests with the most common parameters.

## Python convenience function

```python
from pyodide.http import pyfetch, FetchResponse
from typing import Optional, Any

async def request(url: str, method: str = "GET", body: Optional[str] = None,
                  headers: Optional[dict[str, str]] = None, **fetch_kwargs: Any) -> FetchResponse:
    """
    Async request function. Pass in Method and make sure to await!
    Parameters:
        url: str = URL to make request to
        method: str = {"GET", "POST", "PUT", "DELETE"} from `JavaScript` global fetch())
        body: str = body as json string. Example, body=json.dumps(my_dict)
        headers: dict[str, str] = header as dict, will be converted to string...
            Example, headers=json.dumps({"Content-Type": "application/json"})
        fetch_kwargs: Any = any other keyword arguments to pass to `pyfetch` (will be passed to `fetch`)
    Return:
        response: pyodide.http.FetchResponse = use with .status or await.json(), etc.
    """
    kwargs = {"method": method, "mode": "cors"}  # CORS: https://en.wikipedia.org/wiki/Cross-origin_resource_sharing
    if body and method not in ["GET", "HEAD"]:
        kwargs["body"] = body
    if headers:
        kwargs["headers"] = headers
    kwargs.update(fetch_kwargs)

    response = await pyfetch(url, **kwargs)
    return response
```
This function is a wrapper for `pyfetch`, which is a wrapper for the `fetch` API. It is a coroutine function,
so it must be awaited. It also has type hints, which are not required, but are useful for IDEs and other tools.
The basic idea is that the `PyScript` will import and call this function, then await the response. Therefore,
the script containing this function must be importable by `PyScript`.

For this example, we will name the file containing the Python code `request.py` and place it in the same directory as the file
containing the html code, which is described below.

## `PyScript` HTML code

In this How-to, the HTML code is split into separate code blocks to enable context highlighting (coloring of the Python
code inside the html code block), but in reality it is all in the same file. The first part is a bare bones `PyScript`
html page, using the [community examples](https://github.com/pyscript/pyscript-collective/) set-up. The second part is
the actual Python code for HTTP requests, which is wrapped in `<py-script>` tags, while the third block has the
concluding html code.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />

    <title>GET, POST, PUT, DELETE example</title>

    <link rel="icon" type="image/png" href="favicon.png" />
    <link rel="stylesheet" href="../build/pyscript.css" />

    <script defer src="../build/pyscript.js"></script>
    <py-env>
        - paths:
          - /request.py
    </py-env>
  </head>

  <body><p>
    Hello world request example! <br>
    Here is the output of your request:
    </p>
    <py-script>
```
```python
import asyncio  # important!!
import json
from request import request  # import our request function.

baseurl = "https://jsonplaceholder.typicode.com/"

# GET
headers = {"Content-type": "application/json"}
response = await request(baseurl+"posts/2", method="GET", headers=headers)
print(f"GET request=> status:{response.status}, json:{await response.json()}")

# POST
body = json.dumps({"title": "test_title", "body": "test body", "userId": 1})
new_post = await request(baseurl+"posts", body=body, method="POST", headers=headers)
print(f"POST request=> status:{new_post.status}, json:{await new_post.json()}")

# PUT
body = json.dumps({"id": 1, "title": "test_title", "body": "test body", "userId": 2})
new_post = await request(baseurl+"posts/1", body=body, method="PUT", headers=headers)
print(f"PUT request=> status:{new_post.status}, json:{await new_post.json()}")

# DELETE
new_post = await request(baseurl+"posts/1", method="DELETE", headers=headers)
print(f"DELETE request=> status:{new_post.status}, json:{await new_post.json()}")
```
```html
    </py-script>

    <div>
    <p>
        You can also use other methods. See fetch documentation: <br>
        https://developer.mozilla.org/en-US/docs/Web/API/fetch#parameters
    </p>
    </div>
    <div>
        <p>
        See pyodide documentation for what to do with a FetchResponse object: <br>
        https://pyodide.org/en/stable/usage/api/python-api.html#pyodide.http.FetchResponse
        </p>
    </div>
  </body>
</html>
```

## Explanation
### `py-env` tag for importing our Python code
The very first thing to notice is the `py-env` tag. This tag is used to import Python files into the `PyScript`.
In this case, we are importing the `request.py` file, which contains the `request` function we wrote above.

### `py-script` tag for making async HTTP requests.
Next, the `py-script` tag contains the actual Python code where we import `asyncio` and `json`,
which are required or helpful for the `request` function.
The `# GET`, `# POST`, `# PUT`, `# DELETE` blocks show examples of how to use the `request` function to make basic
HTTP requests. The `await` keyword is required not only for the `request` function, but also for certain methods of the
`FetchResponse` object, such as `json()`, meaning that the code is asynchronous and slower requests will not block the
faster ones.

### HTTP Requests
HTTP requests are a very common way to communicate with a server. They are used for everything from getting data from
a database, to sending emails, to authorization, and more. Due to safety concerns, files loaded from the
local file system are not accessible by `PyScript`. Therefore, the proper way to load data into `PyScript` is also
through HTTP requests.

In our example, we show how to pass in a request `body`, `headers`, and specify the request `method`, in order to make
`GET`, `POST`, `PUT`, and `DELETE` requests, although methods such as `PATCH` are also available. Additional
parameters for the `fetch` API are also available, which can be specified as keyword arguments passed to our helper
function or to `pyfetch`. See the
[fetch documentation](https://developer.mozilla.org/en-US/docs/Web/API/fetch#parameters) for more information.
HTTP requests are defined by standards-setting bodies in [RFC 1945](https://www.rfc-editor.org/info/rfc1945) and
[RFC 9110](https://www.rfc-editor.org/info/rfc9110).

# Conclusion
This tutorial demonstrates how to make HTTP requests using `pyfetch` and the `FetchResponse` objects. Importing Python
code/files into the `PyScript` using the `py-env` tag is also covered.

Although a simple example, the principals here can be used to create complex web applications inside of `PyScript`,
or load data into `PyScript` for use by an application, all served as a static HTML page, which is pretty amazing!


# API Quick Reference
## pyodide.http.pyfetch
### Usage
```python
await pyodide.http.pyfetch(url: str, **kwargs: Any) -> FetchResponse
```
Use `pyfetch` to make HTTP requests in `PyScript`. This is a wrapper around the `fetch` API. Returns a `FetchResponse`.

### [`pyfetch` Docs.](https://pyodide.org/en/stable/usage/api/python-api/http.html#pyodide.http.pyfetch)

## pyodide.http.FetchResponse
### Usage
```python
response: pyodide.http.FetchResponse = await <pyfetch call>
status = response.status
json = await response.json()
```
Class for handling HTTP responses. This is a wrapper around the `JavaScript` fetch `Response`. Contains common (async)
methods and properties for handling HTTP responses, such as `json()`, `url`, `status`, `headers`, etc.

### [`FetchResponse` Docs.](https://pyodide.org/en/stable/usage/api/python-api/http.html#pyodide.http.FetchResponse)

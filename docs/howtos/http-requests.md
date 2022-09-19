# How to make HTTP requests using pyscript, in pure Python

[Pyodide](https://pyodide.org), the runtime that underlies PyScript, does not have the `requests` module
(or other similar modules) available by default, which are traditionally used to make HTTP requests in Python.
However, it is possible to make HTTP requests in Pyodide using the modern javascript `fetch` API
([docs](https://developer.mozilla.org/en-US/docs/Web/API/fetch)). This example shows how to make common HTTP request
(GET, POST, PUT, DELETE) to an API, using only python code! We will use asynchronous functions with
async/await syntax, as concurrent code is preferred for HTTP requests.

The purpose of this guide is not to teach the basics of HTTP requests, but to show how to make them
from `pyscript` using python, since currently, the common tools such as `requests` and `httpx` are not available.

## Fetch

The `fetch` API is a modern way to make HTTP requests. It is available in all modern browsers, and in Pyodide.

Although there are two ways to use `fetch`, 1) using javacript from pyscript, and 2) using Pyodide's python wrapper,
`Pyodide.http.pyfetch`, this example will only show how to use the python wrapper. Still, the
[fetch documentation](https://developer.mozilla.org/en-US/docs/Web/API/fetch#parameters) is a useful reference, as its
parameters can be called from python using the `pyfetch` wrapper.

## Pyodide.http, pyfetch, and FetchResponse

Pyodide has a module, which is a python API for dealing with HTTP requests, called
[pyodide.http](https://pyodide.org/en/stable/usage/api/python-api/http.html#module-pyodide.http). In this module,
the `pyfetch` function is a wrapper for the `fetch` API, and returns a `FetchResponse` object whenever a request is made.
`FetchResponse` has familiar methods and properties for dealing with the response, such as `json()` or `status`. See
Pyodide documentation for all that can be done with a
[FetchResponse object](https://pyodide.org/en/stable/usage/api/python-api.html#pyodide.http.FetchResponse).

# Example
We will make async HTTP requests to [JSONPlaceholder](https://jsonplaceholder.typicode.com/) fake API using `pyfetch`.
First we write a pure python function that makes a request and returns the response.

## Python convenience function

```python
from pyodide.http import pyfetch, FetchResponse
from typing import Optional

async def request(url: str, method: str = "GET", body: Optional[str] = None,
                  headers: Optional[dict[str, str]] = None) -> FetchResponse:
    """
    Async request function. Pass in Method and make sure to await!
    Parameters:
        url: str = URL to make request to
        method: str = {"GET", "POST", "PUT", "DELETE"} from javascript global fetch())
        body: str = body as json string. Example, body=json.dumps(my_dict)
        headers: dict[str, str] = header as dict, will be converted to string...
            Example, headers:json.dumps({"Content-Type": "application/json"})
    Return:
        response: pyodide.http.FetchResponse = use with .status or await.json(), etc.
    """
    kwargs = {"method": method, "mode": "cors"}  # CORS: https://en.wikipedia.org/wiki/Cross-origin_resource_sharing
    if body and method not in ["GET", "HEAD"]:
        kwargs["body"] = body
    if headers:
        kwargs["headers"] = headers


    response = await pyfetch(url, **kwargs)
    return response
```
This function is a wrapper for `pyfetch`, which is a wrapper for the `fetch` API. It is a coroutine function,
so it must be awaited. It also has type hints, which are not required, but are useful for IDEs and other tools.
The basic idea is that the pyscript will import and call this function, then await the response. Therefore,
the script containing this function must be importable by pyscript.

For this example, we will name this file `request.py` and place it in the same directory as the file
containing the html code below.

## Pyscript HTML code

In this how-to, the HTML code is split into separate code blocks to enable context highlighting (coloring of the python
code inside the html code block), but in reality it is all in the same file. The first part is a bare bones `pyscript`
html page, using the [community examples](https://github.com/pyscript/pyscript-collective/) set-up. The second part is
the actual python code for HTTP requests, which is wrapped in `<py-script>` tags, while the third block has the
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
body = json.dumps({"title":"test_title", "body":"test body", "userId":1})
new_post = await request(baseurl+"posts", body=body, method="POST", headers=headers)
print(f"POST request=> status:{new_post.status}, json:{await new_post.json()}")

# PUT
body = json.dumps({"id":1, "title":"test_title", "body":"test body", "userId":2})
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
### `py-env` tag for importing our python code
The very first thing to notice is the `py-env` tag. This tag is used to import python files into the pyscript.
In this case, we are importing the `request.py` file, which contains the `request` function we wrote above.

### `py-script` tag for making async HTTP requests.
Next, the `py-script` tag contains the actual python code where we import `asyncio` and `json`,
which are required or helpful for the `request` function.
The `# GET`, `# POST`, `# PUT`, `# DELETE` blocks show examples of how to use the `request` function to make basic
HTTP requests. The `await` keyword is required not only for the `request` function, but also for certain methods of the
`FetchResponse` object, such as `json()`, meaning that the code is asynchronous and slower requests will not block the
faster ones.


## Conclusion
This tutorial demonstrates how to make HTTP requests using `pyfetch` and `FetchResponse` objects. Importing python
code/files into the pyscript using the `py-env` tag is also covered.

Obviously, this How-to is a very simple example, but it should give an idea of how to use `pyfetch` to make HTTP
requests. The principals here can be used to create complex web applications inside of `pyscript`, served as a
static HTML page, which is pretty amazing!

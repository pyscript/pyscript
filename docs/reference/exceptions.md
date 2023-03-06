# Exceptions and error codes

When creating pages with PyScript, you may encounter exceptions. Each handled exception will contain a specific code which will give you more information about it.
This reference guide contains the error codes you might find and a description of each of them.

## User Errors

| Error code | Description                             | Recommendation                                                                                                          |
| ---------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| PY1000     | Invalid configuration supplied          | Confirm that your `py-config` tag is using a valid `TOML` or `JSON` syntax and is using the correct configuration type. |
| PY1001     | Unable to install package(s)            | Confirm that the package contains a pure Python 3 wheel or the name of the package is correct.                          |
| PY2000     | Invalid plugin file extension           | Only `.js` and `.py` files can be used when loading user plugins. Please confirm your path contains the file extension. |
| PY2001     | Plugin doesn't contain a default export | Please add `export default` to the main plugin class.                                                                   |
| PY9000     | Top level await is deprecated           | Create a coroutine with your code and schedule it with `asyncio.ensure_future` or similar                               |

## Fetch Errors

These error codes are related to any exception raised when trying to fetch a resource. If, while trying to fetch a resource, we encounter a status code that is not 200, the error code will contain the HTTP status code and the `PY0` prefix. For example, if we encounter a 404 error, the error code will be `P02404`.

| Error Code | Description                                               |
| ---------- | --------------------------------------------------------- |
| PY0001     | Generic fetch error, failed to fetch page from the server |
| PY0002     | Name supplied when trying to fetch resource is invalid    |
| PY0401     | You are not authorized to access this resource.           |
| PY0403     | You are not allowed to access this resource.              |
| PY0404     | The page you are trying to fetch does not exist.          |
| PY0500     | The server encountered an internal error.                 |
| PY0503     | The server is currently unavailable.                      |

## PY1001

Pyscript cannot install the package(s) you specified in your `py-config` tag. This can happen for a few reasons:

-   The package does not exist
-   The package does not contain a pure Python 3 wheel
-   An error occurred while trying to install the package

An error banner should appear on your page with the error code and a description of the error or a traceback. You can also check the developer console for more information.

## PY2001

Javascript plugins must export a default class. This is required for PyScript to be able to load the plugin. Please add `export default` to the main plugin class. For example:

```js
export default class HelloWorldPlugin {
     afterStartup(runtime) {
        console.log("Hello World from the plugin!");
     }
```

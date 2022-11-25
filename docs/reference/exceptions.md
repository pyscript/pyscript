# Exceptions and error codes

When creating pages with PyScript, you may encounter exceptions. Each handled exception will contain a specific code which will give you more information about it.
This reference guide contains the error codes you might find and a description of each of them.

## User Errors

| Error code | Description                    | Recommendation     |
|------------|--------------------------------|--------------------|
| PY1000     | Invalid configuration supplied | Confirm that your `py-config` tag is using a valid `TOML` or `JSON` syntax and is using the correct configuration type. |
| PY9000     | Top level await is deprecated  | Create a coroutine with your code and schedule it with `asyncio.ensure_future` or similar |



## Fetch Errors

These error codes are related to any exception raised when trying to fetch a resource. If, while trying to fetch a resource, we encounter a status code that is not 200, the error code will contain the HTTP status code and the `PY0` prefix. For example, if we encounter a 404 error, the error code will be `P02404`.


| Error Code | Description                                                  |
|------------|--------------------------------------------------------------|
| PY0001     | Generic fetch error, failed to fetch page from the server    |
| PY0002     | Name supplied when trying to fetch resource is invalid       |
| PY0401     | You are not authorized to access this resource.              |
| PY0403     | You are not allowed to access this resource.                 |
| PY0404     | The page you are trying to fetch does not exist.             |
| PY0500     | The server encountered an internal error.                    |
| PY0503     | The server is currently unavailable.                         |

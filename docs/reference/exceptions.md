# Exceptions

When creating pages with PyScript, you may encounter exceptions. Each handled exception will contain a specific code which will give you more information about it.
This reference guide contains the error codes you might find and a description of each of them.

## User Errors

| Error code | Description | Recommendation |
|------------|--------------------------------|----------------|
| PY0001     | Feature is deprecated | Check the documentation for the feature you are using and see recommendations. |
| PY1000     | Invalid configuration supplied | Confirm that your `py-config` tag is using a valid `TOML` or `JSON` syntax and is using the correct configuration type. |



## Fetch Errors

Fetch error codes will contain the HTTP status code returned by the server, together with the "PY2" prefix. For example, if the server returns a 404 error, the error code will be "PY2404".

| Error Code | Description |
|------------|--------------------------------------------------|
| PY2301     | The page was moved permanently |
| PY2401     | You are not authorized to access this resource. |
| PY2403     | You are not allowed to access this resource. |
| PY2404     | The page you are trying to fetch does not exist. |
| PY2500     | The server encountered an internal error. |
| PY2502     | The server encountered an invalid response. |
| PY2503     | The server is currently unavailable. |
| PY2504     | The server did not respond in time. |

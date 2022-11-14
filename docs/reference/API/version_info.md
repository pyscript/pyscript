# `version_info`

`PyScript.version_info` is a `namedtuple` representing the current version of PyScript. It can be used to compare whether current version precedes or follows a desired version. For a human-readable version of the same info, see [`__version__`](__version__.md)

```sh
>>> pyscript.version_info
version_info(year=2023, month=2, patch=1, releaselevel='final')
```

## Version Fields
| **parameter**     | **CalVer equivalent field** | **example value** | **description**                                                                                                                              |
|---------------|-------------------------|---------------|------------------------------------------------------------------------------------------------------------------------------------------|
| `year`          | Full year (YYYY)        | 2023          | The year of the release; when printed or represented as a string, always written with 4 digits                                           |
| `month`         | Short Month (MM)        | 2             | The month of the release; when printed or represented as a string, written with 1 or 2 digits as necessary                               |
| `patch`         |                  | 1             | The incremental number of the release for this month; when printed or represented as a string, written with 1 or two digits as necessary |
| `releaselevel` |                         | 'final'       | A string representing the qualifications of this build. See the table below for possible values                                          |

## `releaselevel` values
| **value**         | **meaning**                                                                                   | **notes**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
|-------------------|-----------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 'dev' | The value for `releaselevel` in the codebase| All changes to `releaselevel` happen via GitHub Workflows|
| 'final'           | A full, pinned release of PyScript                                                            | Releases at `/latest` always be tagged 'final'  |
| 'unstable'        | A build created upon merging new code into the main PyScript branch, but not a pinned release | Releases at `/unstable` always be tagged 'unstable'  |
| 'RC1', 'RC2', etc  | Release candidates for a particular build of PyScript                                         | To be used with the `/snapshot` mechanism for sharing release candidates

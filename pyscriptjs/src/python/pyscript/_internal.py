from collections import namedtuple
from contextlib import contextmanager

from js import Object
from pyodide.code import eval_code

from ._event_loop import (
    defer_user_asyncio,
    install_pyscript_loop,
    schedule_deferred_tasks,
)

VersionInfo = namedtuple("version_info", ("year", "month", "minor", "releaselevel"))


def set_version_info(version_from_interpreter: str):
    from . import __dict__ as pyscript_dict

    """Sets the __version__ and version_info properties from provided JSON data
    Args:
        version_from_interpreter (str): A "dotted" representation of the version:
            YYYY.MM.m(m).releaselevel
            Year, Month, and Minor should be integers; releaselevel can be any string
    """

    version_parts = version_from_interpreter.split(".")
    year = int(version_parts[0])
    month = int(version_parts[1])
    minor = int(version_parts[2])
    if len(version_parts) > 3:
        releaselevel = version_parts[3]
    else:
        releaselevel = ""

    version_info = VersionInfo(year, month, minor, releaselevel)

    pyscript_dict["__version__"] = version_from_interpreter
    pyscript_dict["version_info"] = version_info


def uses_top_level_await(source: str) -> bool:
    return False


DISPLAY_TARGET = None


@contextmanager
def display_target(target_id):
    global DISPLAY_TARGET
    DISPLAY_TARGET = target_id
    try:
        yield
    finally:
        DISPLAY_TARGET = None


def run_pyscript(code, id = None):
    """Execute user code inside context managers.

    Uses the __main__ global namespace.

    The output is wrapped inside a JavaScript object since an object is not
    thenable. This is so we do not accidentally `await` the result of the python
    execution, even if it's awaitable (Future, Task, etc.)

    Parameters
    ----------
    code :
       The code to run

    id :
       The id for the default display target (or None if no default display target).

    Returns
    -------
        A Js Object of the form {result: the_result}
    """
    import __main__

    with display_target(id), defer_user_asyncio():
        result = eval_code(code, __main__.__dict__)
        return Object(result=result)


__all__ = [
    "set_version_info",
    "uses_top_level_await",
    "run_pyscript",
    "install_pyscript_loop",
    "schedule_deferred_tasks",
]

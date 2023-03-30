from ._event_loop import LOOP as loop
from ._event_loop import run_until_complete
from ._html import (
    HTML,
    Element,
    PyItemTemplate,
    PyListTemplate,
    PyWidgetTheme,
    add_classes,
    create,
    display,
    write,
)
from ._plugin import Plugin

# these are set by _set_version_info
__version__ = None
version_info = None


class PyScript:
    """
    This class is deprecated since 2022.12.1.

    All its old functionalities are available as module-level functions. This
    class should be killed eventually.
    """

    loop = loop
    run_until_complete = staticmethod(run_until_complete)
    write = staticmethod(write)


def __getattr__(attr):
    if attr == "js":
        global js
        import js
        from _pyscript_js import showWarning

        showWarning(
            "<code>pyscript.js</code> is deprecated, please use <code>import js</code> instead.",
            "html",
        )
        return js
    raise AttributeError(f"module 'pyscript' has no attribute '{attr}'")


__all__ = [
    "HTML",
    "write",
    "display",
    "Element",
    "add_classes",
    "create",
    "PyWidgetTheme",
    "PyItemTemplate",
    "PyListTemplate",
    "run_until_complete",
    "loop",
    "PyScript",
    "Plugin",
    "__version__",
    "version_info",
]

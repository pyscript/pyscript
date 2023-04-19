from _pyscript_js import showWarning

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
)
from ._plugin import Plugin

# these are set by _set_version_info
__version__ = None
version_info = None


def __getattr__(attr):
    if attr == "js":
        global js
        import js
        from _pyscript_js import showWarning

        # Deprecated after 2023.03.1
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
    "Plugin",
    "__version__",
    "version_info",
    "showWarning",
]

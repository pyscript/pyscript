from textwrap import dedent

from __main__ import __dict__ as main_dict
from _pyscript_js import showWarning


class DeprecatedGlobal:
    """
    Proxy for globals which are deprecated.

    The intendend usage is as follows:

        # in the global namespace
        Element = pyscript.DeprecatedGlobal('Element', pyscript.Element, "...")
        console = pyscript.DeprecatedGlobal('console', js.console, "...")
        ...

    The proxy forwards __getattr__ and __call__ to the underlying object, and
    emit a warning on the first usage.

    This way users see a warning only if they actually access the top-level
    name.
    """

    def __init__(self, name, obj, message):
        self._name = name
        self._obj = obj
        self.__message = message
        self.__warning_already_shown = False

    def __repr__(self):
        return f"<DeprecatedGlobal({self._name!r})>"

    def _show_warning(self, message):
        """
        NOTE: this is overridden by unit tests
        """
        showWarning(message, "html")  # noqa: F821

    def _show_warning_maybe(self):
        if self.__warning_already_shown:
            return
        self._show_warning(self.__message)
        self.__warning_already_shown = True

    def __getattr__(self, attr):
        self._show_warning_maybe()
        return getattr(self._obj, attr)

    def __call__(self, *args, **kwargs):
        self._show_warning_maybe()
        return self._obj(*args, **kwargs)

    def __iter__(self):
        self._show_warning_maybe()
        return iter(self._obj)

    def __getitem__(self, key):
        self._show_warning_maybe()
        return self._obj[key]

    def __setitem__(self, key, value):
        self._show_warning_maybe()
        self._obj[key] = value


class DeprecatedGlobalModule(DeprecatedGlobal):
    def __init__(self, name):
        message = f"Direct usage of <code>{name}</code> is deprecated. Please use <code>import {name}</code> instead."
        super().__init__(name, None, message)
        del self._obj

    def __getattr__(self, attr):
        if attr == "_obj":
            self._obj = __import__(self._name)
            return self._obj
        return super().__getattr__(attr)



def deprecate(name, obj, instead):
    message = f"Direct usage of <code>{name}</code> is deprecated. " + instead
    main_dict[name] = DeprecatedGlobal(name, obj, message)


def deprecated_pyscript_globals():
    # function/classes defined in pyscript.py ===> pyscript.XXX
    from . import __dict__ as public_pyscript

    pyscript_names = [
        "PyItemTemplate",
        "PyListTemplate",
        "PyWidgetTheme",
        "add_classes",
        "create",
        "loop",
    ]
    for name in pyscript_names:
        deprecate(
            name,
            public_pyscript[name],
            f"Please use <code>pyscript.{name}</code> instead.",
        )


def deprecated_mime_globals():
    from ._mime import __dict__ as mime_ns

    # these are names that used to leak in the globals but they are just
    # implementation details. People should not use them.
    private_names = [
        "eval_formatter",
        "format_mime",
        "identity",
        "render_image",
        "MIME_RENDERERS",
        "MIME_METHODS",
    ]
    for name in private_names:
        obj = mime_ns[name]
        message = (
            f"<code>{name}</code> is deprecated. "
            "This is a private implementation detail of pyscript. "
            "You should not use it."
        )
        main_dict[name] = DeprecatedGlobal(name, obj, message)


def deprecate_stdlib_modules():
    # stdlib modules ===> import XXX
    stdlib_names = [
        "asyncio",
        "base64",
        "io",
        "sys",
        "time",
        "datetime",
        "pyodide",
        "micropip",
    ]
    for name in stdlib_names:
        main_dict[name] = DeprecatedGlobalModule(name)


def install_deprecated_globals_2022_12_1():
    """
    Install into the given namespace all the globals which have been
    deprecated since the 2022.12.1 release. Eventually they should be killed.
    """
    deprecated_pyscript_globals()
    deprecated_mime_globals()
    deprecate_stdlib_modules()

    # special case
    deprecate(
        "dedent", dedent, "Please use <code>from textwrap import dedent</code> instead."
    )

    # these names are available as js.XXX
    import js

    for name in ["document", "console"]:
        obj = getattr(js, name)
        deprecate(name, obj, f"Please use <code>js.{name}</code> instead.")

    # PyScript is special, use a different message
    message = (
        "The <code>PyScript</code> object is deprecated. "
        "Please use <code>pyscript</code> instead."
    )
    from . import PyScript

    main_dict["PyScript"] = DeprecatedGlobal("PyScript", PyScript, message)

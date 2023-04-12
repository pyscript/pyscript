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
        self.__name = name
        self.__obj = obj
        self.__message = message
        self.__warning_already_shown = False

    def __repr__(self):
        return f"<DeprecatedGlobal({self.__name!r})>"

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
        return getattr(self.__obj, attr)

    def __call__(self, *args, **kwargs):
        self._show_warning_maybe()
        return self.__obj(*args, **kwargs)

    def __iter__(self):
        self._show_warning_maybe()
        return iter(self.__obj)

    def __getitem__(self, key):
        self._show_warning_maybe()
        return self.__obj[key]

    def __setitem__(self, key, value):
        self._show_warning_maybe()
        self.__obj[key] = value

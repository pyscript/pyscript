import pytest

from .support import PyScriptTest, skip_worker

pytest.skip(
    reason="NEXT: plugins not supported",
    allow_module_level=True,
)

# Source code of a simple plugin that creates a Custom Element for testing purposes
CE_PLUGIN_CODE = """
from pyscript import Plugin
from js import console

plugin = Plugin('py-upper')

console.log("py_upper Plugin loaded")

@plugin.register_custom_element('py-up')
class Upper:
    def __init__(self, element):
        self.element = element

    def connect(self):
        console.log("Upper plugin connected")
        return self.element.originalInnerHTML.upper()
"""

# Source of a plugin hooks into the PyScript App lifecycle events
HOOKS_PLUGIN_CODE = """
from pyscript import Plugin
from js import console

class TestLogger(Plugin):
    def configure(self, config):
        console.log('configure called')

    def beforeLaunch(self, config):
        console.log('beforeLaunch called')

    def afterSetup(self, config):
        console.log('afterSetup called')

    def afterStartup(self, config):
        console.log('afterStartup called')

    def beforePyScriptExec(self, interpreter, src, pyScriptTag):
        console.log(f'beforePyScriptExec called')
        console.log(f'before_src:{src}')

    def afterPyScriptExec(self, interpreter, src, pyScriptTag, result):
        console.log(f'afterPyScriptExec called')
        console.log(f'after_src:{src}')

    def onUserError(self, config):
        console.log('onUserError called')


plugin = TestLogger()
"""

# Source of script that defines a plugin with only beforePyScriptExec and
# afterPyScriptExec methods
PYSCRIPT_HOOKS_PLUGIN_CODE = """
from pyscript import Plugin
from js import console

class ExecTestLogger(Plugin):

    async def beforePyScriptExec(self, interpreter, src, pyScriptTag):
        console.log(f'beforePyScriptExec called')
        console.log(f'before_src:{src}')

    async def afterPyScriptExec(self, interpreter, src, pyScriptTag, result):
        console.log(f'afterPyScriptExec called')
        console.log(f'after_src:{src}')
        console.log(f'result:{result}')


plugin = ExecTestLogger()
"""

# Source of script that defines a plugin with only beforePyScriptExec and
# afterPyScriptExec methods
PYREPL_HOOKS_PLUGIN_CODE = """
from pyscript import Plugin
from js import console

console.warn("This is in pyrepl hooks file")

class PyReplTestLogger(Plugin):

    def beforePyReplExec(self, interpreter, src, outEl, pyReplTag):
        console.log(f'beforePyReplExec called')
        console.log(f'before_src:{src}')

    def afterPyReplExec(self, interpreter, src, outEl, pyReplTag, result):
        console.log(f'afterPyReplExec called')
        console.log(f'after_src:{src}')
        console.log(f'result:{result}')


plugin = PyReplTestLogger()
"""

# Source of a script that doesn't call define a `plugin` attribute
NO_PLUGIN_CODE = """
from pyscript import Plugin
from js import console

class TestLogger(Plugin):
    pass
"""

# Source code of a simple plugin that creates a Custom Element for testing purposes
CODE_CE_PLUGIN_BAD_RETURNS = """
from pyscript import Plugin
from js import console

plugin = Plugin('py-broken')

@plugin.register_custom_element('py-up')
class Upper:
    def __init__(self, element):
        self.element = element

    def connect(self):
        # Just returning something... anything other than a string should be ignore
        return Plugin
"""
HTML_TEMPLATE_WITH_TAG = """
    <py-config>
        plugins = [
            "./{plugin_name}.py"
        ]
    </py-config>

    <{tagname}>
        {html}
    </{tagname}>
"""
HTML_TEMPLATE_NO_TAG = """
    <py-config>
        plugins = [
            "./{plugin_name}.py"
        ]
    </py-config>
"""


def prepare_test(
    plugin_name, code, tagname="", html="", template=HTML_TEMPLATE_WITH_TAG
):
    """
    Prepares the test by writing a new plugin file named `plugin_name`.py, with `code` as its
    content and run `pyscript_run` on `template` formatted with the above inputs to create the
    page HTML code.

    For example:

    >> @prepare_test('py-upper', CE_PLUGIN_CODE, tagname='py-up', html="Hello World")
    >> def my_foo(...):
    >>     ...

    will:

    * write a new `py-upper.py` file to the FS
    * the contents of `py-upper.py` is equal to CE_PLUGIN_CODE
    * call self.pyscript_run with the following string:
        '''
            <py-config>
                plugins = [
                    "./py-upper.py"
                ]
            </py-config>

            <py-up>
                {html}
            </py-up>
        '''
    * call `my_foo` just like a normal decorator would

    """

    def dec(f):
        def _inner(self, *args, **kws):
            self.writefile(f"{plugin_name}.py", code)
            page_html = template.format(
                plugin_name=plugin_name, tagname=tagname, html=html
            )
            self.pyscript_run(page_html)
            return f(self, *args, **kws)

        return _inner

    return dec


class TestPlugin(PyScriptTest):
    @skip_worker("FIXME: relative paths")
    @prepare_test("py-upper", CE_PLUGIN_CODE, tagname="py-up", html="Hello World")
    def test_py_plugin_inline(self):
        """Test that a regular plugin that returns new HTML content from connected works"""
        # GIVEN a plugin that returns the all caps version of the tag innerHTML and logs text
        # during it's execution/hooks

        # EXPECT the plugin logs to be present in the console logs
        log_lines = self.console.log.lines
        for log_line in ["py_upper Plugin loaded", "Upper plugin connected"]:
            assert log_line in log_lines

        # EXPECT the inner text of the Plugin CustomElement to be all caps
        rendered_text = self.page.locator("py-up").inner_text()
        assert rendered_text == "HELLO WORLD"

    @skip_worker("FIXME: relative paths")
    @prepare_test("hooks_logger", HOOKS_PLUGIN_CODE, template=HTML_TEMPLATE_NO_TAG)
    def test_execution_hooks(self):
        """Test that a Plugin that hooks into the PyScript App events, gets called
        for each one of them"""
        # GIVEN a plugin that logs specific strings for each app execution event
        hooks_available = ["afterSetup", "afterStartup"]
        hooks_unavailable = [
            "configure",
            "beforeLaunch",
            "beforePyScriptExec",
            "afterPyScriptExec",
            "beforePyReplExec",
            "afterPyReplExec",
        ]

        # EXPECT it to log the correct logs for the events it intercepts
        log_lines = self.console.log.lines
        num_calls = {
            method: log_lines.count(f"{method} called") for method in hooks_available
        }
        expected_calls = {method: 1 for method in hooks_available}
        assert num_calls == expected_calls

        # EXPECT it to NOT be called (hence not log anything) the events that happen
        # before it's ready, hence is not called
        unavailable_called = {
            method: f"{method} called" in log_lines for method in hooks_unavailable
        }
        assert unavailable_called == {method: False for method in hooks_unavailable}

        # TODO: It'd be actually better to check that the events get called in order

    @skip_worker("FIXME: relative paths")
    @prepare_test(
        "exec_test_logger",
        PYSCRIPT_HOOKS_PLUGIN_CODE,
        template=HTML_TEMPLATE_NO_TAG + "\n<script type='py' id='pyid'>x=2; x</script>",
    )
    def test_pyscript_exec_hooks(self):
        """Test that the beforePyScriptExec and afterPyScriptExec hooks work as intended"""
        assert self.page.locator("script") is not None

        log_lines: list[str] = self.console.log.lines

        assert "beforePyScriptExec called" in log_lines
        assert "afterPyScriptExec called" in log_lines

        # These could be made better with a utility function that found log lines
        # that match a filter function, or start with something
        assert "before_src:x=2; x" in log_lines
        assert "after_src:x=2; x" in log_lines
        assert "result:2" in log_lines

    @skip_worker("FIXME: relative paths")
    @prepare_test(
        "pyrepl_test_logger",
        PYREPL_HOOKS_PLUGIN_CODE,
        template=HTML_TEMPLATE_NO_TAG + "\n<py-repl id='pyid'>x=2; x</py-repl>",
    )
    def test_pyrepl_exec_hooks(self):
        py_repl = self.page.locator("py-repl")
        py_repl.locator("button").click()
        # allow afterPyReplExec to also finish before the test finishes
        self.wait_for_console("result:2")

        log_lines: list[str] = self.console.log.lines

        assert "beforePyReplExec called" in log_lines
        assert "afterPyReplExec called" in log_lines

        # These could be made better with a utility function that found log lines
        # that match a filter function, or start with something
        assert "before_src:x=2; x" in log_lines
        assert "after_src:x=2; x" in log_lines
        assert "result:2" in log_lines

    @skip_worker("FIXME: relative paths")
    @prepare_test("no_plugin", NO_PLUGIN_CODE)
    def test_no_plugin_attribute_error(self):
        """
        Test a plugin that do not add the `plugin` attribute to its module
        """
        # GIVEN a Plugin NO `plugin` attribute in it's module
        error_msg = (
            "[pyscript/main] Cannot find plugin on Python module no_plugin! Python plugins "
            'modules must contain a "plugin" attribute. For more information check the '
            "plugins documentation."
        )
        # EXPECT an error for the missing attribute
        assert error_msg in self.console.error.lines

    @skip_worker("FIXME: relative paths")
    def test_fetch_python_plugin(self):
        """
        Test that we can fetch a plugin from a remote URL. Note we need to use
        the 'raw' URL for the plugin, otherwise the request will be rejected
        by cors policy.
        """
        self.pyscript_run(
            """
            <py-config>
                plugins = [
                    "https://raw.githubusercontent.com/FabioRosado/pyscript-plugins/main/python/hello-world.py"
                ]

            </py-config>
            <py-hello-world></py-hello-world>
            """
        )

        hello_element = self.page.locator("py-hello-world")
        assert hello_element.inner_html() == '<div id="hello">Hello World!</div>'

    def test_fetch_js_plugin(self):
        self.pyscript_run(
            """
            <py-config>
                plugins = [
                    "https://raw.githubusercontent.com/FabioRosado/pyscript-plugins/main/js/hello-world.js"
                ]
            </py-config>
            """
        )

        hello_element = self.page.locator("py-hello-world")
        assert hello_element.inner_html() == "<h1>Hello, world!</h1>"

    def test_fetch_js_plugin_bare(self):
        self.pyscript_run(
            """
            <py-config>
                plugins = [
                    "https://raw.githubusercontent.com/FabioRosado/pyscript-plugins/main/js/hello-world-base.js"
                ]
            </py-config>
            """
        )

        hello_element = self.page.locator("py-hello-world")
        assert hello_element.inner_html() == "<h1>Hello, world!</h1>"

    def test_fetch_plugin_no_file_extension(self):
        self.pyscript_run(
            """
            <py-config>
                plugins = [
                    "https://non-existent.blah/hello-world"
                ]
            </py-config>
            """,
            wait_for_pyscript=False,
        )

        expected_msg = (
            "(PY2000): Unable to load plugin from "
            "'https://non-existent.blah/hello-world'. Plugins "
            "need to contain a file extension and be either a "
            "python or javascript file."
        )

        assert self.assert_banner_message(expected_msg)

    def test_fetch_js_plugin_non_existent(self):
        self.pyscript_run(
            """
            <py-config>
                plugins = [
                    "http://non-existent.example.com/hello-world.js"
                ]
            </py-config>
            """,
            wait_for_pyscript=False,
        )

        expected_msg = (
            "(PY0001): Fetching from URL "
            "http://non-existent.example.com/hello-world.js failed "
            "with error 'Failed to fetch'. Are your filename and "
            "path correct?"
        )

        assert self.assert_banner_message(expected_msg)

    def test_fetch_js_no_export(self):
        self.pyscript_run(
            """
            <py-config>
                plugins = [
                    "https://raw.githubusercontent.com/FabioRosado/pyscript-plugins/main/js/hello-world-no-export.js"
                ]
            </py-config>
            """,
            wait_for_pyscript=False,
        )

        expected_message = (
            "(PY2001): Unable to load plugin from "
            "'https://raw.githubusercontent.com/FabioRosado/pyscript-plugins"
            "/main/js/hello-world-no-export.js'. "
            "Plugins need to contain a default export."
        )

        assert self.assert_banner_message(expected_message)

from .support import PyScriptTest

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

    def beforePyScriptExec(self, runtime, pyscript_tag, src):
        console.log(f'beforePyScriptExec called')
        console.log(f'before_src:{src}')

    def afterPyScriptExec(self, runtime, pyscript_tag, src, result):
        console.log(f'afterPyScriptExec called')
        console.log(f'after_src:{src}')

    def onUserError(self, config):
        console.log('onUserError called')


plugin = TestLogger()
"""

# Source of script that defines a plugin with only beforePyScriptExec and
# afterPyScriptExec methods
EXEC_HOOKS_PLUGIN_CODE = """
from pyscript import Plugin
from js import console

class ExecTestLogger(Plugin):

    def beforePyScriptExec(self, runtime, pyscript_tag, src):
        console.log(f'beforePyScriptExec called')
        console.log(f'before_src:{src}')
        console.log(f'before_id:{pyscript_tag.id}')

    def afterPyScriptExec(self, runtime, pyscript_tag, src, result):
        console.log(f'afterPyScriptExec called')
        console.log(f'after_src:{src}')
        console.log(f'after_id:{pyscript_tag.id}')


plugin = ExecTestLogger()
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
        ]

        # EXPECT it to log the correct logs for the events it intercepts
        log_lines = self.console.log.lines
        for method in hooks_available:
            assert log_lines.count(f"{method} called") == 1

        # EXPECT it to NOT be called (hence not log anything) the events that happen
        # before it's ready, hence is not called
        for method in hooks_unavailable:
            assert f"{method} called" not in log_lines

        # TODO: It'd be actually better to check that the events get called in order

    @prepare_test(
        "exec_test_logger",
        EXEC_HOOKS_PLUGIN_CODE,
        template=HTML_TEMPLATE_NO_TAG + "\n<py-script id='pyid'>x=2</py-script>",
    )
    def test_pyscript_exec_hooks(self):
        """Test that the beforePyScriptExec and afterPyScriptExec hooks work as intended"""
        assert self.page.locator("py-script") is not None

        log_lines: list[str] = self.console.log.lines

        assert "beforePyScriptExec called" in log_lines
        assert "afterPyScriptExec called" in log_lines

        # These could be made better with a utility funtcion that found log lines
        # that match a filter function, or start with something
        assert "before_src:x=2" in log_lines
        assert "before_id:pyid" in log_lines
        assert "after_src:x=2" in log_lines
        assert "after_id:pyid" in log_lines

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

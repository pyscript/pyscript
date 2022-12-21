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

    def onUserError(self, config):
        console.log('onUserError called')


plugin = TestLogger()
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
        hooks_unavailable = ["configure", "beforeLaunch"]

        # EXPECT it to log the correct logs for the events it intercepts
        log_lines = self.console.log.lines
        for method in hooks_available:
            assert f"{method} called" in log_lines

        # EXPECT it to NOT be called (hence not log anything) the events that happen
        # before it's ready, hence is not called
        for method in hooks_unavailable:
            assert f"{method} called" not in log_lines

        # TODO: It'd be actually better to check that the events get called in order

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

    def test_fetch_plugin_no_file_extension(self):
        self.pyscript_run(
            """
            <py-config>
                plugins = [
                    "http://non-existent.blah/hello-world"
                ]
            </py-config>
            """,
            wait_for_pyscript=False,
        )

        alert_banner = self.page.locator(".alert-banner")
        expected_msg = (
            "(PY1002): Unable to load plugin from "
            "'http://non-existent.blah/hello-world'. Plugins "
            "need to contain a file extension and be either a "
            "python or javascript file."
        )
        assert expected_msg == alert_banner.inner_text()

    def test_fetch_js_plugin_non_existent(self):
        self.pyscript_run(
            """
            <py-config>
                plugins = [
                    "http://non-existent.blah.com/hello-world.js"
                ]
            </py-config>
            """,
            wait_for_pyscript=False,
        )

        alert_banner = self.page.locator(".alert-banner")
        expected_msg = (
            "(PY0001): Fetching from URL "
            "http://non-existent.blah.com/hello-world.js failed "
            "with error 'Failed to fetch'. Are your filename and "
            "path correct?"
        )

        assert expected_msg == alert_banner.inner_text()

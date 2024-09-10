import os

import pytest

from .support import PyScriptTest, with_execution_thread


# Disable the main/worker dual testing, for two reasons:
#
#   1. the <py-config> logic happens before we start the worker, so there is
#      no point in running these tests twice
#
#   2. the logic to inject execution_thread into <py-config> works only with
#      plain <py-config> tags, but here we want to test all weird combinations
#      of config
@with_execution_thread(None)
class TestConfig(PyScriptTest):
    def test_py_config_inline_pyscript(self):
        self.pyscript_run(
            """
        <py-config>
            name = "foobar"
        </py-config>

        <py-script async>
            from pyscript import window
            window.console.log("config name:", window.pyConfig.name)
        </py-script>
        """
        )
        assert self.console.log.lines[-1] == "config name: foobar"

    @pytest.mark.skip("NEXT: works with <py-script> not with <script>")
    def test_py_config_inline_scriptpy(self):
        self.pyscript_run(
            """
        <py-config>
            name = "foobar"
        </py-config>

        <script type="py" async>
            from pyscript import window
            window.console.log("config name:", window.pyConfig.name)
        </script>
        """
        )
        assert self.console.log.lines[-1] == "config name: foobar"

    @pytest.mark.skip("NEXT: works with <py-script> not with <script>")
    def test_py_config_external(self):
        pyconfig_toml = """
            name = "app with external config"
        """
        self.writefile("pyconfig.toml", pyconfig_toml)
        self.pyscript_run(
            """
        <py-config src="pyconfig.toml"></py-config>

        <script type="py" async>
            from pyscript import window
            window.console.log("config name:", window.pyConfig.name)
        </script>
        """
        )
        assert self.console.log.lines[-1] == "config name: app with external config"

    def test_invalid_json_config(self):
        # we need wait_for_pyscript=False because we bail out very soon,
        # before being able to write 'PyScript page fully initialized'
        self.pyscript_run(
            """
            <py-config type="json">
                [[
            </py-config>
            """,
            wait_for_pyscript=False,
        )
        banner = self.page.wait_for_selector(".py-error")
        # assert "Unexpected end of JSON input" in self.console.error.text
        expected = "(PY1000): Invalid JSON\n" "Unexpected end of JSON input"
        assert banner.inner_text() == expected

    def test_invalid_toml_config(self):
        # we need wait_for_pyscript=False because we bail out very soon,
        # before being able to write 'PyScript page fully initialized'
        self.pyscript_run(
            """
            <py-config>
                [[
            </py-config>
            """,
            wait_for_pyscript=False,
        )
        banner = self.page.wait_for_selector(".py-error")
        # assert "Expected DoubleQuote" in self.console.error.text
        expected = (
            "(PY1000): Invalid TOML\n"
            "Expected DoubleQuote, Whitespace, or [a-z], [A-Z], "
            '[0-9], "-", "_" but end of input found.'
        )
        assert banner.inner_text() == expected

    def test_ambiguous_py_config(self):
        self.pyscript_run(
            """
            <py-config>name = "first"</py-config>

            <script type="py" config="second.toml"></script>
            """,
            wait_for_pyscript=False,
        )
        banner = self.page.wait_for_selector(".py-error")
        expected = "(PY0409): Ambiguous py-config VS config attribute"
        assert banner.text_content() == expected

    def test_multiple_attributes_py_config(self):
        self.pyscript_run(
            """
            <script type="py" config="first.toml"></script>
            <script type="py" config="second.toml"></script>
            """,
            wait_for_pyscript=False,
        )
        banner = self.page.wait_for_selector(".py-error")
        expected = "(PY0409): Unable to use different configs on main"
        assert banner.text_content() == expected

    def test_multiple_py_config(self):
        self.pyscript_run(
            """
            <py-config>
            name = "foobar"
            </py-config>

            <py-config>
            name = "this is ignored"
            </py-config>

            <script type="py">
                import js
                #config = js.pyscript_get_config()
                #js.console.log("config name:", config.name)
            </script>
            """,
            wait_for_pyscript=False,
        )
        banner = self.page.wait_for_selector(".py-error")
        expected = "(PY0409): Too many py-config"
        assert banner.text_content() == expected

    def test_paths(self):
        self.writefile("a.py", "x = 'hello from A'")
        self.writefile("b.py", "x = 'hello from B'")
        self.pyscript_run(
            """
            <py-config>
                [[fetch]]
                files = ["./a.py", "./b.py"]
            </py-config>

            <script type="py">
                import js
                import a, b
                js.console.log(a.x)
                js.console.log(b.x)
            </script>
            """
        )
        assert self.console.log.lines[-2:] == [
            "hello from A",
            "hello from B",
        ]

    @pytest.mark.skip("NEXT: emit an error if fetch fails")
    def test_paths_that_do_not_exist(self):
        self.pyscript_run(
            """
            <py-config>
                [[fetch]]
                files = ["./f.py"]
            </py-config>

            <script type="py">
                print("this should not be printed")
            </script>
            """,
            wait_for_pyscript=False,
        )

        expected = "(PY0404): Fetching from URL ./f.py failed with " "error 404"
        inner_html = self.page.locator(".py-error").inner_html()
        assert expected in inner_html
        assert expected in self.console.error.lines[-1]
        assert self.console.log.lines == []

    def test_paths_from_packages(self):
        self.writefile("utils/__init__.py", "")
        self.writefile("utils/a.py", "x = 'hello from A'")
        self.pyscript_run(
            """
            <py-config>
                [[fetch]]
                from = "utils"
                to_folder = "pkg"
                files = ["__init__.py", "a.py"]
            </py-config>

            <script type="py">
                import js
                from pkg.a import x
                js.console.log(x)
            </script>
            """
        )
        assert self.console.log.lines[-1] == "hello from A"

import pytest

from .support import PyScriptTest


@pytest.mark.xfail(reason="See PR #938")
class TestImportmap(PyScriptTest):
    def test_importmap(self):
        src = """
            export function say_hello(who) {
                console.log("hello from", who);
            }
        """
        self.writefile("mymod.js", src)
        #
        self.pyscript_run(
            """
            <script type="importmap">
            {
              "imports": {
                "mymod": "/mymod.js"
              }
            }
            </script>

            <script type="module">
                import { say_hello } from "mymod";
                say_hello("JS");
            </script>

            <script type="py">
                import mymod
                mymod.say_hello("Python")
            </script>
            """
        )
        assert self.console.log.lines == [
            "hello from JS",
            "hello from Python",
        ]

    def test_invalid_json(self):
        self.pyscript_run(
            """
            <script type="importmap">
            this is not valid JSON
            </script>

            <script type="py">
                print("hello world")
            </script>
            """,
            wait_for_pyscript=False,
        )
        # this error is raised by the browser itself, when *it* tries to parse
        # the import map
        self.check_js_errors("Failed to parse import map")

        self.wait_for_pyscript()
        assert self.console.log.lines == [
            "hello world",
        ]
        # this warning is shown by pyscript, when *we* try to parse the import
        # map
        banner = self.page.locator(".py-warning")
        assert "Failed to parse import map" in banner.inner_text()

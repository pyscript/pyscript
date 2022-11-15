from .support import PyScriptTest


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

            <py-script>
                import mymod
                mymod.say_hello("Python")
            </py-script>
            """
        )
        assert self.console.log.lines == [
            "hello from JS",
            self.PY_COMPLETE,
            "hello from Python",
        ]

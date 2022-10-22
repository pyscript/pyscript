from .support import PyScriptTest


class TestBasic(PyScriptTest):
    def test_pyscript_hello(self):
        self.pyscript_run(
            """
            <py-script>
                import js
                js.console.log('hello pyscript')
            </py-script>
            """
        )
        assert self.console.log.lines == [
            self.PY_COMPLETE,
            "hello pyscript",
        ]

    def test_execution_in_order(self):
        """
        Check that they py-script tags are executed in the same order they are
        defined
        """
        self.pyscript_run(
            """
            <py-script>import js; js.console.log('one')</py-script>
            <py-script>js.console.log('two')</py-script>
            <py-script>js.console.log('three')</py-script>
            <py-script>js.console.log('four')</py-script>
        """
        )
        assert self.console.log.lines == [
            self.PY_COMPLETE,
            "one",
            "two",
            "three",
            "four",
        ]

    def test_escaping_of_angle_brackets(self):
        """
        Check that py-script tags escape angle brackets
        """
        self.pyscript_run(
            """
            <py-script>import js; js.console.log(1<2, 1>2)</py-script>
            <py-script>js.console.log("<div></div>")</py-script>
        """
        )
        assert self.console.log.lines == [self.PY_COMPLETE, "true false", "<div></div>"]

    def test_paths(self):
        self.writefile("a.py", "x = 'hello from A'")
        self.writefile("b.py", "x = 'hello from B'")
        self.pyscript_run(
            """
            <py-config>
                paths = ["./a.py", "./b.py"]
            </py-config>

            <py-script>
                import js
                import a, b
                js.console.log(a.x)
                js.console.log(b.x)
            </py-script>
            """
        )
        assert self.console.log.lines == [
            self.PY_COMPLETE,
            "hello from A",
            "hello from B",
        ]

    def test_packages(self):
        self.pyscript_run(
            """
            <py-config>
                # we use asciitree because it's one of the smallest packages
                # which are built and distributed with pyodide
                packages = ["asciitree"]
            </py-config>

            <py-script>
                import js
                import asciitree
                js.console.log('hello', asciitree.__name__)
            </py-script>
            """
        )
        assert self.console.log.lines == [
            self.PY_COMPLETE,
            "Loading asciitree",  # printed by pyodide
            "Loaded asciitree",  # printed by pyodide
            "hello asciitree",  # printed by us
        ]

    def test_dynamically_add_py_script_tag(self):
        self.pyscript_run(
            """
            <script>
                function addPyScriptTag() {
                    let tag = document.createElement('py-script');
                    tag.innerHTML = "print('hello world')";
                    document.body.appendChild(tag);
                }
            </script>
            <button onclick="addPyScriptTag()">Click me</button>
            """
        )
        self.page.locator("button").click()
        self.page.locator("py-script")  # wait until <py-script> appears
        assert self.console.log.lines == [
            self.PY_COMPLETE,
            "hello world",
        ]

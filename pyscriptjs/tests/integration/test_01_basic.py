import pytest

from .support import JsErrors, PyScriptTest


class TestBasic(PyScriptTest):
    def test_pyscript_hello(self):
        self.pyscript_run(
            """
            <py-script>
                print('hello pyscript')
            </py-script>
            """
        )
        assert self.console.log.lines == [
            self.PY_COMPLETE,
            "hello pyscript",
        ]

    def test_python_exception(self):
        self.pyscript_run(
            """
            <py-script>
                print('hello pyscript')
                raise Exception('this is an error')
            </py-script>
        """
        )
        assert self.console.log.lines == [self.PY_COMPLETE, "hello pyscript"]
        # check that we sent the traceback to the console
        tb_lines = self.console.error.lines[-1].splitlines()
        assert tb_lines[0] == "[pyexec] Python exception:"
        assert tb_lines[1] == "Traceback (most recent call last):"
        assert tb_lines[-1] == "Exception: this is an error"
        #
        # check that we show the traceback in the page. Note that here we
        # display the "raw" python traceback, without the "[pyexec] Python
        # exception:" line (which is useful in the console, but not for the
        # user)
        pre = self.page.locator("py-script > pre")
        tb_lines = pre.inner_text().splitlines()
        assert tb_lines[0] == "Traceback (most recent call last):"
        assert tb_lines[-1] == "Exception: this is an error"

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

    def test_py_script_src_attribute(self):
        self.writefile("foo.py", "print('hello from foo')")
        self.pyscript_run(
            """
            <py-script src="foo.py"></py-script>
            """
        )
        assert self.console.log.lines == [
            self.PY_COMPLETE,
            "hello from foo",
        ]

    def test_py_script_src_not_found(self):
        self.pyscript_run(
            """
            <py-script src="foo.py"></py-script>
            """
        )
        assert self.console.log.lines == [
            self.PY_COMPLETE,
        ]
        assert "Failed to load resource" in self.console.error.lines[0]
        with pytest.raises(JsErrors) as exc:
            self.check_js_errors()

        error_msg = str(exc.value)
        assert "Failed to fetch" in error_msg

        pyscript_tag = self.page.locator("py-script")
        assert pyscript_tag.inner_html() == ""

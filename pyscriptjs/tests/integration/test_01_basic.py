import re

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
        assert self.console.log.lines[0] == self.PY_COMPLETE
        assert self.console.log.lines[-1] == "hello pyscript"

    def test_python_exception(self):
        self.pyscript_run(
            """
            <py-script>
                print('hello pyscript')
                raise Exception('this is an error')
            </py-script>
        """
        )
        assert self.console.log.lines[0] == self.PY_COMPLETE
        assert "hello pyscript" in self.console.log.lines
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
        assert self.console.log.lines[0] == self.PY_COMPLETE
        assert self.console.log.lines[-4:] == [
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

        assert self.console.log.lines[0] == self.PY_COMPLETE
        assert self.console.log.lines[-2:] == ["true false", "<div></div>"]

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

        assert self.console.log.lines[0] == self.PY_COMPLETE
        assert self.console.log.lines[-3:] == [
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

        assert self.console.log.lines[0] == self.PY_COMPLETE
        assert self.console.log.lines[-1] == "hello world"

    def test_py_script_src_attribute(self):
        self.writefile("foo.py", "print('hello from foo')")
        self.pyscript_run(
            """
            <py-script src="foo.py"></py-script>
            """
        )
        assert self.console.log.lines[0] == self.PY_COMPLETE
        assert self.console.log.lines[-1] == "hello from foo"

    def test_py_script_src_not_found(self):
        self.pyscript_run(
            """
            <py-script src="foo.py"></py-script>
            """
        )
        assert self.PY_COMPLETE in self.console.log.lines

        assert "Failed to load resource" in self.console.error.lines[0]
        with pytest.raises(JsErrors) as exc:
            self.check_js_errors()

        error_msg = str(exc.value)
        if self.is_fake_server:
            assert "Failed to fetch" in error_msg
        else:
            assert (
                "Fetching from URL foo.py failed with error 404 (File not found)"
                in error_msg
            )

        pyscript_tag = self.page.locator("py-script")
        assert pyscript_tag.inner_html() == ""

    def test_js_version(self):
        self.pyscript_run(
            """
            <py-script>
            </py-script>
            """
        )
        self.page.add_script_tag(content="console.log(pyscript.version)")

        assert (
            re.match(r"\d{4}\.\d{2}\.\d+(\.[a-zA-Z0-9]+)?", self.console.log.lines[-1])
            is not None
        )

    def test_python_version(self):
        self.pyscript_run(
            """
        <py-script>
            import js
            js.console.log(pyscript.__version__)
            js.console.log(str(pyscript.version_info))
        </py-script>
        """
        )
        assert (
            re.match(r"\d{4}\.\d{2}\.\d+\.[a-zA-Z0-9]+", self.console.log.lines[-2])
            is not None
        )
        assert (
            re.match(
                r"version_info\(year=\d{4}, month=\d{2}, "
                r"minor=\d+, releaselevel='[a-zA-Z0-9]+'\)",
                self.console.log.lines[-1],
            )
            is not None
        )

    def test_deprecated_globals(self):
        self.pyscript_run(
            """
            <py-script>
                # trigger various warnings
                Element("mydiv").write("hello world")
                assert sys.__name__ == 'sys'
                dedent("")
                format_mime("")
                console.log("hello")
                PyScript.loop
            </py-script>

            <div id="mydiv"></div>
            """
        )
        mydiv = self.page.locator("#mydiv")
        assert mydiv.inner_text() == "hello world"
        banner = self.page.locator(".py-warning")
        messages = banner.all_inner_texts()
        assert messages == [
            "The PyScript object is deprecated. Please use pyscript instead.",
            "Direct usage of console is deprecated. Please use js.console instead.",
            "format_mime is deprecated. This is a private implementation detail of pyscript. You should not use it.",  # noqa: E501
            "Direct usage of dedent is deprecated. Please use from textwrap import dedent instead.",
            "Direct usage of sys is deprecated. Please use import sys instead.",
            "Direct usage of Element is deprecated. Please use pyscript.Element instead.",
        ]

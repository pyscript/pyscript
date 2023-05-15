import re

import pytest

from .support import PyScriptTest, skip_worker


class TestBasic(PyScriptTest):
    def test_pyscript_hello(self):
        self.pyscript_run(
            """
            <script type="py">
                import js
                js.console.log('hello pyscript')
            </script>
            """
        )
        assert self.console.log.lines == ["hello pyscript"]

    def test_execution_thread(self):
        self.pyscript_run(
            """
            <!-- we don't really need anything here, we just want to check that
                 pyscript starts -->
            """
        )
        assert self.execution_thread in ("main", "worker")
        if self.execution_thread == "main":
            where = "the main thread"
        elif self.execution_thread == "worker":
            where = "a web worker"
        expected = f"[pyscript/main] Starting the interpreter in {where}"
        assert expected in self.console.info.lines

    def test_no_cors_headers(self):
        self.disable_cors_headers()
        self.pyscript_run(
            """
            <!-- we don't really need anything here, we just want to check that
                 pyscript starts -->
            """,
            wait_for_pyscript=False,
        )
        assert self.headers == {}
        if self.execution_thread == "worker":
            expected_alert_banner_msg = (
                '(PY1000): When execution_thread is "worker", the site must be cross origin '
                "isolated, but crossOriginIsolated is false. To be cross origin isolated, "
                "the server must use https and also serve with the following headers: "
                '{"Cross-Origin-Embedder-Policy":"require-corp",'
                '"Cross-Origin-Opener-Policy":"same-origin"}. '
                "The problem may be that one or both of these are missing."
            )
            alert_banner = self.page.wait_for_selector(".alert-banner")
            assert expected_alert_banner_msg in alert_banner.inner_text()
        else:
            self.assert_no_banners()

    def test_print(self):
        self.pyscript_run(
            """
            <py-script>
                print('hello pyscript')
            </py-script>
            """
        )
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
        assert "hello pyscript" in self.console.log.lines
        self.check_py_errors("Exception: this is an error")
        #
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

    def test_python_exception_in_event_handler(self):
        self.pyscript_run(
            """
            <button py-click="onclick()">Click me</button>
            <py-script>
                def onclick():
                    raise Exception("this is an error inside handler")
            </py-script>
        """
        )

        self.page.locator("button").click()
        self.wait_for_console(
            "Exception: this is an error inside handler", match_substring=True
        )

        self.check_py_errors("Exception: this is an error inside handler")

        ## error in console
        tb_lines = self.console.error.lines[-1].splitlines()
        assert tb_lines[0] == "[pyexec] Python exception:"
        assert tb_lines[1] == "Traceback (most recent call last):"
        assert tb_lines[-1] == "Exception: this is an error inside handler"

        ## error in DOM
        tb_lines = self.page.locator(".py-error").inner_text().splitlines()
        assert tb_lines[0] == "Traceback (most recent call last):"
        assert tb_lines[-1] == "Exception: this is an error inside handler"

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

        assert self.console.log.lines[-3:] == [
            "Loading asciitree",  # printed by pyodide
            "Loaded asciitree",  # printed by pyodide
            "hello asciitree",  # printed by us
        ]

    @skip_worker("FIXME: the banner doesn't appear")
    def test_non_existent_package(self):
        self.pyscript_run(
            """
            <py-config>
                packages = ["i-dont-exist"]
            </py-config>
            """,
            wait_for_pyscript=False,
        )

        expected_alert_banner_msg = (
            "(PY1001): Unable to install package(s) 'i-dont-exist'. "
            "Unable to find package in PyPI. Please make sure you have "
            "entered a correct package name."
        )

        alert_banner = self.page.wait_for_selector(".alert-banner")
        assert expected_alert_banner_msg in alert_banner.inner_text()
        self.check_py_errors("Can't fetch metadata for 'i-dont-exist'")

    @skip_worker("FIXME: the banner doesn't appear")
    def test_no_python_wheel(self):
        self.pyscript_run(
            """
            <py-config>
                packages = ["opsdroid"]
            </py-config>
            """,
            wait_for_pyscript=False,
        )

        expected_alert_banner_msg = (
            "(PY1001): Unable to install package(s) 'opsdroid'. "
            "Reason: Can't find a pure Python 3 Wheel for package(s) 'opsdroid'"
        )

        alert_banner = self.page.wait_for_selector(".alert-banner")
        assert expected_alert_banner_msg in alert_banner.inner_text()
        self.check_py_errors("Can't find a pure Python 3 wheel for 'opsdroid'")

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

        self.page.wait_for_selector("py-terminal")
        assert self.console.log.lines[-1] == "hello world"

    def test_py_script_src_attribute(self):
        self.writefile("foo.py", "print('hello from foo')")
        self.pyscript_run(
            """
            <py-script src="foo.py"></py-script>
            """
        )
        assert self.console.log.lines[-1] == "hello from foo"

    def test_py_script_src_not_found(self):
        self.pyscript_run(
            """
            <py-script src="foo.py"></py-script>
            """,
        )
        assert "Failed to load resource" in self.console.error.lines[0]

        expected_msg = "(PY0404): Fetching from URL foo.py failed with error 404"
        assert any((expected_msg in line) for line in self.console.js_error.lines)
        assert self.assert_banner_message(expected_msg)

        pyscript_tag = self.page.locator("py-script")
        assert pyscript_tag.inner_html() == ""

        self.check_js_errors(expected_msg)

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
            re.match(r"\d{4}\.\d{2}\.\d+(\.[a-zA-Z0-9]+)?", self.console.log.lines[-2])
            is not None
        )
        assert (
            re.match(
                r"version_info\(year=\d{4}, month=\d{2}, "
                r"minor=\d+, releaselevel='([a-zA-Z0-9]+)?'\)",
                self.console.log.lines[-1],
            )
            is not None
        )

    @skip_worker("FIXME: showWarning()")
    def test_assert_no_banners(self):
        """
        Test that the DOM doesn't contain error/warning banners
        """
        self.pyscript_run(
            """
            <py-script>
                from _pyscript_js import showWarning
                showWarning("hello")
                showWarning("world")
            </py-script>
            """
        )
        with pytest.raises(AssertionError, match="Found 2 alert banners"):
            self.assert_no_banners()

    def test_getPySrc_returns_source_code(self):
        self.pyscript_run(
            """
            <py-script>
                print("hello world!")
            </py-script>
            """
        )

        pyscript_tag = self.page.locator("py-script")
        assert pyscript_tag.inner_html() == ""
        assert (
            pyscript_tag.evaluate("node => node.getPySrc()")
            == 'print("hello world!")\n'
        )

    def test_py_attribute_without_id(self):
        self.pyscript_run(
            """
            <button py-click="myfunc()">Click me</button>
            <py-script>
                def myfunc():
                    print("hello world!")
            </py-script>
            """
        )
        btn = self.page.wait_for_selector("button")
        btn.click()
        self.wait_for_console("hello world!")
        assert self.console.log.lines[-1] == "hello world!"
        assert self.console.error.lines == []

    def test_py_mount_shows_deprecation_warning(self):
        # last non-deprecated version: 2023.03.1
        self.pyscript_run(
            """
            <div id="foo" py-mount></div>
            """
        )
        banner = self.page.locator(".alert-banner")
        expected_message = (
            'The "py-mount" attribute is deprecated. '
            + "Please add references to HTML Elements manually in your script."
        )
        assert banner.inner_text() == expected_message

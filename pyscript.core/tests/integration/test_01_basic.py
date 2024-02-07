import re

import pytest

from .support import PyScriptTest, only_main, skip_worker


class TestBasic(PyScriptTest):
    def test_pyscript_exports(self):
        self.pyscript_run(
            """
            <script type="py">
                from pyscript import RUNNING_IN_WORKER, PyWorker, window, document, sync, current_target
            </script>
            """
        )
        assert self.console.error.lines == []

    def test_script_py_hello(self):
        self.pyscript_run(
            """
            <script type="py">
                import js
                js.console.log('hello from script py')
            </script>
            """
        )
        assert self.console.log.lines == ["hello from script py"]

    def test_py_script_hello(self):
        self.pyscript_run(
            """
            <py-script>
                import js
                js.console.log('hello from py-script')
            </py-script>
            """
        )
        assert self.console.log.lines == ["hello from py-script"]

    def test_execution_thread(self):
        self.pyscript_run(
            """
            <script type="py">
                import pyscript
                import js
                js.console.log("worker?", pyscript.RUNNING_IN_WORKER)
            </script>
            """,
        )
        assert self.execution_thread in ("main", "worker")
        in_worker = self.execution_thread == "worker"
        in_worker = str(in_worker).lower()
        assert self.console.log.lines[-1] == f"worker? {in_worker}"

    @skip_worker("NEXT: it should show a nice error on the page")
    def test_no_cors_headers(self):
        self.disable_cors_headers()
        self.pyscript_run(
            """
            <script type="py">
                import js
                js.console.log("hello")
            </script>
            """,
            wait_for_pyscript=False,
        )
        assert self.headers == {}
        if self.execution_thread == "main":
            self.wait_for_pyscript()
            assert self.console.log.lines == ["hello"]
            self.assert_no_banners()
        else:
            # XXX adapt and fix the test
            expected_alert_banner_msg = (
                '(PY1000): When execution_thread is "worker", the site must be cross origin '
                "isolated, but crossOriginIsolated is false. To be cross origin isolated, "
                "the server must use https and also serve with the following headers: "
                '{"Cross-Origin-Embedder-Policy":"require-corp",'
                '"Cross-Origin-Opener-Policy":"same-origin"}. '
                "The problem may be that one or both of these are missing."
            )
            alert_banner = self.page.wait_for_selector(".py-error")
            assert expected_alert_banner_msg in alert_banner.inner_text()

    def test_print(self):
        self.pyscript_run(
            """
            <script type="py">
                print('hello pyscript')
            </script>
            """
        )
        assert self.console.log.lines[-1] == "hello pyscript"

    @only_main
    def test_input_exception(self):
        self.pyscript_run(
            """
            <script type="py">
                input("what's your name?")
            </script>
            """
        )
        self.check_py_errors(
            "Exception: input() doesn't work when PyScript runs in the main thread."
        )

    @skip_worker("NEXT: exceptions should be displayed in the DOM")
    def test_python_exception(self):
        self.pyscript_run(
            """
            <script type="py">
                print('hello pyscript')
                raise Exception('this is an error')
            </script>
        """
        )
        assert "hello pyscript" in self.console.log.lines
        self.check_py_errors("Exception: this is an error")
        #
        # check that we show the traceback in the page. Note that here we
        # display the "raw" python traceback, without the "[pyexec] Python
        # exception:" line (which is useful in the console, but not for the
        # user)
        banner = self.page.locator(".py-error")
        tb_lines = banner.inner_text().splitlines()
        assert tb_lines[0] == "Traceback (most recent call last):"
        assert tb_lines[-1] == "Exception: this is an error"

    @skip_worker("NEXT: py-click doesn't work inside workers")
    def test_python_exception_in_event_handler(self):
        self.pyscript_run(
            """
            <button py-click="onclick">Click me</button>
            <script type="py">
                def onclick(event):
                    raise Exception("this is an error inside handler")
            </script>
        """
        )

        self.page.locator("button").click()
        self.wait_for_console(
            "Exception: this is an error inside handler", match_substring=True
        )

        self.check_py_errors("Exception: this is an error inside handler")

        ## error in DOM
        tb_lines = self.page.locator(".py-error").inner_text().splitlines()
        assert tb_lines[0] == "Traceback (most recent call last):"
        assert tb_lines[-1] == "Exception: this is an error inside handler"

    @only_main
    def test_execution_in_order(self):
        """
        Check that they script py tags are executed in the same order they are
        defined
        """
        self.pyscript_run(
            """
            <script type="py">import js; js.console.log('one')</script>
            <script type="py">js.console.log('two')</script>
            <script type="py">js.console.log('three')</script>
            <script type="py">js.console.log('four')</script>
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
        Check that script tags escape angle brackets
        """
        self.pyscript_run(
            """
            <script type="py">
                import js
                js.console.log("A", 1<2, 1>2)
                js.console.log("B <div></div>")
            </script>
            <py-script>
                import js
                js.console.log("C", 1<2, 1>2)
                js.console.log("D <div></div>")
            </py-script>
        """
        )
        # in workers the order of execution is not guaranteed, better to play
        # safe
        lines = sorted(self.console.log.lines[-4:])
        assert lines == [
            "A true false",
            "B <div></div>",
            "C true false",
            "D <div></div>",
        ]

    def test_packages(self):
        self.pyscript_run(
            """
            <py-config>
                packages = ["asciitree"]
            </py-config>
            <script type="py">
                import js
                import asciitree
                js.console.log('hello', asciitree.__name__)
            </script>
            """
        )

        assert self.console.log.lines[-3:] == [
            "Loading asciitree",  # printed by pyodide
            "Loaded asciitree",  # printed by pyodide
            "hello asciitree",  # printed by us
        ]

    @pytest.mark.skip("NEXT: No banner")
    def test_non_existent_package(self):
        self.pyscript_run(
            """
            <py-config>
                packages = ["i-dont-exist"]
            </py-config>
            <script type="py">
                print('hello')
            </script>
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

    @pytest.mark.skip("NEXT: No banner")
    def test_no_python_wheel(self):
        self.pyscript_run(
            """
            <py-config>
                packages = ["opsdroid"]
            </py-config>
            <script type="py">
                print('hello')
            </script>
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

    @only_main
    def test_dynamically_add_py_script_tag(self):
        self.pyscript_run(
            """
            <script>
                function addPyScriptTag(event) {
                    let tag = document.createElement('py-script');
                    tag.innerHTML = "print('hello world')";
                    document.body.appendChild(tag);
                }
                addPyScriptTag()
            </script>
            """,
            timeout=20000,
        )
        self.page.locator("py-script")

        assert self.console.log.lines[-1] == "hello world"

    def test_py_script_src_attribute(self):
        self.writefile("foo.py", "print('hello from foo')")
        self.pyscript_run(
            """
            <script type="py" src="foo.py"></script>
            """
        )
        assert self.console.log.lines[-1] == "hello from foo"

    @skip_worker("NEXT: banner not shown")
    def test_py_script_src_not_found(self):
        self.pyscript_run(
            """
            <script type="py" src="foo.py"></script>
            """,
            check_js_errors=False,
        )
        assert "Failed to load resource" in self.console.error.lines[0]

        # TODO: we need to be sure errors make sense from both main and worker worlds
        expected_msg = "(PY0404): Fetching from URL foo.py failed with error 404"
        assert any((expected_msg in line) for line in self.console.error.lines)
        assert self.assert_banner_message(expected_msg)

    # TODO: ... and we shouldn't: it's a module and we better don't leak in global
    @pytest.mark.skip("NEXT: we don't expose pyscript on window")
    def test_js_version(self):
        self.pyscript_run(
            """
            <script type="py">
            </script>
            """
        )
        self.page.add_script_tag(content="console.log(pyscript.version)")

        assert (
            re.match(r"\d{4}\.\d{2}\.\d+(\.[a-zA-Z0-9]+)?", self.console.log.lines[-1])
            is not None
        )

    # TODO: ... and we shouldn't: it's a module and we better don't leak in global
    @pytest.mark.skip("NEXT: we don't expose pyscript on window")
    def test_python_version(self):
        self.pyscript_run(
            """
        <script type="py">
            import js
            js.console.log(pyscript.__version__)
            js.console.log(str(pyscript.version_info))
        </script>
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

    @pytest.mark.skip("NEXT: works with <py-script> not with <script>")
    def test_getPySrc_returns_source_code(self):
        self.pyscript_run(
            """
            <py-script>print("hello from py-script")</py-script>
            <script type="py">print("hello from script py")</script>
            """
        )
        pyscript_tag = self.page.locator("py-script")
        assert pyscript_tag.inner_html() == ""
        assert (
            pyscript_tag.evaluate("node => node.srcCode")
            == 'print("hello from py-script")'
        )
        script_py_tag = self.page.locator('script[type="py"]')
        assert (
            script_py_tag.evaluate("node => node.srcCode")
            == 'print("hello from script py")'
        )

    @skip_worker("NEXT: py-click doesn't work inside workers")
    def test_py_attribute_without_id(self):
        self.pyscript_run(
            """
            <button py-click="myfunc">Click me</button>
            <script type="py">
                def myfunc(event):
                    print("hello world!")
            </script>
            """
        )
        btn = self.page.wait_for_selector("button")
        btn.click()
        self.wait_for_console("hello world!")
        assert self.console.log.lines[-1] == "hello world!"
        assert self.console.error.lines == []

    def test_py_all_done_event(self):
        self.pyscript_run(
            """
            <script>
                addEventListener("py:all-done", () => console.log("2"))
            </script>
            <script type="py">
                print("1")
            </script>
            """
        )
        assert self.console.log.lines == ["1", "2"]
        assert self.console.error.lines == []

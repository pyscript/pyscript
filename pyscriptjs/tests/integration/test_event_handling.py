from .support import PyScriptTest, skip_worker


class TestEventHandler(PyScriptTest):
    ## The tests at the top of this file are for py-[event] and py-[event]-code handling

    @skip_worker(reason="FIXME: js.document")
    def test_coderunner(self):
        self.pyscript_run(
            """
            <button py-click-code="print('hello')">Click Me</button>
            """
        )
        self.page.get_by_role("button").click()
        assert "hello" in self.console.log.lines
        self.assert_no_banners()

    def test_py_event_no_args(self):
        self.pyscript_run(
            """
        <py-script>
            def noargs():
                print("Called a function with no args")
        </py-script>
        <button py-click="noargs">Click Me</button>
        """
        )

        self.page.get_by_role("button").click()
        self.wait_for_console("Called a function with no args")
        self.assert_no_banners()

    # This test is currently failing - see PR #1432 for progress
    # https://github.com/pyscript/pyscript/pull/1432
    def test_py_event_one_arg(self):
        self.pyscript_run(
            """
        <py-script>
            def onearg(arg1):
                print(f"Called a function with one argument {arg1}")
        </py-script>
        <button py-click="onearg">Click Me</button>
        """
        )

        self.page.get_by_role("button").click()
        self.wait_for_console("Called a function with one argument", timeout=5000)
        self.assert_no_banners()

    def test_py_event_two_args(self):
        self.pyscript_run(
            """
        <py-script>
            def twoargs(arg1, arg2):
                print(f"This should not get printed")
        </py-script>
        <button py-click="twoargs">Click Me</button>
        """
        )

        self.page.get_by_role("button").click()
        expected_msg = (
            "UserError: (PY3001): The Callable specified by py-[event] should "
            "take zero or one arguments; the provided callable takes 2 arguments"
        )
        banner = self.page.wait_for_selector(".py-error")
        assert expected_msg in banner.inner_text()

    def test_py_event_name_not_defined(self):
        self.pyscript_run(
            """
        <button py-click="not_defined">Click Me</button>
        """
        )

        self.page.get_by_role("button").click()
        expected_msg = "NameError: name 'not_defined' is not defined"
        banner = self.page.wait_for_selector(".py-error")
        assert expected_msg in banner.inner_text()

    def test_py_event_not_callable(self):
        self.pyscript_run(
            """
        <py-script>
            foo = 1
        </py-script>
        <button py-click="foo">Click Me</button>
        """
        )

        self.page.get_by_role("button").click()
        expected_msg = (
            "UserError: (PY3000): The value of 'py-[event]' should be the name of a function"
            " or Callable. (Got 'foo')\n"
            "To run an expression as code, use 'py-[event]-code'"
        )
        banner = self.page.wait_for_selector(".py-error")
        assert expected_msg in banner.inner_text()

    ## The tests in the second half of this file are for the @when decorator

    @skip_worker(reason="FIXME: js.document (@when decorator)")
    def test_when_decorator_with_event(self):
        """When the decorated function takes a single parameter,
        it should be passed the event object
        """
        self.pyscript_run(
            """
            <button id="foo_id">foo_button</button>
            <py-script>
                from pyscript import when
                @when("click", selector="#foo_id")
                def foo(evt):
                    print(f"I've clicked {evt.target} with id {evt.target.id}")
            </py-script>
        """
        )
        self.page.locator("text=foo_button").click()
        console_text = self.console.all.lines
        self.wait_for_console("I've clicked [object HTMLButtonElement] with id foo_id")
        assert "I've clicked [object HTMLButtonElement] with id foo_id" in console_text
        self.assert_no_banners()

    @skip_worker(reason="FIXME: js.document (@when decorator)")
    def test_when_decorator_without_event(self):
        """When the decorated function takes no parameters (not including 'self'),
        it should be called without the event object
        """
        self.pyscript_run(
            """
            <button id="foo_id">foo_button</button>
            <py-script>
                from pyscript import when
                @when("click", selector="#foo_id")
                def foo():
                    print("The button was clicked")
            </py-script>
        """
        )
        self.page.locator("text=foo_button").click()
        self.wait_for_console("The button was clicked")
        assert "The button was clicked" in self.console.log.lines
        self.assert_no_banners()

    @skip_worker(reason="FIXME: js.document (@when decorator)")
    def test_multiple_when_decorators_with_event(self):
        self.pyscript_run(
            """
            <button id="foo_id">foo_button</button>
            <button id="bar_id">bar_button</button>
            <py-script>
                from pyscript import when
                @when("click", selector="#foo_id")
                def foo(evt):
                    print(f"I've clicked {evt.target} with id {evt.target.id}")
                @when("click", selector="#bar_id")
                def foo(evt):
                    print(f"I've clicked {evt.target} with id {evt.target.id}")
            </py-script>
        """
        )
        self.page.locator("text=foo_button").click()
        console_text = self.console.all.lines
        self.wait_for_console("I've clicked [object HTMLButtonElement] with id foo_id")
        assert "I've clicked [object HTMLButtonElement] with id foo_id" in console_text

        self.page.locator("text=bar_button").click()
        console_text = self.console.all.lines
        self.wait_for_console("I've clicked [object HTMLButtonElement] with id bar_id")
        assert "I've clicked [object HTMLButtonElement] with id bar_id" in console_text
        self.assert_no_banners()

    @skip_worker(reason="FIXME: js.document (@when decorator)")
    def test_two_when_decorators(self):
        """When decorating a function twice, both should function"""
        self.pyscript_run(
            """
            <button id="foo_id">foo_button</button>
            <button class="bar_class">bar_button</button>
            <py-script>
                from pyscript import when
                @when("click", selector="#foo_id")
                @when("mouseover", selector=".bar_class")
                def foo(evt):
                    print(f"An event of type {evt.type} happened")
            </py-script>
        """
        )
        self.page.locator("text=bar_button").hover()
        self.page.locator("text=foo_button").click()
        self.wait_for_console("An event of type click happened")
        assert "An event of type mouseover happened" in self.console.log.lines
        assert "An event of type click happened" in self.console.log.lines
        self.assert_no_banners()

    @skip_worker(reason="FIXME: js.document (@when decorator)")
    def test_two_when_decorators_same_element(self):
        """When decorating a function twice *on the same DOM element*, both should function"""
        self.pyscript_run(
            """
            <button id="foo_id">foo_button</button>
            <py-script>
                from pyscript import when
                @when("click", selector="#foo_id")
                @when("mouseover", selector="#foo_id")
                def foo(evt):
                    print(f"An event of type {evt.type} happened")
            </py-script>
        """
        )
        self.page.locator("text=foo_button").hover()
        self.page.locator("text=foo_button").click()
        self.wait_for_console("An event of type click happened")
        assert "An event of type mouseover happened" in self.console.log.lines
        assert "An event of type click happened" in self.console.log.lines
        self.assert_no_banners()

    @skip_worker(reason="FIXME: js.document (@when decorator)")
    def test_when_decorator_multiple_elements(self):
        """The @when decorator's selector should successfully select multiple
        DOM elements
        """
        self.pyscript_run(
            """
            <button class="bar_class">button1</button>
            <button class="bar_class">button2</button>
            <py-script>
                from pyscript import when
                @when("click", selector=".bar_class")
                def foo(evt):
                    print(f"{evt.target.innerText} was clicked")
            </py-script>
        """
        )
        self.page.locator("text=button1").click()
        self.page.locator("text=button2").click()
        self.wait_for_console("button2 was clicked")
        assert "button1 was clicked" in self.console.log.lines
        assert "button2 was clicked" in self.console.log.lines
        self.assert_no_banners()

    @skip_worker(reason="FIXME: js.document (@when decorator)")
    def test_when_decorator_duplicate_selectors(self):
        """ """
        self.pyscript_run(
            """
            <button id="foo_id">foo_button</button>
            <py-script>
                from pyscript import when
                @when("click", selector="#foo_id")
                @when("click", selector="#foo_id")
                def foo(evt):
                    print(f"I've clicked {evt.target} with id {evt.target.id}")
            </py-script>
        """
        )
        self.page.locator("text=foo_button").click()
        console_text = self.console.all.lines
        self.wait_for_console("I've clicked [object HTMLButtonElement] with id foo_id")
        assert (
            console_text.count("I've clicked [object HTMLButtonElement] with id foo_id")
            == 2
        )
        self.assert_no_banners()

    @skip_worker(reason="FIXME: js.document (@when decorator)")
    def test_when_decorator_invalid_selector(self):
        """When the selector parameter of @when is invalid, it should show an error"""
        self.pyscript_run(
            """
            <button id="foo_id">foo_button</button>
            <py-script>
                from pyscript import when
                @when("click", selector="#.bad")
                def foo(evt):
                    ...
            </py-script>
        """
        )
        self.page.locator("text=foo_button").click()
        msg = "Failed to execute 'querySelectorAll' on 'Document': '#.bad' is not a valid selector."
        error = self.page.wait_for_selector(".py-error")
        banner_text = error.inner_text()

        if msg not in banner_text:
            raise AssertionError(
                f"Expected message '{msg}' does not "
                f"match banner text '{banner_text}'"
            )

        assert any(msg in line for line in self.console.error.lines)

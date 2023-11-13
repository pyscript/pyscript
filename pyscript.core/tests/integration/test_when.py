import pytest

from .support import PyScriptTest, skip_worker


class TestEventHandler(PyScriptTest):
    def test_when_decorator_with_event(self):
        """When the decorated function takes a single parameter,
        it should be passed the event object
        """
        self.pyscript_run(
            """
            <button id="foo_id">foo_button</button>
            <script type="py">
                from pyscript import when
                @when("click", selector="#foo_id")
                def foo(evt):
                    print(f"clicked {evt.target.id}")
            </script>
        """
        )
        self.page.locator("text=foo_button").click()
        self.wait_for_console("clicked foo_id")
        self.assert_no_banners()

    def test_when_decorator_without_event(self):
        """When the decorated function takes no parameters (not including 'self'),
        it should be called without the event object
        """
        self.pyscript_run(
            """
            <button id="foo_id">foo_button</button>
            <script type="py">
                from pyscript import when
                @when("click", selector="#foo_id")
                def foo():
                    print("The button was clicked")
            </script>
        """
        )
        self.page.locator("text=foo_button").click()
        self.wait_for_console("The button was clicked")
        self.assert_no_banners()

    def test_multiple_when_decorators_with_event(self):
        self.pyscript_run(
            """
            <button id="foo_id">foo_button</button>
            <button id="bar_id">bar_button</button>
            <script type="py">
                from pyscript import when
                @when("click", selector="#foo_id")
                def foo_click(evt):
                    print(f"foo_click! id={evt.target.id}")
                @when("click", selector="#bar_id")
                def bar_click(evt):
                    print(f"bar_click! id={evt.target.id}")
            </script>
        """
        )
        self.page.locator("text=foo_button").click()
        self.wait_for_console("foo_click! id=foo_id")
        self.page.locator("text=bar_button").click()
        self.wait_for_console("bar_click! id=bar_id")
        self.assert_no_banners()

    def test_two_when_decorators(self):
        """When decorating a function twice, both should function"""
        self.pyscript_run(
            """
            <button id="foo_id">foo_button</button>
            <button class="bar_class">bar_button</button>
            <script type="py">
                from pyscript import when
                @when("click", selector="#foo_id")
                @when("mouseover", selector=".bar_class")
                def foo(evt):
                    print(f"got event: {evt.type}")
            </script>
        """
        )
        self.page.locator("text=bar_button").hover()
        self.wait_for_console("got event: mouseover")
        self.page.locator("text=foo_button").click()
        self.wait_for_console("got event: click")
        self.assert_no_banners()

    def test_two_when_decorators_same_element(self):
        """When decorating a function twice *on the same DOM element*, both should function"""
        self.pyscript_run(
            """
            <button id="foo_id">foo_button</button>
            <script type="py">
                from pyscript import when
                @when("click", selector="#foo_id")
                @when("mouseover", selector="#foo_id")
                def foo(evt):
                    print(f"got event: {evt.type}")
            </script>
        """
        )
        self.page.locator("text=foo_button").hover()
        self.wait_for_console("got event: mouseover")
        self.page.locator("text=foo_button").click()
        self.wait_for_console("got event: click")
        self.assert_no_banners()

    def test_when_decorator_multiple_elements(self):
        """The @when decorator's selector should successfully select multiple
        DOM elements
        """
        self.pyscript_run(
            """
            <button class="bar_class">button1</button>
            <button class="bar_class">button2</button>
            <script type="py">
                from pyscript import when
                @when("click", selector=".bar_class")
                def foo(evt):
                    print(f"{evt.target.innerText} was clicked")
            </script>
        """
        )
        self.page.locator("text=button1").click()
        self.page.locator("text=button2").click()
        self.wait_for_console("button2 was clicked")
        assert "button1 was clicked" in self.console.log.lines
        assert "button2 was clicked" in self.console.log.lines
        self.assert_no_banners()

    def test_when_decorator_duplicate_selectors(self):
        """ """
        self.pyscript_run(
            """
            <button id="foo_id">foo_button</button>
            <script type="py">
                from pyscript import when
                @when("click", selector="#foo_id")
                @when("click", selector="#foo_id")
                def foo(evt):
                    foo.n += 1
                    print(f"click {foo.n} on {evt.target.id}")
                foo.n = 0
            </script>
        """
        )
        self.page.locator("text=foo_button").click()
        self.wait_for_console("click 1 on foo_id")
        self.wait_for_console("click 2 on foo_id")
        self.assert_no_banners()

    @skip_worker("NEXT: error banner not shown")
    def test_when_decorator_invalid_selector(self):
        """When the selector parameter of @when is invalid, it should show an error"""
        self.pyscript_run(
            """
            <button id="foo_id">foo_button</button>
            <script type="py">
                from pyscript import when
                @when("click", selector="#.bad")
                def foo(evt):
                    ...
            </script>
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

        assert msg in self.console.error.lines[-1]
        self.check_py_errors(msg)

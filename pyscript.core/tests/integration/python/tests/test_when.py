import asyncio
from pyscript import web


def get_container():
    return web.page.find("#test-element-container")[0]


def setup():
    container = get_container()
    container.innerHTML = ""


def teardown():
    container = get_container()
    container.innerHTML = ""


async def test_when_decorator_with_event():
    """
    When the decorated function takes a single parameter,
    it should be passed the event object
    """
    btn = web.button("foo_button", id="foo_id")
    container = get_container()
    container.append(btn)

    called = False

    @web.when("click", selector="#foo_id")
    def foo(evt):
        nonlocal called
        called = evt
    
    btn.click()
    assert called.target.id == "foo_id"

def test_when_decorator_without_event():
    """
    When the decorated function takes no parameters (not including 'self'),
    it should be called without the event object
    """
    btn = web.button("foo_button", id="foo_id")
    container = get_container()
    container.append(btn)

    called = False

    @web.when("click", selector="#foo_id")
    def foo():
        nonlocal called
        called = True
    
    btn.click()
    assert called

def _test_two_when_decorators():
    """
    When decorating a function twice, both should function
    """
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

def _test_two_when_decorators_same_element():
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

def _test_when_decorator_multiple_elements():
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

def _test_when_decorator_duplicate_selectors():
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

#@skip_worker("NEXT: error banner not shown")
def _test_when_decorator_invalid_selector():
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
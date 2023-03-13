from .support import PyScriptTest


class TestEventHandler(PyScriptTest):
    def test_when_decorated_func_with_click_event(self):
        self.pyscript_run(
            """
            <button id="foo_id">foo_button</button>
            <py-script>
                from pyscript import when
                @when("click", id="foo_id")
                def foo(evt):
                    print(f"I've clicked {evt.target} with id {evt.target.id}")
            </py-script>
        """
        )
        self.page.locator("text=foo_button").click()
        console_text = self.console.all.lines
        assert "I've clicked [object HTMLButtonElement] with id foo_id" in console_text

    def test_when_decorated_func_without_event(self):
        self.pyscript_run(
            """
            <button id="foo_id">foo_button</button>
            <py-script>
                from pyscript import when
                @when("click", id="foo_id")
                def foo():
                    print("A button was clicked")
            </py-script>
        """
        )
        self.page.locator("text=foo_button").click()
        console_text = self.console.all.lines
        assert "A button was clicked" in console_text

    def test_multiple_when_uses_with_click_event(self):
        self.pyscript_run(
            """
            <button id="foo_id">foo_button</button>
            <button id="bar_id">bar_button</button>
            <py-script>
                from pyscript import when
                @when("click", id="foo_id")
                def foo(evt):
                    print(f"I've clicked {evt.target} with id {evt.target.id}")
                @when("click", id="bar_id")
                def foo(evt):
                    print(f"I've clicked {evt.target} with id {evt.target.id}")
            </py-script>
        """
        )
        self.page.locator("text=foo_button").click()
        console_text = self.console.all.lines
        assert "I've clicked [object HTMLButtonElement] with id foo_id" in console_text

        self.page.locator("text=bar_button").click()
        console_text = self.console.all.lines
        assert "I've clicked [object HTMLButtonElement] with id bar_id" in console_text

    def test_py_event_without_decorator(self):
        self.pyscript_run(
            """
            <button py-click="reacts_to_py_click">no_when</button><br><br>
            <py-script>
            from pyscript import when
            def reacts_to_py_click(evt):
                print(f"Reacting to event {evt}")
            </py-script>
            """
        )
        self.page.locator("text=no_when").click()
        console_text = self.console.all.lines
        assert "Reacting to event [object PointerEvent]" in console_text

    def test_py_event_more_than_one_arg(self):
        self.pyscript_run(
            """
            <button py-click="multiple_args">two_args_button</button><br><br>
            <py-script>
            def multiple_args(first, second):
                print(f"I got {first=}, {second=}")
            </py-script>
            """
        )
        self.page.locator("text=two_args_button").click()
        tb_lines = self.console.error.lines[-1].splitlines()
        assert tb_lines[0] == "[pyexec] Non-python exception:"
        assert tb_lines[1] == "UserError: (PY0000): py-events take 0 or 1 arguments"

    def test_instance_method_when_with_click_event(self):
        self.pyscript_run(
            """
            <button py-click="instance.someEventFunc">instance_method</button>
            <py-script>
                class Instance():
                    def someEventFunc(self, evt):
                        print(f"Got event with target {evt.target}")
                instance = Instance()
            </py-script>
            """
        )
        self.page.locator("text=instance_method").click()
        console_text = self.console.all.lines
        assert "Got event with target [object HTMLButtonElement]" in console_text


    def test_instance_method_when_without_event(self):
        self.pyscript_run(
            """
            <button py-click="instance.somefunc">instance_method</button>
            <py-script>
                class Instance():
                    def somefunc(self):
                        print("Somefunc got called")
                instance = Instance()
            </py-script>
            """
        )
        self.page.locator("text=instance_method").click()
        console_text = self.console.all.lines
        assert "Somefunc got called" in console_text

    # this needs to throw an err on py-event
    def test_run_code_in_py_event_tag(self):
        self.pyscript_run(
            """
                <button py-click="print('a hack!')">misuse_py_event</button>
            """
        )
        self.page.locator("text=misuse_py_event").click()
        tb_lines = self.console.error.lines[-1].splitlines()
        assert tb_lines[0] == "some err"

    # this needs to run
    def test_run_code_in_py_event_code_tag(self):
        self.pyscript_run(
            """
                <button py-click="print('this is fine')">misuse_py_event</button>
            """
        )
        self.page.locator("text=misuse_py_event").click()
        console_text = self.console.all.lines
        assert "this is fine" in console_text

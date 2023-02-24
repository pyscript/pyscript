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
                    print(f"A button was clicked")
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

    #I wonder if we want to support this kind of behaviour?
    # def test_when_targets_all_click_events(self):
    #     self.pyscript_run(
    #         """
    #         <button>foo_button</button>
    #         <button>bar_button</button>
    #         <py-script>
    #             from pyscript import when
    #             @when("click")
    #             def foo():
    #                 print(f"Any click will trigger this")
    #         </py-script>
    #     """
    #     )
    #     self.page.locator("text=foo_button").click()
    #     self.page.locator("text=bar_button").click()
    #     console_text = self.console.all.lines
    #     assert console_text[0] == "Any click will trigger this"
    #     assert console_text[1] == "Any click will trigger this"




import re

from .support import PyScriptTest, skip_worker


class TestDocsSnippets(PyScriptTest):
    @skip_worker("FIXME: js.document")
    def test_tutorials_py_click(self):
        self.pyscript_run(
            """
            <button
              py-click="current_time()"
              id="get-time" class="py-button">
              Get current time
            </button>
            <p id="current-time"></p>

            <py-script>
                from pyscript import Element
                import datetime

                def current_time():
                    now = datetime.datetime.now()

                    # Get paragraph element by id
                    paragraph = Element("current-time")

                    # Add current time to the paragraph element
                    paragraph.write(now.strftime("%Y-%m-%d %H:%M:%S"))
            </py-script>
            """
        )

        btn = self.page.wait_for_selector("#get-time")
        btn.click()

        current_time = self.page.wait_for_selector("#current-time")

        pattern = "\\d+-\\d+-\\d+\\s\\d+:\\d+:\\d+"  # e.g. 08-09-2022 15:57:32
        assert re.search(pattern, current_time.inner_text())
        self.assert_no_banners()

    def test_tutorials_requests(self):
        self.pyscript_run(
            """
            <py-config>
                packages = ["requests", "pyodide-http"]
            </py-config>

            <py-script>
                import requests
                import pyodide_http

                # Patch the Requests library so it works with Pyscript
                pyodide_http.patch_all()

                # Make a request to the JSON Placeholder API
                response = requests.get("https://jsonplaceholder.typicode.com/todos")
                print(response.json())
            </py-script>
            """
        )

        py_terminal = self.page.wait_for_selector("py-terminal")
        # Just a small check to confirm that the response was received
        assert "userId" in py_terminal.inner_text()
        self.assert_no_banners()

    @skip_worker("FIXME: js.document")
    def test_tutorials_py_config_fetch(self):
        # flake8: noqa
        self.pyscript_run(
            """
                <py-config>
                [[fetch]]
                from = "https://pyscript.net/examples/"
                files = ["utils.py"]
                [[fetch]]
                from = "https://gist.githubusercontent.com/FabioRosado/faba0b7f6ad4438b07c9ac567c73b864/raw/37603b76dc7ef7997bf36781ea0116150f727f44/"
                files = ["todo.py"]
                </py-config>
                <py-script>
                    from todo import add_task, add_task_event
                </py-script>
                <section>
                <div class="text-center w-full mb-8">
                    <h1 class="text-3xl font-bold text-gray-800 uppercase tracking-tight">
                        To Do List
                    </h1>
                </div>
                <div>
                    <input id="new-task-content" class="py-input" type="text">
                    <button id="new-task-btn" class="py-button" type="submit" py-click="add_task()">
                    Add task
                    </button>
                </div>
                <div id="list-tasks-container" class="flex flex-col-reverse mt-4"></div>
                <template id="task-template">
                    <section class="task py-li-element">
                    <label for="flex items-center p-2 ">
                        <input class="mr-2" type="checkbox">
                        <p class="m-0 inline"></p>
                    </label>
                    </section>
                </template
            """
        )

        todo_input = self.page.locator("input")
        submit_task_button = self.page.locator("button")

        todo_input.type("Fold laundry")
        submit_task_button.click()

        first_task = self.page.locator("#task-0")
        assert "Fold laundry" in first_task.inner_text()

        task_checkbox = first_task.locator("input")
        # Confirm that the new task isn't checked
        assert not task_checkbox.is_checked()

        # Let's mark it as done now
        task_checkbox.check()

        # Basic check that the task has the line-through class
        assert (
            '<p class="m-0 inline line-through">Fold laundry</p>'
            in first_task.inner_html()
        )
        self.assert_no_banners()

    def test_tutorials_py_config_interpreter(self):
        """Load a previous version of Pyodide"""
        self.pyscript_run(
            """
            <py-config>
                [[interpreters]]
                    src = "https://cdn.jsdelivr.net/pyodide/v0.23.0/full/pyodide.js"
                    name = "pyodide-0.23.0"
                    lang = "python"
            </py-config>
            <py-script>
                import pyodide
                print(pyodide.__version__)
            </py-script>
            """
        )

        py_terminal = self.page.wait_for_selector("py-terminal")
        assert "0.23.0" in py_terminal.inner_text()
        self.assert_no_banners()

    @skip_worker("FIXME: display()")
    def test_tutorials_writing_to_page(self):
        self.pyscript_run(
            """
            <div id="manual-write"></div>
            <button py-click="write_to_page()" id="manual">Say Hello</button>
            <div id="display-write"></div>
            <button py-click="display_to_div()" id="display">Say Things!</button>
            <div>
                <py-terminal>
            </div>
            <button py-click="print_to_page()" id="print">Print Things!</button>

            <py-script>
            def write_to_page():
                manual_div = Element("manual-write")
                manual_div.element.innerHTML = "<p><b>Hello World</b></p>"

            def display_to_div():
                display("I display things!", target="display-write")

            def print_to_page():
                print("I print things!")
            </py-script>
            """
        )
        btn_manual = self.page.wait_for_selector("#manual")
        btn_display = self.page.wait_for_selector("#display")
        btn_print = self.page.wait_for_selector("#print")

        btn_manual.click()
        manual_write_div = self.page.wait_for_selector("#manual-write")
        assert "<p><b>Hello World</b></p>" in manual_write_div.inner_html()

        btn_display.click()
        display_write_div = self.page.wait_for_selector("#display-write")
        assert "I display things!" in display_write_div.inner_text()

        btn_print.click()
        py_terminal = self.page.wait_for_selector("py-terminal")
        assert "I print things!" in py_terminal.inner_text()
        self.assert_no_banners()

    def test_guides_asyncio(self):
        self.pyscript_run(
            """
            <py-script>
                import asyncio

                async def main():
                    for i in range(3):
                        print(i)

                asyncio.ensure_future(main())
            </py-script>
            """
        )
        py_terminal = self.page.wait_for_selector("py-terminal")

        assert "0\n1\n2\n" in py_terminal.inner_text()

    @skip_worker("FIXME: js.document")
    def test_reference_pyterminal_xterm(self):
        self.pyscript_run(
            """
            <py-config>
                xterm = true
            </py-config>
            <py-script>
                print("HELLO!")
                import js
                import asyncio

                async def adjust_term_size(columns, rows):
                    xterm = await js.document.querySelector('py-terminal').xtermReady
                    xterm.resize(columns, rows)
                    print("test-done")

                asyncio.ensure_future(adjust_term_size(40, 10))
                </py-script>
            """
        )
        self.page.get_by_text("test-done").wait_for()

        py_terminal = self.page.locator("py-terminal")
        print(dir(py_terminal))
        print(type(py_terminal))
        assert py_terminal.evaluate("el => el.xterm.cols") == 40
        assert py_terminal.evaluate("el => el.xterm.rows") == 10

    @skip_worker(reason="FIXME: js.document (@when decorator)")
    def test_reference_when_simple(self):
        self.pyscript_run(
            """
            <button id="my_btn">Click Me to Say Hi</button>
            <py-script>
                from pyscript import when
                @when("click", selector="#my_btn")
                def say_hello():
                    print(f"Hello, world!")
            </py-script>
            """
        )
        self.page.get_by_text("Click Me to Say Hi").click()
        self.wait_for_console("Hello, world!")
        assert ("Hello, world!") in self.console.log.lines

    @skip_worker(reason="FIXME: js.document (@when decorator)")
    def test_reference_when_complex(self):
        self.pyscript_run(
            """
            <div id="container">
                <button>First</button>
                <button>Second</button>
                <button>Third</button>
            </div>
            <py-script>
                from pyscript import when
                import js

                @when("click", selector="#container button")
                def highlight(evt):
                    #Set the clicked button's background to green
                    evt.target.style.backgroundColor = 'green'

                    #Set the background of all buttons to red
                    other_buttons = (button for button in js.document.querySelectorAll('button') if button != evt.target)
                    for button in other_buttons:
                        button.style.backgroundColor = 'red'

                    print("set") # Test Only
            </py-script>
            """
        )

        def getBackgroundColor(locator):
            return locator.evaluate(
                "(element) => getComputedStyle(element).getPropertyValue('background-color')"
            )

        first_button = self.page.get_by_text("First")
        assert getBackgroundColor(first_button) == "rgb(239, 239, 239)"

        first_button.click()
        self.wait_for_console("set")

        assert getBackgroundColor(first_button) == "rgb(0, 128, 0)"
        assert getBackgroundColor(self.page.get_by_text("Second")) == "rgb(255, 0, 0)"
        assert getBackgroundColor(self.page.get_by_text("Third")) == "rgb(255, 0, 0)"

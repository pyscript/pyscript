from .support import PyScriptTest


class TestOutputHandling(PyScriptTest):
    # Source of a script to test the TargettedStdio functionality

    def test_targetted_stdio(self):
        self.pyscript_run(
            """
        <py-config>
            terminal = true
        </py-config>
        <py-terminal></py-terminal>
        <div id="container">
            <div id="first"></div>
            <div id="second"></div>
            <div id="third"></div>
        </div>
        <py-script output="first">print("first 1.")</py-script>
        <py-script output="second">print("second.")</py-script>
        <py-script output="third">print("third.")</py-script>
        <py-script output="first">print("first 2.")</py-script>
        <py-script>print("no output.")</py-script>
        """
        )

        # Check that page has desired parent/child structure, and that
        # Output divs are correctly located
        assert (container := self.page.locator("#container")) is not None
        assert (first_div := container.locator("#first")) is not None
        assert (second_div := container.locator("#second")) is not None
        assert (third_div := container.locator("#third")) is not None

        # Check that output ends up in proper div
        assert first_div.text_content() == "first 1.first 2."
        assert second_div.text_content() == "second."
        assert third_div.text_content() == "third."

        # Check that tag with no otuput attribute doesn't end up in container at all
        assert container.get_by_text("no output.").count() == 0

        # Check that all output ends up in py-terminal
        assert (
            self.page.locator("py-terminal").text_content()
            == "first 1.second.third.first 2.no output."
        )

        # Check that all output ends up in the dev console, in order
        last_index = -1
        for line in ["first 1.", "second.", "third.", "first 2.", "no output."]:
            assert (line_index := self.console.log.lines.index(line)) > -1
            assert line_index > last_index
            last_index = line_index

    def test_stdio_escape(self):
        # Test that text that looks like HTML tags is properly escaped in stdio
        self.pyscript_run(
            """
        <div id="first"></div>
        <py-script output="first">
            print("<p>Hello</p>")
            print('<img src="https://example.net">')
        </py-script>
        """
        )

        text = self.page.locator("#first").text_content()

        assert "<p>Hello</p>" in text
        assert '<img src="https://example.net">' in text

    def test_targetted_stdio_linebreaks(self):
        self.pyscript_run(
            """
        <div id="first"></div>
        <py-script output="first">
            print("one.")
            print("two.")
            print("three.")
        </py-script>

        <div id="second"></div>
        <py-script output="second">
            print("one.\\ntwo.\\nthree.")
        </py-script>

        <div id="third"></div>
        <py-script output="third">
            print("one.<br>")
        </py-script>
        """
        )

        # check line breaks at end of each input
        assert self.page.locator("#first").inner_html() == "one.<br>two.<br>three.<br>"

        # new lines are converted to line breaks
        assert self.page.locator("#second").inner_html() == "one.<br>two.<br>three.<br>"

        # No duplicate ending line breaks
        assert self.page.locator("#third").inner_html() == "one.<br>"

    def test_targetted_stdio_async(self):
        # Test the behavior of stdio capture in async contexts
        self.pyscript_run(
            """
        <py-script>
            import asyncio
            import js

            async def coro(value, delay):
                print(value)
                await asyncio.sleep(delay)
                js.console.log(f"DONE {value}")
        </py-script>

        <div id="first"></div>
        <py-script>
            asyncio.ensure_future(coro("first", 1))
        </py-script>

        <div id="second"></div>
        <py-script output="second">
            asyncio.ensure_future(coro("second", 1))
        </py-script>

        <div id="third"></div>
        <py-script output="third">
            asyncio.ensure_future(coro("third", 0))
        </py-script>

        <py-script output="third">
            asyncio.ensure_future(coro("DONE", 3))
        </py-script>
        """
        )

        self.wait_for_console("DONE DONE")

        # py-script tags without output parameter should not send
        # stdout to element
        assert self.page.locator("#first").text_content() == ""

        # py-script tags with output parameter not expected to send
        # std to element in coroutine
        assert self.page.locator("#second").text_content() == ""
        assert self.page.locator("#third").text_content() == ""

    def test_targetted_stdio_interleaved(self):
        # Test that synchronous writes to stdout are placed correctly, even
        # While interleaved with scheduling coroutines in the same tag
        self.pyscript_run(
            """
        <div id="good"></div>
        <div id="bad"></div>
        <py-script output="good">
            import asyncio
            import js

            async def coro_bad(value, delay):
                print(value)
                await asyncio.sleep(delay)

            print("one.")
            asyncio.ensure_future(coro_bad("badone.", 0.1))
            print("two.")
            asyncio.ensure_future(coro_bad("badtwo.", 0.2))
            print("three.")
            asyncio.ensure_future(coro_bad("badthree.", 0))
            asyncio.ensure_future(coro_bad("DONE", 1))
        </py-script>
        """
        )

        # No text should appear from coroutines
        assert self.page.locator("#bad").text_content() == ""

        # Three prints should appear from synchronous writes
        assert self.page.locator("#good").text_content() == "one.two.three."

        # Check that all output ends up in the dev console, in order
        last_index = -1
        for line in ["one.", "two.", "three.", "badthree.", "badone.", "badtwo."]:
            assert (line_index := self.console.log.lines.index(line)) > -1
            assert line_index > last_index

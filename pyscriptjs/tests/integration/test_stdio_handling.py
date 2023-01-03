from .support import PyScriptTest


class TestOutputHandling(PyScriptTest):
    # Source of a script to test the TargetedStdio functionality

    def test_targeted_stdio(self):
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
        assert (container := self.page.locator("#container")).count() > 0
        assert (first_div := container.locator("#first")).count() > 0
        assert (second_div := container.locator("#second")).count() > 0
        assert (third_div := container.locator("#third")).count() > 0

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

        self.assert_no_banners()

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

        self.assert_no_banners()

    def test_targeted_stdio_linebreaks(self):
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
            """
        )

        # check line breaks at end of each input
        assert self.page.locator("#first").inner_html() == "one.<br>two.<br>three.<br>"

        # new lines are converted to line breaks
        assert self.page.locator("#second").inner_html() == "one.<br>two.<br>three.<br>"

        self.assert_no_banners()

    def test_targeted_stdio_async(self):
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

        self.assert_no_banners()

    def test_targeted_stdio_interleaved(self):
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

        # Three prints should appear from synchronous writes
        assert self.page.locator("#good").text_content() == "one.two.three."

        # Check that all output ends up in the dev console, in order
        last_index = -1
        for line in ["one.", "two.", "three.", "badthree.", "badone.", "badtwo."]:
            assert (line_index := self.console.log.lines.index(line)) > -1
            assert line_index > last_index

        self.assert_no_banners()

    def test_targeted_stdio_dynamic_tags(self):
        # Test that creating py-script tags via Python still leaves
        # stdio targets working

        self.pyscript_run(
            """
            <div id="first"></div>
            <div id="second"></div>
            <py-script output="first">
                print("first.")

                import js
                tag = js.document.createElement("py-script")
                tag.innerText = "print('second.')"
                tag.setAttribute("output", "second")
                js.document.body.appendChild(tag)

                print("first.")
            </py-script>
            """
        )

        # Ensure second tag was added to page
        assert (second_div := self.page.locator("#second")).count() > 0

        # Ensure output when to correct locations
        assert self.page.locator("#first").text_content() == "first.first."
        assert second_div.text_content() == "second."

        self.assert_no_banners()

    def test_stdio_id_errors(self):
        # Test that using an ID not present on the page as the Output
        # Attribute creates exactly 1 warning banner
        self.pyscript_run(
            """
            <py-script output="not-on-page">
                print("bad.")
            </py-script>

            <div id="on-page"></div>
            <py-script>
                print("good.")
            </py-script>

            <py-script output="not-on-page">
                print("bad.")
            </py-script>
            """
        )

        banner = self.page.query_selector_all(".py-warning")
        assert len(banner) == 1
        banner_content = banner[0].inner_text()
        expected = (
            'Output = "not-on-page" does not match the id of any element on the page.'
        )

        assert banner_content == expected

    def test_stdio_stderr(self):
        # Test that stderr works, and routes to the same location as stdout
        self.pyscript_run(
            """
            <div id="first"></div>
            <py-script output="first">
                import sys
                print("one.", file=sys.stderr)
                print("two.")
            </py-script>
            """
        )

        assert self.page.locator("#first").text_content() == "one.two."
        self.assert_no_banners()

    def test_stdio_output_attribute_change(self):
        # If the user changes the 'output' attribute of a <py-script> tag mid-execution,
        # Output should no longer go to the selected div and a warning should appear
        self.pyscript_run(
            """
            <div id="first"></div>
            <py-script id="pyscript-tag" output="first">
                print("one.")

                # Change the 'output' attribute of this tag
                import js
                js.document.getElementById("pyscript-tag").setAttribute("output", "second")
                print("two.")
            </py-script>
            """
        )

        assert self.page.locator("#first").text_content() == "one."
        expected_alert_banner_msg = (
            'Output = "second" does not match the id of any element on the page.'
        )

        alert_banner = self.page.locator(".alert-banner")
        assert expected_alert_banner_msg in alert_banner.inner_text()

    def test_stdio_target_element_id_change(self):
        # If the user changes the ID of the targeted DOM element mid-execution,
        # Output should no longer go to the selected element and a warning should appear
        self.pyscript_run(
            """
            <div id="first"></div>
            <py-script id="pyscript-tag" output="first">
                print("one.")

                # Change the ID of the targeted DIV to something else
                import js
                js.document.getElementById("first").setAttribute("id", "second")
                print("two.")
            </py-script>
            """
        )

        # Note the ID of the div has changed by the time of this assert
        assert self.page.locator("#second").text_content() == "one."

        expected_alert_banner_msg = (
            'Output = "first" does not match the id of any element on the page.'
        )
        alert_banner = self.page.locator(".alert-banner")
        assert expected_alert_banner_msg in alert_banner.inner_text()

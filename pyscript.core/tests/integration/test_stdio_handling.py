import pytest

from .support import PyScriptTest, skip_worker

pytest.skip(reason="NEXT: entire stdio should be reviewed", allow_module_level=True)


class TestOutputHandling(PyScriptTest):
    # Source of a script to test the TargetedStdio functionality

    def test_targeted_stdio_solo(self):
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
            <script type="py" output="first">print("first 1.")</script>
            <script type="py" output="second">print("second.")</script>
            <script type="py" output="third">print("third.")</script>
            <script type="py" output="first">print("first 2.")</script>
            <script type="py">print("no output.")</script>
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
            <script type="py" output="first">
                print("<p>Hello</p>")
                print('<img src="https://example.net">')
            </script>
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
            <script type="py" output="first">
                print("one.")
                print("two.")
                print("three.")
            </script>

            <div id="second"></div>
            <script type="py" output="second">
                print("one.\\ntwo.\\nthree.")
            </script>
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
            <script type="py">
                import asyncio
                import js

                async def coro(value, delay):
                    print(value)
                    await asyncio.sleep(delay)
                    js.console.log(f"DONE {value}")
            </script>

            <div id="first"></div>
            <script type="py">
                asyncio.ensure_future(coro("first", 1))
            </script>

            <div id="second"></div>
            <script type="py" output="second">
                asyncio.ensure_future(coro("second", 1))
            </script>

            <div id="third"></div>
            <script type="py" output="third">
                asyncio.ensure_future(coro("third", 0))
            </script>

            <script type="py" output="third">
                asyncio.ensure_future(coro("DONE", 3))
            </script>
            """
        )

        self.wait_for_console("DONE DONE")

        # script tags without output parameter should not send
        # stdout to element
        assert self.page.locator("#first").text_content() == ""

        # script tags with output parameter not expected to send
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
            <script type="py" output="good">
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
            </script>
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

    @skip_worker("FIXME: js.document")
    def test_targeted_stdio_dynamic_tags(self):
        # Test that creating py-script tags via Python still leaves
        # stdio targets working

        self.pyscript_run(
            """
            <div id="first"></div>
            <div id="second"></div>
            <script type="py" output="first">
                print("first.")

                import js
                tag = js.document.createElement("py-script")
                tag.innerText = "print('second.')"
                tag.setAttribute("output", "second")
                js.document.body.appendChild(tag)

                print("first.")
            </script>
            """
        )

        # Ensure second tag was added to page
        assert (second_div := self.page.locator("#second")).count() > 0

        # Ensure output when to correct locations
        assert self.page.locator("#first").text_content() == "first.first."
        assert second_div.text_content() == "second."

        self.assert_no_banners()

    def test_stdio_stdout_id_errors(self):
        # Test that using an ID not present on the page as the Output
        # Attribute creates exactly 1 warning banner per missing id
        self.pyscript_run(
            """
            <script type="py" output="not-on-page">
                print("bad.")
            </script>

            <div id="on-page"></div>
            <script type="py">
                print("good.")
            </script>

            <script type="py" output="not-on-page">
                print("bad.")
            </script>
            """
        )

        banner = self.page.query_selector_all(".py-warning")
        assert len(banner) == 1
        banner_content = banner[0].inner_text()
        expected = (
            'output = "not-on-page" does not match the id of any element on the page.'
        )

        assert banner_content == expected

    def test_stdio_stderr_id_errors(self):
        # Test that using an ID not present on the page as the stderr
        # attribute creates exactly 1 warning banner per missing id
        self.pyscript_run(
            """
            <script type="py" stderr="not-on-page">
                import sys
                print("bad.", file=sys.stderr)
            </script>

            <div id="on-page"></div>
            <script type="py">
                print("good.", file=sys.stderr)
            </script>

            <script type="py" stderr="not-on-page">
                print("bad.", file=sys.stderr)
            </script>
            """
        )

        banner = self.page.query_selector_all(".py-warning")
        assert len(banner) == 1
        banner_content = banner[0].inner_text()
        expected = (
            'stderr = "not-on-page" does not match the id of any element on the page.'
        )

        assert banner_content == expected

    def test_stdio_stderr(self):
        # Test that stderr works, and routes to the same location as stdout
        # Also, script tags with the stderr attribute route to an additional location
        self.pyscript_run(
            """
            <div id="stdout-div"></div>
            <div id="stderr-div"></div>
            <script type="py" output="stdout-div" stderr="stderr-div">
                import sys
                print("one.", file=sys.stderr)
                print("two.")
            </script>
            """
        )

        assert self.page.locator("#stdout-div").text_content() == "one.two."
        assert self.page.locator("#stderr-div").text_content() == "one."
        self.assert_no_banners()

    @skip_worker("FIXME: js.document")
    def test_stdio_output_attribute_change(self):
        # If the user changes the 'output' attribute of a <script type="py"> tag mid-execution,
        # Output should no longer go to the selected div and a warning should appear
        self.pyscript_run(
            """
            <div id="first"></div>
            <div id="second"></div>
            <!-- There is no tag with id "third" -->
            <script type="py" id="pyscript-tag" output="first">
                print("one.")

                # Change the 'output' attribute of this tag
                import js
                this_tag = js.document.getElementById("pyscript-tag")

                this_tag.setAttribute("output", "second")
                print("two.")

                this_tag.setAttribute("output", "third")
                print("three.")
            </script>
            """
        )

        assert self.page.locator("#first").text_content() == "one."
        assert self.page.locator("#second").text_content() == "two."
        expected_alert_banner_msg = (
            'output = "third" does not match the id of any element on the page.'
        )

        alert_banner = self.page.locator(".alert-banner")
        assert expected_alert_banner_msg in alert_banner.inner_text()

    @skip_worker("FIXME: js.document")
    def test_stdio_target_element_id_change(self):
        # If the user changes the ID of the targeted DOM element mid-execution,
        # Output should no longer go to the selected element and a warning should appear
        self.pyscript_run(
            """
            <div id="first"></div>
            <div id="second"></div>
            <!-- There is no tag with id "third" -->
            <script type="py" id="pyscript-tag" output="first">
                print("one.")

                # Change the ID of the targeted DIV to something else
                import js
                target_tag = js.document.getElementById("first")

                # should fail and show banner
                target_tag.setAttribute("id", "second")
                print("two.")

                # But changing both the 'output' attribute and the id of the target
                # should work
                target_tag.setAttribute("id", "third")
                js.document.getElementById("pyscript-tag").setAttribute("output", "third")
                print("three.")
            </script>
            """
        )

        # Note the ID of the div has changed by the time of this assert
        assert self.page.locator("#third").text_content() == "one.three."

        expected_alert_banner_msg = (
            'output = "first" does not match the id of any element on the page.'
        )
        alert_banner = self.page.locator(".alert-banner")
        assert expected_alert_banner_msg in alert_banner.inner_text()

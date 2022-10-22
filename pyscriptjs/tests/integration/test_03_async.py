from .support import PyScriptTest


class TestAsync(PyScriptTest):
    def test_multiple_async(self):
        self.pyscript_run(
            """
        <py-script>
            import js
            import asyncio
            for i in range(3):
                js.console.log('A', i)
                await asyncio.sleep(0.1)
        </py-script>

        <py-script>
            import js
            import asyncio
            for i in range(3):
                js.console.log('B', i)
                await asyncio.sleep(0.1)
            js.console.log("async tadone")
        </py-script>
        """
        )
        self.wait_for_console("async tadone")
        assert self.console.log.lines == [
            "Python initialization complete",
            "A 0",
            "B 0",
            "A 1",
            "B 1",
            "A 2",
            "B 2",
            "async tadone",
        ]

    def test_multiple_async_multiple_display(self):
        self.pyscript_run(
            """
                <py-script id='pyA'>
                    import asyncio
                    for i in range(2):
                        display('A')
                        await asyncio.sleep(0)
                </py-script>

                <py-script id='pyB'>
                    import asyncio
                    for i in range(2):
                        display('B')
                        await asyncio.sleep(0)
                </py-script>
            """
        )
        inner_text = self.page.inner_text("html")
        assert "A\nB\nA\nB" in inner_text

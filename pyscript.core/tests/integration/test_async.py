import pytest

from .support import PyScriptTest, filter_inner_text, only_main


class TestAsync(PyScriptTest):
    # ensure_future() and create_task() should behave similarly;
    # we'll use the same source code to test both
    coroutine_script = """
        <script type="py">
        import js
        import asyncio
        js.console.log("first")
        async def main():
            await asyncio.sleep(1)
            js.console.log("third")
        asyncio.{func}(main())
        js.console.log("second")
        </script>
        """

    def test_asyncio_ensure_future(self):
        self.pyscript_run(self.coroutine_script.format(func="ensure_future"))
        self.wait_for_console("third")
        assert self.console.log.lines[-3:] == ["first", "second", "third"]

    def test_asyncio_create_task(self):
        self.pyscript_run(self.coroutine_script.format(func="create_task"))
        self.wait_for_console("third")
        assert self.console.log.lines[-3:] == ["first", "second", "third"]

    def test_asyncio_gather(self):
        self.pyscript_run(
            """
            <script type="py" id="pys">
            import asyncio
            import js
            from pyodide.ffi import to_js

            async def coro(delay):
                await asyncio.sleep(delay)
                return(delay)

            async def get_results():
                results = await asyncio.gather(*[coro(d) for d in range(3,0,-1)])
                js.console.log(str(results)) #Compare to string representation, not Proxy
                js.console.log("DONE")

            asyncio.ensure_future(get_results())
            </script>
            """
        )
        self.wait_for_console("DONE")
        assert self.console.log.lines[-2:] == ["[3, 2, 1]", "DONE"]

    @only_main
    def test_multiple_async(self):
        self.pyscript_run(
            """
        <script type="py">
            import js
            import asyncio
            async def a_func():
                for i in range(3):
                    js.console.log('A', i)
                    await asyncio.sleep(0.1)
            asyncio.ensure_future(a_func())
        </script>

        <script type="py">
            import js
            import asyncio
            async def b_func():
                for i in range(3):
                    js.console.log('B', i)
                    await asyncio.sleep(0.1)
                js.console.log('b func done')
            asyncio.ensure_future(b_func())
        </script>
        """
        )
        self.wait_for_console("b func done")
        assert self.console.log.lines == [
            "A 0",
            "B 0",
            "A 1",
            "B 1",
            "A 2",
            "B 2",
            "b func done",
        ]

    @only_main
    def test_multiple_async_multiple_display_targeted(self):
        self.pyscript_run(
            """
                <script type="py" id="pyA">
                    from pyscript import display
                    import js
                    import asyncio

                    async def a_func():
                        for i in range(2):
                            display(f'A{i}', target='pyA', append=True)
                            js.console.log("A", i)
                            await asyncio.sleep(0.1)
                    asyncio.ensure_future(a_func())

                </script>

                <script type="py" id="pyB">
                    from pyscript import display
                    import js
                    import asyncio

                    async def a_func():
                        for i in range(2):
                            display(f'B{i}', target='pyB', append=True)
                            js.console.log("B", i)
                            await asyncio.sleep(0.1)
                        js.console.log("B DONE")

                    asyncio.ensure_future(a_func())
                </script>
            """
        )
        self.wait_for_console("B DONE")
        inner_text = self.page.inner_text("html")
        assert "A0\nA1\nB0\nB1" in filter_inner_text(inner_text)

    def test_async_display_untargeted(self):
        self.pyscript_run(
            """
                <script type="py">
                    from pyscript import display
                    import asyncio
                    import js

                    async def a_func():
                        display('A')
                        await asyncio.sleep(1)
                        js.console.log("DONE")

                    asyncio.ensure_future(a_func())
                </script>
            """
        )
        self.wait_for_console("DONE")
        assert self.page.locator("script-py").inner_text() == "A"

    @only_main
    def test_sync_and_async_order(self):
        """
        The order of execution is defined as follows:
          1. first, we execute all the script tags in order
          2. then, we start all the tasks which were scheduled with create_task

        Note that tasks are started *AFTER* all py-script tags have been
        executed. That's why the console.log() inside mytask1 and mytask2 are
        executed after e.g. js.console.log("6").
        """
        src = """
                <script type="py">
                    import js
                    js.console.log("1")
                </script>

                <script type="py">
                    import asyncio
                    import js

                    async def mytask1():
                        js.console.log("7")
                        await asyncio.sleep(0)
                        js.console.log("9")

                    js.console.log("2")
                    asyncio.create_task(mytask1())
                    js.console.log("3")
                </script>

                <script type="py">
                    import js
                    js.console.log("4")
                </script>

                <script type="py">
                    import asyncio
                    import js

                    async def mytask2():
                        js.console.log("8")
                        await asyncio.sleep(0)
                        js.console.log("10")
                        js.console.log("DONE")

                    js.console.log("5")
                    asyncio.create_task(mytask2())
                    js.console.log("6")
                </script>
            """
        self.pyscript_run(src, wait_for_pyscript=False)
        self.wait_for_console("DONE")
        lines = self.console.log.lines[-11:]
        assert lines == ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "DONE"]

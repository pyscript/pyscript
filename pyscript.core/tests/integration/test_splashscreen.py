import pytest
from playwright.sync_api import expect

from .support import PyScriptTest, skip_worker

pytest.skip(reason="NEXT: Should we remove the splashscreen?", allow_module_level=True)


class TestSplashscreen(PyScriptTest):
    def test_autoshow_and_autoclose(self):
        """
        By default, we show the splashscreen and we close it when the loading is
        complete.

        XXX: this test is a bit fragile: now it works reliably because the
        startup is so slow that when we do expect(div).to_be_visible(), the
        splashscreen is still there. But in theory, if the startup become very
        fast, it could happen that by the time we arrive in python lang, it
        has already been removed.
        """
        self.pyscript_run(
            """
            <script type="py">
                print('hello pyscript')
            </script>
            """,
            wait_for_pyscript=False,
        )
        div = self.page.locator("py-splashscreen > div")
        expect(div).to_be_visible()
        expect(div).to_contain_text("Python startup...")
        assert "Python startup..." in self.console.info.text
        #
        # now we wait for the startup to complete
        self.wait_for_pyscript()
        #
        # and now the splashscreen should have been removed
        expect(div).to_be_hidden()
        assert self.page.locator("py-locator").count() == 0

        assert "hello pyscript" in self.console.log.lines

    def test_autoclose_false(self):
        self.pyscript_run(
            """
            <py-config>
                [splashscreen]
                autoclose = false
            </py-config>
            <script type="py">
                print('hello pyscript')
            </script>
            """,
        )
        div = self.page.locator("py-splashscreen > div")
        expect(div).to_be_visible()
        expect(div).to_contain_text("Python startup...")
        expect(div).to_contain_text("Startup complete")
        assert "hello pyscript" in self.console.log.lines

    def test_autoclose_loader_deprecated(self):
        self.pyscript_run(
            """
            <py-config>
                autoclose_loader = false
            </py-config>
            <script type="py">
                print('hello pyscript')
            </script>
            """,
        )
        warning = self.page.locator(".py-warning")
        inner_text = warning.inner_html()
        assert "The setting autoclose_loader is deprecated" in inner_text

        div = self.page.locator("py-splashscreen > div")
        expect(div).to_be_visible()
        expect(div).to_contain_text("Python startup...")
        expect(div).to_contain_text("Startup complete")
        assert "hello pyscript" in self.console.log.lines

    def test_splashscreen_disabled_option(self):
        self.pyscript_run(
            """
            <py-config>
                [splashscreen]
                enabled = false
            </py-config>

            <script type="py">
                def test():
                    print("Hello pyscript!")
                test()
            </script>
            """,
        )
        assert self.page.locator("py-splashscreen").count() == 0
        assert self.console.log.lines[-1] == "Hello pyscript!"
        py_terminal = self.page.wait_for_selector("py-terminal")
        assert py_terminal.inner_text() == "Hello pyscript!\n"

    @skip_worker("FIXME: js.document")
    def test_splashscreen_custom_message(self):
        self.pyscript_run(
            """
            <py-config>
                [splashscreen]
                    autoclose = false
            </py-config>

            <script type="py">
                from js import document

                splashscreen = document.querySelector("py-splashscreen")
                splashscreen.log("Hello, world!")
            </script>
            """,
        )

        splashscreen = self.page.locator("py-splashscreen")
        assert splashscreen.count() == 1
        assert "Hello, world!" in splashscreen.inner_text()

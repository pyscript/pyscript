from playwright.sync_api import expect

from .support import PyScriptTest


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
            <py-script>
                print('hello pyscript')
            </py-script>
            """,
            wait_for_pyscript=False,
        )
        div = self.page.locator("py-loader > div")
        expect(div).to_be_visible()
        expect(div).to_contain_text("Python startup...")
        #
        # now we wait for the startup to complete
        self.wait_for_pyscript()
        #
        # and now the splashscreen should have been removed
        expect(div).to_be_hidden()
        assert self.page.locator("py-locator").count() == 0
        #
        assert self.console.log.lines == [
            self.PY_COMPLETE,
            "hello pyscript",
        ]

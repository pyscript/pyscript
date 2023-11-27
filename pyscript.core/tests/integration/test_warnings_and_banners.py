import pytest

from .support import PyScriptTest, skip_worker


class TestWarningsAndBanners(PyScriptTest):
    # Test the behavior of generated warning banners

    def test_deprecate_loading_scripts_from_latest(self):
        # Use a script tag with an invalid output attribute to generate a warning, but only one
        self.pyscript_run(
            """
            <script type="py">
                print("whatever..")
            </script>
            """,
            extra_head='<script type="ignore-me" src="https://pyscript.net/latest/any-path-triggers-the-warning-anyway.js"></script>',
        )

        # wait for the banner to appear (we could have a page.locater call but for some reason
        # the worker takes to long to render on CI, since it's a test we can afford 2 calls)
        loc = self.page.wait_for_selector(".py-error")
        assert (
            loc.inner_text()
            == "Loading scripts from latest is deprecated and will be removed soon. Please use a specific version instead."
        )

        # Only one banner should appear
        loc = self.page.locator(".py-error")
        assert loc.count() == 1

    @pytest.mark.skip("NEXT: To check if behaviour is consistent with classic")
    def test_create_singular_warning(self):
        # Use a script tag with an invalid output attribute to generate a warning, but only one
        self.pyscript_run(
            """
            <script type="py" output="foo">
                print("one.")
                print("two.")
            </script>
            <script type="py" output="foo">
                print("three.")
            </script>
            """
        )

        loc = self.page.locator(".alert-banner")

        # Only one banner should appear
        assert loc.count() == 1
        assert (
            loc.text_content()
            == 'output = "foo" does not match the id of any element on the page.'
        )

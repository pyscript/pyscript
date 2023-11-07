import pytest

from .support import PyScriptTest, skip_worker

# pytest.skip(reason="NEXT: Restore the banner", allow_module_level=True)


class TestWarningsAndBanners(PyScriptTest):
    # Test the behavior of generated warning banners

    @skip_worker("TODO: unsure if notifications bubble up in workers or not. Skipping for now")
    def test_deprecate_loading_scripts_from_latest(self):
        # Use a script tag with an invalid output attribute to generate a warning, but only one
        self.pyscript_run(
            """
            <script type="py">
                print("whatever..")
            </script>
            """,
            extra_pre_head='<script type="module" src="https://pyscript.net/latest/core.js"></script>'
        )

        loc = self.page.locator(".py-error")

        # Only one banner should appear
        assert loc.count() == 1
        assert (
            loc.text_content()
            == 'Loading scripts from latest is deprecated and will be removed soon. Please use a specific version instead.'
        )

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

import pytest

from .support import PyScriptTest

pytest.skip(reason="NEXT: Restore the banner", allow_module_level=True)


class TestWarningsAndBanners(PyScriptTest):
    # Test the behavior of generated warning banners

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

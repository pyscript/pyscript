import pytest

from .support import PyScriptTest

pytest.skip(reason="FIXME: Restore the banner", allow_module_level=True)


class TestWarningsAndBanners(PyScriptTest):
    # Test the behavior of generated warning banners

    def test_create_singular_warning(self):
        # Use a script tag with an invalid output attribute to generate a warning, but only one
        self.pyscript_run(
            """
            <py-script output="foo">
                print("one.")
                print("two.")
            </py-script>
            <py-script output="foo">
                print("three.")
            </py-script>
            """
        )

        loc = self.page.locator(".alert-banner")

        # Only one banner should appear
        assert loc.count() == 1
        assert (
            loc.text_content()
            == 'output = "foo" does not match the id of any element on the page.'
        )

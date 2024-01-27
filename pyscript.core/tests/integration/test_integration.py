from .support import PyScriptTest, with_execution_thread

@with_execution_thread(None)
class TestSmokeTests(PyScriptTest):
    """
    Each example requires the same three tests:

        - Test that the initial markup loads properly (currently done by
          testing the <title> tag's content)
        - Testing that pyscript is loading properly
        - Testing that the page contains appropriate content after rendering
    """

    def test_pydom(self):
        # Test the full pydom test suite by running it in the browser
        self.goto("test/pyscript_dom/index.html?-v&-s")
        assert self.page.title() == "PyDom Test Suite"

        # wait for the test suite to finish
        self.wait_for_console('============================= test session starts ==============================')

        self.assert_no_banners()

        results =  self.page.inner_html("#tests-terminal")
        assert results
        assert "PASSED" in results
        assert "FAILED" not in results

import pytest

from .support import PyScriptTest, with_execution_thread


# these tests don't need to run in 'main' and 'worker' modes: the workers are
# already tested explicitly by some of them (see e.g.
# test_script_type_py_worker_attribute)
@with_execution_thread(None)
class TestScriptTypePyScript(PyScriptTest):
    def test_display_line_break(self):
        self.pyscript_run(
            r"""
            <script type="py">
                from pyscript import display
                display('hello\nworld')
            </script>
            """
        )
        text_content = self.page.locator("script-py").text_content()
        assert "hello\nworld" == text_content

    def test_amp(self):
        self.pyscript_run(
            r"""
            <script type="py">
                from pyscript import display
                display('a &amp; b')
            </script>
            """
        )
        text_content = self.page.locator("script-py").text_content()
        assert "a &amp; b" == text_content

    def test_quot(self):
        self.pyscript_run(
            r"""
            <script type="py">
                from pyscript import display
                display('a &quot; b')
            </script>
            """
        )
        text_content = self.page.locator("script-py").text_content()
        assert "a &quot; b" == text_content

    def test_lt_gt(self):
        self.pyscript_run(
            r"""
            <script type="py">
                from pyscript import display
                display('< &lt; &gt; >')
            </script>
            """
        )
        text_content = self.page.locator("script-py").text_content()
        assert "< &lt; &gt; >" == text_content

    def test_dynamically_add_script_type_py_tag(self):
        self.pyscript_run(
            """
            <script>
                function addPyScriptTag() {
                    let tag = document.createElement('script');
                    tag.type = 'py';
                    tag.textContent = "print('hello world')";
                    document.body.appendChild(tag);
                }
                addPyScriptTag();
            </script>
            """
        )
        # please note the test here was on timeout
        # incapable of finding a <button> after the script
        self.page.locator("script-py")

        assert self.console.log.lines[-1] == "hello world"

    def test_script_type_py_src_attribute(self):
        self.writefile("foo.py", "print('hello from foo')")
        self.pyscript_run(
            """
            <script type="py" src="foo.py"></script>
            """
        )
        assert self.console.log.lines[-1] == "hello from foo"

    def test_script_type_py_worker_attribute(self):
        self.writefile("foo.py", "print('hello from foo')")
        self.pyscript_run(
            """
            <script type="py" src="foo.py" worker></script>
            """
        )
        assert self.console.log.lines[-1] == "hello from foo"

    @pytest.mark.skip("FIXME: output attribute is not implemented")
    def test_script_type_py_output_attribute(self):
        self.pyscript_run(
            """
            <div id="first"></div>
            <script type="py" output="first">
                print("<p>Hello</p>")
            </script>
            """
        )
        text = self.page.locator("#first").text_content()
        assert "<p>Hello</p>" in text

    @pytest.mark.skip("FIXME: stderr attribute is not implemented")
    def test_script_type_py_stderr_attribute(self):
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

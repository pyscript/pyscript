from .support import PyScriptTest, skip_worker


class TestScriptTypePyScript(PyScriptTest):
    @skip_worker("FIXME: js.document")
    def test_display_line_break(self):
        self.pyscript_run(
            r"""
            <script type="py-script">
                display('hello\nworld')
            </script>
            """
        )
        text_content = self.page.locator("py-script-tag").text_content()
        assert "hello\nworld" == text_content

    @skip_worker("FIXME: js.document")
    def test_amp(self):
        self.pyscript_run(
            r"""
            <script type="py-script">
                display('a &amp; b')
            </script>
            """
        )
        text_content = self.page.locator("py-script-tag").text_content()
        assert "a &amp; b" == text_content

    @skip_worker("FIXME: js.document")
    def test_quot(self):
        self.pyscript_run(
            r"""
            <script type="py-script">
                display('a &quot; b')
            </script>
            """
        )
        text_content = self.page.locator("py-script-tag").text_content()
        assert "a &quot; b" == text_content

    @skip_worker("FIXME: js.document")
    def test_lt_gt(self):
        self.pyscript_run(
            r"""
            <script type="py-script">
                display('< &lt; &gt; >')
            </script>
            """
        )
        text_content = self.page.locator("py-script-tag").text_content()
        assert "< &lt; &gt; >" == text_content

    @skip_worker("FIXME: js.document")
    def test_dynamically_add_script_type_py_tag(self):
        self.pyscript_run(
            """
            <script>
                function addPyScriptTag() {
                    let tag = document.createElement('script');
                    tag.type = 'py-script';
                    tag.textContent = "print('hello world')";
                    document.body.appendChild(tag);
                }
            </script>
            <button onclick="addPyScriptTag()">Click me</button>
            """
        )
        self.page.locator("button").click()

        self.page.wait_for_selector("py-terminal")
        assert self.console.log.lines[-1] == "hello world"

    @skip_worker("FIXME: js.document")
    def test_script_type_py_src_attribute(self):
        self.writefile("foo.py", "print('hello from foo')")
        self.pyscript_run(
            """
            <script type="py-script" src="foo.py"></script>
            """
        )
        assert self.console.log.lines[-1] == "hello from foo"

    @skip_worker("FIXME: js.document")
    def test_script_type_py_output_attribute(self):
        self.pyscript_run(
            """
            <div id="first"></div>
            <script type="py-script" output="first">
                print("<p>Hello</p>")
            </script>
            """
        )
        text = self.page.locator("#first").text_content()
        assert "<p>Hello</p>" in text

    @skip_worker("FIXME: js.document")
    def test_script_type_py_stderr_attribute(self):
        self.pyscript_run(
            """
            <div id="stdout-div"></div>
            <div id="stderr-div"></div>
            <py-script output="stdout-div" stderr="stderr-div">
                import sys
                print("one.", file=sys.stderr)
                print("two.")
            </py-script>
            """
        )
        assert self.page.locator("#stdout-div").text_content() == "one.two."
        assert self.page.locator("#stderr-div").text_content() == "one."

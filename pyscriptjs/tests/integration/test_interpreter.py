from .support import PyScriptTest


class TestInterpreterAccess(PyScriptTest):
    """Test accessing Python objects from JS via pyscript.interpreter"""

    def test_interpreter_python_access(self):
        self.pyscript_run(
            """
            <py-script>
                x = 1
                def py_func():
                    return 2
            </py-script>
            """
        )

        self.page.add_script_tag(
            content="""
        console.log(`x is ${pyscript.interpreter.globals.get('x')}`);
        console.log(`py_func() returns ${pyscript.interpreter.globals.get('py_func')()}`);
        """
        )

        assert self.console.log.lines[0] == self.PY_COMPLETE
        assert self.console.log.lines[-2:] == [
            "x is 1",
            "py_func() returns 2",
        ]

    def test_interpreter_script_execution(self):
        """Test running Python code from js via pyscript.interpreter"""
        self.pyscript_run("")

        self.page.add_script_tag(
            content="""
        const interface = pyscript.interpreter._remote.interface;
        interface.runPython('print("Interpreter Ran This")');
        """
        )
        expected_message = "Interpreter Ran This"
        assert self.console.log.lines[0] == self.PY_COMPLETE
        assert self.console.log.lines[-1] == expected_message

        py_terminal = self.page.wait_for_selector("py-terminal")
        assert py_terminal.text_content() == expected_message

    def test_backward_compatibility_runtime_script_execution(self):
        """Test running Python code from js via pyscript.runtime"""
        self.pyscript_run("")

        self.page.add_script_tag(
            content="""
        const interface = pyscript.runtime._remote.interpreter;
        interface.runPython('print("Interpreter Ran This")');
        """
        )
        expected_message = "Interpreter Ran This"
        assert self.console.log.lines[0] == self.PY_COMPLETE
        assert self.console.log.lines[-1] == expected_message

        py_terminal = self.page.wait_for_selector("py-terminal")
        assert py_terminal.text_content() == expected_message

    def test_backward_compatibility_runtime_python_access(self):
        """Test accessing Python objects from JS via pyscript.runtime"""
        self.pyscript_run(
            """
            <py-script>
                x = 1
                def py_func():
                    return 2
            </py-script>
            """
        )

        self.page.add_script_tag(
            content="""
        console.log(`x is ${pyscript.interpreter.globals.get('x')}`);
        console.log(`py_func() returns ${pyscript.interpreter.globals.get('py_func')()}`);
        """
        )

        assert self.console.log.lines[0] == self.PY_COMPLETE
        assert self.console.log.lines[-2:] == [
            "x is 1",
            "py_func() returns 2",
        ]

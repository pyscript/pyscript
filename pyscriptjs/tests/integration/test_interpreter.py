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
        const interface = pyscript.interpreter.interface;
        interface.runPython('console.log("Interpreter Ran This")');
        """
        )
        assert self.console.log.lines[0] == self.PY_COMPLETE
        assert self.console.log.lines[-1] == "Interpreter Ran This"

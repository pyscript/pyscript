from .support import PyScriptTest


class TestRuntimeAccess(PyScriptTest):
    """Test accessing Python objects from JS via pyscript.runtime"""

    def test_runtime_python_access(self):
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
        console.log(`x is ${pyscript.runtime.globals.get('x')}`);
        console.log(`py_func() returns ${pyscript.runtime.globals.get('py_func')()}`);
        """
        )

        assert self.console.log.lines == [
            self.PY_COMPLETE,
            "x is 1",
            "py_func() returns 2",
        ]

    def test_runtime_script_execution(self):
        """Test running Python code from js via pyscript.runtime"""
        self.pyscript_run("")

        self.page.add_script_tag(
            content="""
        const interpreter = pyscript.runtime.interpreter;
        interpreter.runPython('console.log("Interpreter Ran This")');
        """
        )

        assert self.console.log.lines == [self.PY_COMPLETE, "Interpreter Ran This"]

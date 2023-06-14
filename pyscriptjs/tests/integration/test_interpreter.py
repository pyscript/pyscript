from .support import PyScriptTest, skip_worker


class TestInterpreterAccess(PyScriptTest):
    """Test accessing Python objects from JS via pyscript.interpreter"""

    @skip_worker("WONTFIX: used without synclink to avoid awaits")
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

        self.run_js(
            """
            const x = pyscript.interpreter.globals.get('x');
            const py_func = pyscript.interpreter.globals.get('py_func');
            const py_func_res = py_func();
            console.log(`x is ${x}`);
            console.log(`py_func() returns ${py_func_res}`);
            """
        )
        assert self.console.log.lines[-2:] == [
            "x is 1",
            "py_func() returns 2",
        ]

    @skip_worker("WONTFIX: used without synclink")
    def test_interpreter_script_execution(self):
        """Test running Python code from js via pyscript.interpreter"""
        self.pyscript_run("")

        self.run_js(
            """
            const interface = pyscript.interpreter.interface;
            await interface.runPython('print("Interpreter Ran This")');
            """
        )

        expected_message = "Interpreter Ran This"
        assert self.console.log.lines[-1] == expected_message

        py_terminal = self.page.wait_for_selector("py-terminal")
        assert py_terminal.text_content() == expected_message

    @skip_worker("WONTFIX: used without synclink")
    def test_backward_compatibility_runtime_script_execution(self):
        """Test running Python code from js via pyscript.runtime"""
        self.pyscript_run("")

        self.run_js(
            """
            const interface = pyscript.runtime.interpreter;
            await interface.runPython('print("Interpreter Ran This")');
            """
        )

        expected_message = "Interpreter Ran This"
        assert self.console.log.lines[-1] == expected_message

        py_terminal = self.page.wait_for_selector("py-terminal")
        assert py_terminal.text_content() == expected_message

    @skip_worker("WONTFIX: used without synclink to avoid awaits")
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

        self.run_js(
            """
            const x = pyscript.runtime.globals.get('x');
            const py_func = pyscript.runtime.globals.get('py_func');
            const py_func_res = py_func();
            console.log(`x is ${x}`);
            console.log(`py_func() returns ${py_func_res}`);
            """
        )

        assert self.console.log.lines[-2:] == [
            "x is 1",
            "py_func() returns 2",
        ]

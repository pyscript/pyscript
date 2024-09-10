import pytest

from .support import PyScriptTest

pytest.skip(
    reason="NEXT: pyscript API changed doesn't expose pyscript to window anymore",
    allow_module_level=True,
)


class TestInterpreterAccess(PyScriptTest):
    """Test accessing Python objects from JS via pyscript.interpreter"""

    def test_interpreter_python_access(self):
        self.pyscript_run(
            """
            <script type="py">
                x = 1
                def py_func():
                    return 2
            </script>
            """
        )

        self.run_js(
            """
            const x = await pyscript.interpreter.globals.get('x');
            const py_func = await pyscript.interpreter.globals.get('py_func');
            const py_func_res = await py_func();
            console.log(`x is ${x}`);
            console.log(`py_func() returns ${py_func_res}`);
            """
        )
        assert self.console.log.lines[-2:] == [
            "x is 1",
            "py_func() returns 2",
        ]

    def test_interpreter_script_execution(self):
        """Test running Python code from js via pyscript.interpreter"""
        self.pyscript_run("")

        self.run_js(
            """
            const interface = pyscript.interpreter._remote.interface;
            await interface.runPython('print("Interpreter Ran This")');
            """
        )

        expected_message = "Interpreter Ran This"
        assert self.console.log.lines[-1] == expected_message

        py_terminal = self.page.wait_for_selector("py-terminal")
        assert py_terminal.text_content() == expected_message

    def test_backward_compatibility_runtime_script_execution(self):
        """Test running Python code from js via pyscript.runtime"""
        self.pyscript_run("")

        self.run_js(
            """
            const interface = pyscript.runtime._remote.interpreter;
            await interface.runPython('print("Interpreter Ran This")');
            """
        )

        expected_message = "Interpreter Ran This"
        assert self.console.log.lines[-1] == expected_message

        py_terminal = self.page.wait_for_selector("py-terminal")
        assert py_terminal.text_content() == expected_message

    def test_backward_compatibility_runtime_python_access(self):
        """Test accessing Python objects from JS via pyscript.runtime"""
        self.pyscript_run(
            """
            <script type="py">
                x = 1
                def py_func():
                    return 2
            </script>
            """
        )

        self.run_js(
            """
            const x = await pyscript.interpreter.globals.get('x');
            const py_func = await pyscript.interpreter.globals.get('py_func');
            const py_func_res = await py_func();
            console.log(`x is ${x}`);
            console.log(`py_func() returns ${py_func_res}`);
            """
        )

        assert self.console.log.lines[-2:] == [
            "x is 1",
            "py_func() returns 2",
        ]

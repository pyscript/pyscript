import builtins
import sys

import js
from pyscript import sync


class PyTerminal:
    def write(self, line):
        sync.pyterminal_write(line)

    def input(self, prompt):
        return sync.pyterminal_readline(prompt)


PY_TERMINAL = None


def init():
    global PY_TERMINAL
    PY_TERMINAL = PyTerminal()
    sys.stdout = sys.stderr = PY_TERMINAL
    builtins.input = PY_TERMINAL.input

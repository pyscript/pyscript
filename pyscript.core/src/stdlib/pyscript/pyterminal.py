import builtins
import sys

import js
from pyscript import RUNNING_IN_WORKER, document, sync


class _PyTerminal:
    def write(self, line):
        sync.pyterminal_write(line)

    def input(self, prompt):
        return sync.pyterminal_readline(prompt)


PY_TERMINAL = None


def init():
    global PY_TERMINAL
    # we currently support only one terminal
    # and it's interactive only within a worker tag
    if not PY_TERMINAL and RUNNING_IN_WORKER and document.querySelector("py-terminal"):
        PY_TERMINAL = _PyTerminal()
        sys.stdout = sys.stderr = PY_TERMINAL
        builtins.input = PY_TERMINAL.input

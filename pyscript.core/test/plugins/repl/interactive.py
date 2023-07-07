import sys
from code import InteractiveConsole


class xtermInteractive(InteractiveConsole):
    def __init__(self, term, locals=None, filename="<console>"):
        super().__init__(locals, filename)
        self.term = term
        self.line = ""
        self.more = 0

    def write(self, data):
        self.term.write(data)

    def flush(self):
        # Makes this object file-like to act as sys.stdout and sys.stderr
        pass

    def beginInteraction(self, banner=None, exitmsg=None):
        try:
            sys.ps1
        except AttributeError:
            sys.ps1 = ">>> "
        try:
            sys.ps2
        except AttributeError:
            sys.ps2 = "... "

        cprt = 'Type "help", "copyright", "credits" or "license" for more information.'
        if banner is None:
            self.write("Python %s on %s\n%s\n" % (sys.version, sys.platform, cprt))
        elif banner:
            self.write(f"{str(banner)}")

        sys.stdout = self
        sys.stderr = self

        self.more = 0
        self.write(sys.ps1)

    def endInteraction(self):
        self.write("The REPL cannot be killed")  # Todo make this functional

    # onKey(e: {key: string, domEvent: KeyboardEvent}, f: void)
    def onKey(self, event, f):
        # js.console.log(f"Got key {event.key}")
        # js.console.log(to_js(event.domEvent))
        if event.key == "\r":  # Enter
            self.write("\n")
            self.more = self.push(self.line)
            self.line = ""
            if self.more:
                self.write(sys.ps2)
            else:
                self.write(sys.ps1)
        elif event.domEvent.ctrlKey and event.domEvent.key == "d":
            self.endInteraction()
        elif event.domEvent.key == "Backspace":
            if len(self.line):
                self.line = self.line[:-1]
                self.write("\x1b[D \x1b[D")
        else:
            if len(event.key) == 1:
                self.line += event.key
            self.write(event.key)

    def runcode(self, code):
        """Execute a code object.

        When an exception occurs, self.showtraceback() is called to
        display a traceback.  All exceptions are caught except
        SystemExit, which is reraised.

        A note about KeyboardInterrupt: this exception may occur
        elsewhere in this code, and may not always be caught.  The
        caller should be prepared to deal with it.

        This version is slightly modified from
        InteractiveInterpreter.runcode(), in that it runs with the
        Pyodide global scope. It is used by runsource(), which is used
        by push()

        """
        try:
            exec(code, globals(), locals())
        except SystemExit:
            raise
        except:
            self.showtraceback()


xtermInteractive

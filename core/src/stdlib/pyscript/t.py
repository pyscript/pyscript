__all__ = ["t"]


class Interpolation:
    def __init__(self, expr):
        self.value = eval(expr)
        self.expr = expr
        self.format_spec = ""
        self.conv = None


class Template:
    def __init__(self, args):
        self.args = args
        self.strings = args[::2]
        self.values = [i.value for i in args[1::2]]
        self.interpolations = args[1::2]

    def __str__(self):
        out = []
        i = 0
        for arg in self.args:
            out.append(i % 2 and str(arg.value) or arg)
            i += 1
        return "".join(out)


drop = lambda s: s.replace("{{", "\x01").replace("}}", "\x02")
add = lambda s: s.replace("\x01", "{{").replace("\x02", "}}")


# PEP750 shim as function for MicroPython or Pyodide until it lands
def t(content):
    # sanitize brackets (drop double brackets)
    content = drop(content)
    # fail if the format string is not balanced
    if content.count("{") != content.count("}"):
        raise ValueError("single '{' or '}' encountered in format string")
    # find outer most interesting curly braces
    l = len(content)
    i = 0
    j = 0
    start = 0
    opened = 0
    args = []
    for c in content:
        if c == "{":
            if opened == 0:
                j = i
            opened += 1
        elif c == "}":
            opened -= 1
            if opened == 0:
                args.append(add(content[start:j:]))
                args.append(Interpolation(add(content[j + 1 : i :])))
                start = i + 1
        i += 1
    args.append(add(content[start::]))
    return Template(tuple(args))

import js


def as_bytearray(buffer):
    ui8a = js.Uint8Array.new(buffer)
    size = ui8a.length
    ba = bytearray(size)
    for i in range(0, size):
        ba[i] = ui8a[i]
    return ba


class NotSupported:
    """
    Small helper that raises exceptions if you try to get/set any attribute on
    it.
    """

    def __init__(self, name, error):
        object.__setattr__(self, "name", name)
        object.__setattr__(self, "error", error)

    def __repr__(self):
        return f"<NotSupported {self.name} [{self.error}]>"

    def __getattr__(self, attr):
        raise AttributeError(self.error)

    def __setattr__(self, attr, value):
        raise AttributeError(self.error)

    def __call__(self, *args):
        raise TypeError(self.error)

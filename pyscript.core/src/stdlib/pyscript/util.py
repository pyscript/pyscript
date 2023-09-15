class NotSupported:
    """
    Small helper that raises exceptions if you try to get/set any attribute on
    it.
    """

    def __init__(self, name, error):
        # we set attributes using self.__dict__ to bypass the __setattr__
        self.__dict__['name'] = name
        self.__dict__['error'] = error

    def __repr__(self):
        return f'<NotSupported {self.name} [{self.error}]>'

    def __getattr__(self, attr):
        raise AttributeError(self.error)

    def __setattr__(self, attr, value):
        raise AttributeError(self.error)

    def __call__(self, *args):
        raise TypeError(self.error)

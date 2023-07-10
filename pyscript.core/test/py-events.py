def print_version(event):
    import sys

    print(event.type)
    print(sys.version)


class Printer:
    def version(self, event):
        print_version(event)


printer = Printer()

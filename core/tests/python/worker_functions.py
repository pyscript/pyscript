"""
Numpty test code to run in a worker for pyscript.workers module tests.
"""


def add(a, b):
    return a + b


def multiply(a, b):
    return a * b


def get_message():
    return "Hello from worker"


def dijkstra_path(g, a, b):
    from networkx import from_dict_of_dicts, dijkstra_path
    return dijkstra_path(from_dict_of_dicts(g), a, b)


__export__ = ["add", "multiply", "get_message", "dijkstra_path"]

"""
Numpty test code to run in a worker for pyscript.workers module tests.
"""
from math import log, fmod
from operator import mul, pow


def add(a, b):
    return a + b


def multiply(a, b):
    return a * b


def get_message():
    return "Hello from worker"


def dijkstra_path(g, a, b):
    from networkx import from_dict_of_dicts, dijkstra_path, NetworkXNoPath
    try:
        return dijkstra_path(from_dict_of_dicts(g), a, b)
    except NetworkXNoPath:
        return None

def _some_table(oper, a, b):
    ret = []
    for x in range(a):
        xs = []
        for y in range(b):
            try:
                xs.append(oper(a, b))
            except:
                xs.append(None)
        ret.append(xs)
    return ret

def times_table(a, b):
    return _some_table(mul, a, b)

def power_table(a, b):
    return _some_table(pow, a, b)

def log_table(a, b):
    return _some_table(log, a, b)

def mod_table(a, b):
    return _some_table(fmod, a, b)

__export__ = ["add", "multiply", "get_message", "dijkstra_path", "times_table", "power_table", "log_table"]

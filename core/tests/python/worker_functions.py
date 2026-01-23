"""
Numpty test code to run in a worker for pyscript.workers module tests.
"""


def add(a, b):
    return a + b


def multiply(a, b):
    return a * b


def get_message():
    return "Hello from worker"


__export__ = ["add", "multiply", "get_message"]

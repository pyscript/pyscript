"""
Numpty test code to run in a worker for pyscript.workers module tests.
"""
from heapq import heappush, heappop
from itertools import count
from math import log, fmod
from operator import mul, pow

from pyscript import sync


def add(a, b):
    return a + b


def multiply(a, b):
    return a * b


def get_message():
    return "Hello from worker"

graph_dict = {}

def dijkstra_path(source, target):
    # Based on the implementation in networkx
    pred_dict = {}
    paths = {source: [source]}
    dist = {}
    seen = {source: 0}
    c = count()
    fringe = []
    heappush(fringe, (0, next(c), source))
    while fringe:
        (dist_v, _, v) = heappop(fringe)
        if v in dist:
            continue
        dist[v] = dist_v
        if v == target:
            break
        for u, e in graph_dict[v].items():
            vu_dist = dist_v + 1
            if u in dist:
                u_dist = dist[u]
                if vu_dist < u_dist:
                    return ValueError("Contradictory paths found:", "negative weights?")
                elif vu_dist == u_dist:
                    pred_dict[u].append(v)
            elif u not in seen or vu_dist < seen[u]:
                seen[u] = vu_dist
                heappush(fringe, (vu_dist, next(c), u))
                pred_dict[u] = [v]
    path = paths[target] = []
    while (current_preds := pred_dict.get(path[-1])) is not None:
        path.append(current_preds[0])
    path.reverse()
    return path

def upd_graph(graph_d):
    global graph_dict
    graph_dict = graph_d

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

__export__ = ["add", "multiply", "get_message", "upd_graph", "dijkstra_path", "times_table", "power_table", "log_table", "mod_table"]

"""
Numpty test code to run in a worker for pyscript.workers module tests.
"""

def add(a, b):
    return a + b

def multiply(a, b):
    return a * b

def get_message():
    return "Hello from worker"


graph_dict = {}


cheats = {}


def set_cheats(c):
    cheats.clear()
    cheats.update(eval(c))
    return True


def cheating_dijkstra_path(source, target):
    return repr(cheats[source, target])


def dijkstra_path(graph_d, source, target):
    # Based on the implementation in networkx
    from heapq import heappush, heappop
    from itertools import count

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
        for u, e in graph_d[v].items():
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
    path = paths[target] = [target]
    while (current_preds := pred_dict.get(path[-1])) is not None:
        path.append(current_preds[0])
    path.reverse()
    return path


def dijkstra_path_de_novo(graph_str, source, target):
    try:
        return repr(dijkstra_path(eval(graph_str), source, target))
    except Exception as ex:
        return repr(ex)


def dijkstra_path_persistent(source, target):
    global graph_dict
    return repr(dijkstra_path(graph_dict, source, target))


def upd_graph(graph_d_str):
    global graph_dict
    graph_dict.clear()
    graph_dict.update(eval(graph_d_str))
    return True


__export__ = [
    "add",
    "multiply",
    "get_message",
    "upd_graph",
    "set_cheats",
    "cheating_dijkstra_path",
    "dijkstra_path_de_novo",
    "dijkstra_path_persistent",
]


tracker = 0


def increment_count(e):
    global tracker
    tracker = tracker+1
    pyscript.write("lblmsg", "Current Count : {}".format(tracker))


def increment_count_by_five(e):
    global tracker
    tracker = tracker+5
    pyscript.write("lblmsg", "Current Count : {}".format(tracker))


def increment_count_by_ten(e):
    global tracker
    tracker = tracker+10
    pyscript.write("lblmsg", "Current Count : {}".format(tracker))


def decrement_count(e):
    global tracker
    tracker = tracker-1
    pyscript.write("lblmsg", "Current Count : {}".format(tracker))


def reset_count(e):
    global tracker
    tracker = 0
    pyscript.write("lblmsg", "Current Count : {}".format(tracker))

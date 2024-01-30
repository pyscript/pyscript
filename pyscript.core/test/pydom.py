import random
import time
from datetime import datetime as dt

from pyscript import display, when
from pyweb import pydom


@when("click", "#just-a-button")
def on_click():
    try:
        timenow = dt.now()
    except NotImplementedError:
        # In this case we assume it's not implemented because we are using MycroPython
        tnow = time.localtime()
        tstr = "{:02d}/{:02d}/{:04d} {:02d}:{:02d}:{:02d}"
        timenow = tstr.format(tnow[2], tnow[1], tnow[0], *tnow[2:])

    display(f"Hello from PyScript, time is: {timenow}", append=False, target="result")


@when("click", "#color-button")
def on_color_click(event):
    btn = pydom["#result"]
    btn.style["background-color"] = f"#{random.randrange(0x1000000):06x}"


@when("click", "#color-reset-button")
def reset_color(*args, **kwargs):
    pydom["#result"].style["background-color"] = "white"


# btn_reset = pydom["#color-reset-button"][0].when('click', reset_color)

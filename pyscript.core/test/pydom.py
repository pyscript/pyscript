import random
from datetime import datetime as dt

from pyscript import display
from pyweb import pydom
from pyweb.base import when


@when("click", "#just-a-button")
def on_click(event):
    print(f"Hello from Python! {dt.now()}")
    display(f"Hello from Python! {dt.now()}", append=False, target="result")


@when("click", "#color-button")
def on_color_click(event):
    print("1")
    btn = pydom["#result"]
    print("2")
    btn.style["background-color"] = f"#{random.randrange(0x1000000):06x}"


def reset_color():
    pydom["#result"].style["background-color"] = "white"


# btn_reset = pydom["#color-reset-button"][0].when('click', reset_color)

import random
import sys

from js import DOMParser, document, setInterval
from pyodide.ffi import create_proxy
from pyodide.http import open_url


class Antigravity:

    url = "./antigravity.svg"

    def __init__(self, target=None, interval=10, append=True, fly=False):
        target = target or sys.stdout._out
        self.target = (
            document.getElementById(target) if isinstance(target, str) else target
        )
        doc = DOMParser.new().parseFromString(
            open_url(self.url).read(), "image/svg+xml"
        )
        self.node = doc.documentElement
        if append:
            self.target.append(self.node)
        else:
            self.target.replaceChildren(self.node)
        self.xoffset, self.yoffset = 0, 0
        self.interval = interval
        if fly:
            self.fly()

    def fly(self):
        setInterval(create_proxy(self.move), self.interval)

    def move(self):
        char = self.node.getElementsByTagName("g")[1]
        char.setAttribute("transform", f"translate({self.xoffset}, {-self.yoffset})")
        self.xoffset += random.normalvariate(0, 1) / 20
        if self.yoffset < 50:
            self.yoffset += 0.1
        else:
            self.yoffset += random.normalvariate(0, 1) / 20


_auto = Antigravity(append=True)
fly = _auto.fly

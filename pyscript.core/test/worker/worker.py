import re
import a, b
from xworker import xworker


def on_message(event):
    print(event.data)
    foreign = re.search("^[^:]+", event.data).group(0)
    xworker.postMessage("Python: Hello " + foreign + " 👋")


xworker.onmessage = on_message

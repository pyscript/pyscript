from js import xworker
import re

def on_message(event):
    print(event.data)
    foreign = re.search("^[^:]+", event.data).group(0)
    xworker.postMessage("Python: Hello " + foreign + " 👋")

xworker.onmessage = on_message

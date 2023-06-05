from js import xworker


def on_message(event):
    print(event.data)
    xworker.postMessage("Pyodide: Hello MicroPython 👋")


xworker.onmessage = on_message

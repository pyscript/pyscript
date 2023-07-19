from xworker import xworker

document = xworker.window.document


def on_message(event):
    print(event.data)
    xworker.postMessage("thread")


xworker.onmessage = on_message

# be sure the page knows the worker has done parsing to avoid
# unnecessary random timeouts all over the tests
document.documentElement.className += " worker"

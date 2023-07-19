from xworker import xworker

document = xworker.window.document

document.body.textContent = "OK"

# be sure the page knows the worker has done parsing to avoid
# unnecessary random timeouts all over the tests
document.documentElement.className += " worker"

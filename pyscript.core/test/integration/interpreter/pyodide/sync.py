import time
from xworker import xworker

time.sleep = xworker.sync.sleep

print("before")
time.sleep(1)
print("after")

# be sure the page knows the worker has done parsing to avoid
# unnecessary random timeouts all over the tests
xworker.window.document.documentElement.classList.add("worker")

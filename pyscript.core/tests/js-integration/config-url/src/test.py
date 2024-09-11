from pyscript import RUNNING_IN_WORKER, document

classList = document.documentElement.classList

if RUNNING_IN_WORKER:
    classList.add("worker")
else:
    classList.add("main")

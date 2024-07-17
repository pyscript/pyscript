import js
from pyscript import window, document

classList = document.documentElement.classList

if js is window:
    classList.add("main")
else:
    classList.add("worker")

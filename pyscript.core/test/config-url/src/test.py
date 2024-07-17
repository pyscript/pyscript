import js
from pyscript import document, window

classList = document.documentElement.classList

if js is window:
    classList.add("main")
else:
    classList.add("worker")

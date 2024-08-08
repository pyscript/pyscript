from pyscript import document

classList = document.documentElement.classList

if not __terminal__:
    classList.add("error")
else:
    classList.add("ok")

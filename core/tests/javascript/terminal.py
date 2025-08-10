from pyscript import document

classList = document.documentElement.classList

if not __terminal__:  # noqa: F821  __terminal__ is defined in core/src/plugins/donkey.js
    classList.add("error")
else:
    classList.add("ok")

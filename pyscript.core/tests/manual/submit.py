from pyscript import document


def submit(event):
    editor = document.querySelector("#editor")
    editor.process(editor.code, True)

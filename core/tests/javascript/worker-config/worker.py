import numpy
from pyscript import document

document.body.append(numpy.__version__)
document.documentElement.classList.add("done")

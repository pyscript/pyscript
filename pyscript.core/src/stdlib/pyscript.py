# export only what we want to expose as `pyscript` module
# but not what is WORKER/MAIN dependent
from _pyscript import window, document, IS_WORKER
from _pyscript.display import display as _display

# this part is needed to disambiguate between MAIN and WORKER
if IS_WORKER:
    # in workers the display does not have a default ID
    # but there is a sync utility from xworker
    import polyscript as _polyscript
    from _pyscript import sync

    def current_target():
        return _polyscript.target

else:
    # in MAIN both PyWorker and current element target exist
    # so these are both exposed and the display will use,
    # if not specified otherwise, such current element target
    import _pyscript_js

    PyWorker = _pyscript_js.PyWorker

    def current_target():
        return _pyscript_js.target


# the display provides a handy default target either in MAIN or WORKER
def display(*values, target=None, append=True):
    if target is None:
        target = current_target()

    return _display(*values, target=target, append=append)

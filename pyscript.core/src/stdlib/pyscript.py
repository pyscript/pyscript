# export only what we want to expose as `pyscript` module
# but not what is WORKER/MAIN dependent
from _pyscript import window, document, IS_WORKER

# this part is needed to disambiguate between MAIN and WORKER
if IS_WORKER:
    # in workers the display does not have a default ID
    # but there is a sync utility from xworker
    from _pyscript.display import display
    from _pyscript import sync
else:
    # in MAIN both PyWorker and a runtime currentScript.id exist
    # so these are both exposed and the display, if imported,
    # will point at the right script as default target
    PyWorker = window._pyscript.PyWorker

    def __getattr__(attribute_name):
        if attribute_name == "display":
            from _pyscript.display import display

            id = window._pyscript.id
            return lambda *values, target=id, append=True: display(
                *values, target=target, append=append
            )
        raise AttributeError(f"'{__name__}' has no attribute '{attribute_name}'")

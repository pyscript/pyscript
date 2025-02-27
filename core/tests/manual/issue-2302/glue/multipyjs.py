from pyscript import config

MICROPYTHON = config["type"] == "mpy"

if MICROPYTHON:
    def new(obj, *args, **kwargs):
        return obj.new(*args, kwargs) if kwargs else obj.new(*args)
    def call(obj, *args, **kwargs):
        return obj(*args, kwargs) if kwargs else obj(*args)
else:
    def new(obj, *args, **kwargs):
        return obj.new(*args, **kwargs)
    def call(obj, *args, **kwargs):
        return obj(*args, **kwargs)

if not MICROPYTHON:
    import pyodide_js
    pyodide_js.setDebug(True)

from pyscript.ffi import to_js, create_proxy

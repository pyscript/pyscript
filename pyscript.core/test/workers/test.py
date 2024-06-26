from pyscript import document, workers


async def test(interpreter):
    # accessed as item
    named = await workers.micropython_version

    version = await named.micropython_version()
    document.body.append(version)
    document.body.append(document.createElement("hr"))

    # accessed as attribute
    named = await workers["pyodide_version"]

    version = await named.pyodide_version()
    document.body.append(version)
    document.body.append(document.createElement("hr"))

    document.documentElement.classList.add(interpreter)

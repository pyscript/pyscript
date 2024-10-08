from pyscript import document, workers


async def test(name):
    # retrieve sync utilities from the named worker
    named = await workers[name]

    # invoke the runtime_version __export__ + show it
    version = await named.runtime_version()
    document.body.append(version)

    # flag the expectations around name done
    document.documentElement.classList.add(name)

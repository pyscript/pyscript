from pyscript import config, RUNNING_IN_WORKER

type = config["type"]
print(f"{type}-script", RUNNING_IN_WORKER and "worker" or "main")


def test_func(message):
    print("Python", message)
    return message


def test_other(message):
    print("Python", message)
    return message


def version():
    try:
        from sys_version import version
    except ImportError:
        version = lambda: "no config"
    return version()

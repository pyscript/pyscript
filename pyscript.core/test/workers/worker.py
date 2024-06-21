def micropython_version():
    import sys
    return sys.version

__export__ = ['micropython_version']

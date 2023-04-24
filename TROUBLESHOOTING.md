# Troubleshooting

This page is meant for troubleshooting common problems with PyScript.

## Table of contents:

-   [Make Setup](#make-setup)
    -   [Check-node](#make-check-node)
    -   [Conda env create](#conda-env-create)

## Make setup

### Make check-node

A lot of problems related to `make setup` are related to node and npm being outdated. Once npm and node are updated, `make setup` should work. You can follow the steps on the [npm documentation](https://docs.npmjs.com/try-the-latest-stable-version-of-npm) to update npm (the update command for Linux should work for Mac as well). Once npm has been updated you can continue to the instructions to update node below.

To update Node run the following commands in order (Most likely you'll be prompted for your user password, this is normal):

```
sudo npm cache clean -f
sudo npm install -g n
sudo n stable
```

### Conda env create

One problem encountered during `make setup` is related to using a private PyPi registry.
If the registry is not available to `pip install`, an error similar to the following may appear:

```
Installing pip dependencies: / Ran pip subprocess with arguments:
['/Users/myuser/repos/pyscript/pyscriptjs/env/bin/python', '-m', 'pip', 'install', '-U', '-r', '/Users/myuser/repos/pyscript/pyscriptjs/condaenv.74wmhfru.requirements.txt', '--exists-action=b']
Pip subprocess output:
Looking in indexes: https://privateregistry:8080/pypi

Pip subprocess error:
WARNING: Retrying (Retry(total=4, connect=None, read=None, redirect=None, status=None)) after connection broken by 'NewConnectionError('<pip._vendor.urllib3.connection.HTTPSConnection object at 0x104916490>: Failed to establish a new connection: [Errno 8] nodename nor servname provided, or not known')': /pypi/playwright/
WARNING: Retrying (Retry(total=3, connect=None, read=None, redirect=None, status=None)) after connection broken by 'NewConnectionError('<pip._vendor.urllib3.connection.HTTPSConnection object at 0x104916e90>: Failed to establish a new connection: [Errno 8] nodename nor servname provided, or not known')': /pypi/playwright/
WARNING: Retrying (Retry(total=2, connect=None, read=None, redirect=None, status=None)) after connection broken by 'NewConnectionError('<pip._vendor.urllib3.connection.HTTPSConnection object at 0x104917910>: Failed to establish a new connection: [Errno 8] nodename nor servname provided, or not known')': /pypi/playwright/
WARNING: Retrying (Retry(total=1, connect=None, read=None, redirect=None, status=None)) after connection broken by 'NewConnectionError('<pip._vendor.urllib3.connection.HTTPSConnection object at 0x104928310>: Failed to establish a new connection: [Errno 8] nodename nor servname provided, or not known')': /pypi/playwright/
WARNING: Retrying (Retry(total=0, connect=None, read=None, redirect=None, status=None)) after connection broken by 'NewConnectionError('<pip._vendor.urllib3.connection.HTTPSConnection object at 0x104928c10>: Failed to establish a new connection: [Errno 8] nodename nor servname provided, or not known')': /pypi/playwright/
ERROR: Could not find a version that satisfies the requirement playwright (from versions: none)
ERROR: No matching distribution found for playwright
```

This can be resolved by replacing user-level preferences for PyPi regsitries in the following files:

-   _~/.pypirc_ -- update to:

```
[distutils]
index-servers =
    pypi
#     private
[pypi]
repository: http://pypi.python.org/pypi
### NOTE: comment out private registry
# [private]
# repository: http://privateregistry:8080/pypi
# username: myuser
```

-   _~/.config/pip/pip.conf_ -- update to:

```
[global]
# index-url = https://privateregistry:8080/pypi
index-url = https://pypi.org/simple
```

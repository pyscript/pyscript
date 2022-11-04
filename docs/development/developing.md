# Developing Process

This document is intended to help you get started developing for pyscript, it assumes that you have [setup your development environment](setting-up-environment.md).

* First, make sure you are using the latest version of the pyscript main branch

```
git pull upstream main
```

* Update your fork with the latest changes

```
git push origin main
```

* Activate the conda environment (this environment will contain all the necessary dependencies)

```
conda activate pyscriptjs/env/
```
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **NOTE**: We are assuming you are in the root folder. If you are in the pyscriptjs you can run `conda activate env/` instead.

* Install pre-commit (you only need to do this once)

```
pre-commit install
```
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **NOTE**: On first run, pre-commit installs a bunch of hooks that will be run when you commit changes to your branch - this will make sure that your code is following our style (it will also lint your code automatically).

* Create a branch for the issue that you want to work on

```
git checkout -b <your branch name>
```

* Work on your change

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **NOTE**: If you are working on a python file, you may encounter linting issues when pre-commit runs. Pyscript uses [black](https://black.readthedocs.io/en/stable/) to fix any linting problems automatically. All you need to do is add the changes again and commit using your previous commit message (the previous one that failed didn't complete due to black formatting files).

* Run tests before pushing the changes

```
make tests
```

* When you make changes locally, double check that your contribution follows the PyScript formatting rules by running `npm run lint`. Note that in this case you're looking for the errors, <u>**NOT**</u> the warnings (Unless the warning is created by a local change). If an error is found by lint you should fix it <u>**before**</u> creating a pull request


## Rebasing changes

Sometimes you might be asked to rebase main into your branch. You can do such by:

* Checkout into your main branch and pull the upstream changes

```
git checkout main
git pull upstream main
```

* Checkout your branch and rebase on main

```
git rebase -i main
```

If you have conflicts, you must fix them by comparing yours and incoming changes. Your editor can probably help you with this, but do ask for help if you need it!

* Once all conflicts have been fixed

```
git rebase --continue
```
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **NOTE**: You may see more conflicts that you need to address until all are resolved.

* Force push the fixed conflicts

```
git push -f origin <your branch name>
```

If you need help with anything, feel free to reach out and ask for help!

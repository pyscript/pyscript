# Contributing to PyScript

Thank you for wanting to contribute to the PyScript project!

## Table of contents

* [Code of Conduct](#code-of-conduct)
* [Contributing](#contributing)
    * [Reporting bugs](#reporting-bugs)
    * [Reporting security issues](#reporting-security-issues)
    * [Asking questions](#asking-questions)
    * [Setting up your local environment](#setting-up-your-local-environment)
    * [Places to start](#places-to-start)
    * [Submitting a change](#submitting-a-change)
* [License terms for contributions](#license-terms-for-contributions)
* [Becoming a maintainer](#becoming-a-maintainer)
* [Trademarks](#trademarks)

# Code of Conduct

The [PyScript Code of Conduct](https://github.com/pyscript/governance/blob/main/CODE-OF-CONDUCT.md) governs the project and everyone participating in it. By participating, you are expected to uphold this code. Please report unacceptable behavior to the maintainers or administrators as described in that document.

# Contributing

## Reporting bugs

Bugs are tracked on the [project issues page](https://github.com/pyscript/pyscript/issues). Please check if your issue has already been filed by someone else by searching the existing issues before filing a new one. Once your issue is filed, it will be triaged by another contributor or maintainer. If there are questions raised about your issue, please respond promptly.

## Creating useful issues

* Use a clear and descriptive title.
* Describe the specific steps that reproduce the problem with as many details as possible so that someone can verify the issue.
* Describe the behavior you observed, and the behavior you had expected.
* Include screenshots if they help make the issue clear.

## Reporting security issues

If you aren't confident that it is appropriate to submit a security issue using the above process, you can e-mail it to security@pyscript.net

## Asking questions

If you have questions about the project, using PyScript, or anything else, please ask in the [PyScript forum](https://community.anaconda.cloud/c/tech-topics/pyscript).

## Setting up your local environment

* Fork the repository - [quicklink](https://github.com/pyscript/pyscript/fork)

* Clone your fork of the project

```
    git clone https://github.com/<your username>/pyscript
```

* Add the original project as your upstream (this will allow you to pull the latest changes)

```
    git remote add upstream git@github.com:pyscript/pyscript.git
```

* cd into the `pyscriptjs` folder using the line below in your terminal (if your terminal is already in pyscript then use **cd pyscriptjs** instead)
```
    cd pyscript/pyscriptjs
```
* Install the dependencies with the command below

```
    make setup
```
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **NOTE**: If `make setup` gives a node/npm version required  error then go to [troubleshooting](https://github.com/pyscript/pyscript/blob/main/TROUBLESHOOTING.md)

* You can also run the examples locally by running the command below in your terminal
```
    make examples
```
* Run ***npm run dev*** to build and run the dev server. This will also watch for changes and rebuild when a file is saved.
```
    npm run dev
```
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **NOTE**: To access your local build paste `http://localhost:8080` into your browser


Now that node and npm have both been updated `make setup` should work, and you can continue [setting up your local environment](#setting-up-your-local-environment) without problems (hopefully).

### Developing

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

#### Rebasing changes

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


### Building the docs

To build the documentation locally first make sure you are in the `docs` directory.

You'll need `make` and `conda` installed in your machine. The rest of the environment should be automatically download and created for you once you use the command:

```
make setup
```

Use `conda activate $environment_name` to activate your environment.

To add new information to the documentation make sure you conform with PyScript's code of conduct and with the general principles of Diataxis. Don't worry about reading too much on it, just do your best to keep your contributions on the correct axis.

Write your documentation files using [Markedly Structured Text](https://myst-parser.readthedocs.io/en/latest/syntax/optional.html), which is very similar to vanilla Markdown but with some addons to create the documentation infrastructure.

Once done, initialize a server to check your work:

```
make livehtml
```

Visible here: http:///127.0.0.1:8000

## Places to start

If you would like to contribute to PyScript, but you aren't sure where to begin, here are some suggestions.

* **Read over the existing documentation.** Are there things missing, or could they be clearer? Make some changes/additions to those documents.
* **Review the open issues.** Are they clear? Can you reproduce them? You can add comments, clarifications, or additions to those issues. If you think you have an idea of how to address the issue, submit a fix!
* **Look over the open pull requests.** Do you have comments or suggestions for the proposed changes? Add them.
* **Check out the examples.** Is there a use case that would be good to have sample code for? Create an example for it.

# Submitting a change

All contributions must be licensed Apache 2.0, and all files must have a copy of the boilerplate license comment (can be copied from an existing file).

To create a change for PyScript, you can follow the process described [here](https://docs.github.com/en/get-started/quickstart/contributing-to-projects).

* Follow the steps in [setting your local environment](#setting-up-your-local-environment) and [developing](#developing)
* Make the changes you would like (don't forget to test them with `make test`)
* Add tests relevant to the feature or bug you fixed
* Open a pull request back to the PyScript project and address any comments/questions from the maintainers and other contributors.

## License terms for contributions

This Project welcomes contributions, suggestions, and feedback. All contributions, suggestions, and feedback you submitted are accepted under the [Apache 2.0](./LICENSE) license. You represent that if you do not own copyright in the code that you have the authority to submit it under the [Apache 2.0](./LICENSE) license. All feedback, suggestions, or contributions are not confidential.


## Becoming a maintainer

Contributors are invited to be maintainers of the project by demonstrating good decision making in their contributions, a commitment to the goals of the project, and consistent adherence to the [code of conduct](https://github.com/pyscript/governance/blob/main/CODE-OF-CONDUCT.md). New maintainers are invited by a 3/4 vote of the existing maintainers.

## Trademarks

The Project abides by the Organization's [trademark policy](https://github.com/pyscript/governance/blob/main/TRADEMARKS.md).

---
Part of MVG-0.1-beta.
Made with love by GitHub. Licensed under the [CC-BY 4.0 License](https://creativecommons.org/licenses/by-sa/4.0/).

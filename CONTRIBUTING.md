# Contributing to PyScript

Thank you for wanting to contribute to the PyScript project!

## Table of contents

* [Code of Conduct](#code-of-conduct)
* [Contributing](#contributing)
    * [Reporting bugs](#reporting-bugs)
    * [Reporting security issues](#reporting-security-issues)
    * [Asking questions](#asking-questions)
    * [Setting up your environment](#setting-up-your-environment)
    * [Places to start](#places-to-start)
    * [Submitting a change](#submitting-a-change)
* [License terms for contributions](#license-terms-for-contributions)
* [Becoming a maintainer](#becoming-a-maintainer)
* [Trademarks](#trademarks)

## Code of Conduct

The [PyScript Code of Conduct](https://github.com/pyscript/governance/blob/main/CODE-OF-CONDUCT.md) governs the project and everyone participating in it. By participating, you are expected to uphold this code. Please report unacceptable behavior to the maintainers or administrators as described in that document.

## Contributing

### Reporting bugs

Bugs are tracked on the [project issues page](https://github.com/pyscript/pyscript/issues). Please check if your issue has already been filed by someone else by searching the existing issues before filing a new one. Once your issue is filed, it will be triaged by another contributor or maintainer. If there are questions raised about your issue, please respond promptly.

#### Creating useful issues

* Use a clear and descriptive title.
* Describe the specific steps that reproduce the problem with as many details as possible so that someone can verify the issue.
* Describe the behavior you observed, and the behavior you had expected.
* Include screenshots if they help make the issue clear.

### Reporting security issues

If you aren't confident that it is appropriate to submit a security issue using the above process, you can e-mail it to security@pyscript.net

### Asking questions

If you have questions about the project, using PyScript, or anything else, please ask in the [PyScript forum](https://community.anaconda.cloud/c/tech-topics/pyscript).

### Setting up your environment

* clone the repo
```
    git clone https://github.com/pyscript/pyscript
```
* cd into the main project folder
```
    cd pyscript/pyscriptjs
```
* install the dependencies with npm install - make sure to use nodejs version >= 16
```
    npm install
```
* run npm run dev to build and run the dev server. This will also watch for changes and rebuild when a file is saved.
```
    npm run dev
```

### Places to start

If you would like to contribute to PyScript, but you aren't sure where to begin, here are some suggestions.

* **Read over the existing documentation.** Are there things missing, or could they be clearer? Make some changes/additions to those documents.
* **Review the open issues.** Are they clear? Can you reproduce them? You can add comments, clarifications, or additions to those issues. If you think you have an idea of how to address the issue, submit a fix!
* **Look over the open pull requests.** Do you have comments or suggestions for the proposed changes? Add them.
* **Check out the examples.** Is there a use case that would be good to have sample code for? Create an example for it.

### Submitting a change

All contributions must be licensed Apache 2.0, and all files must have a copy of the boilerplate license comment (can be copied from an existing file).

To create a change for PyScript, you can follow the process described [here](https://docs.github.com/en/get-started/quickstart/contributing-to-projects).

* Fork a personal copy of the PyScript project.
* Make the changes you would like (don't forget to test them!)
* Please squash all commits for a change into a single commit (this can be done using "git rebase -i"). Do your best to have a well-formed commit message for the change.
* Open a pull request back to the PyScript project and address any comments/questions from the maintainers and other contributors.

## License terms for contributions

This Project welcomes contributions, suggestions, and feedback. All contributions, suggestions, and feedback you submitted are accepted under the [Apache 2.0](./LICENSE) license. You represent that if you do not own copyright in the code that you have the authority to submit it under the [Apache 2.0](./LICENSE) license. All feedback, suggestions, or contributions are not confidential.

## Becoming a maintainer

Contributors are invited to be maintainers to the project by demonstrating good decision making in their contributions, a commitment to the goals of the project, and consistent adherence to the [code of conduct](https://github.com/pyscript/governance/blob/main/CODE-OF-CONDUCT.md). New maintainers are invited by a 3/4 vote of the existing maintainers.

## Trademarks

The Project abides by the Organization's [trademark policy](https://github.com/pyscript/governance/blob/main/TRADEMARKS.md).

---
Part of MVG-0.1-beta.
Made with love by GitHub. Licensed under the [CC-BY 4.0 License](https://creativecommons.org/licenses/by-sa/4.0/).

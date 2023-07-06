# Contributing to PyScript

Thank you for your interest in contributing to the PyScript project! This document provides guidelines on how to contribute to the project effectively and what to expect from the project's development flow and guidelines.

Please read these guidelines thoroughly before opening a pull request, issue, or discussion.

## Table of contents

-   [Contributing to PyScript](#contributing-to-pyscript)
    -   [Table of contents](#table-of-contents)
-   [Code of Conduct](#code-of-conduct)
-   [Contributing](#contributing)
    -   [Reporting bugs](#reporting-bugs)
    -   [Creating useful issues](#creating-useful-issues)
    -   [Reporting security issues](#reporting-security-issues)
    -   [Asking questions](#asking-questions)
    -   [Setting up your local environment and developing](#setting-up-your-local-environment-and-developing)
    -   [Developing](#developing)
    -   [Rebasing changes](#rebasing-changes)
    -   [Building the docs](#building-the-docs)
    -   [Places to start](#places-to-start)
    -   [Setting up your local environment and developing](#setting-up-your-local-environment-and-developing)
    -   [Submitting a change](#submitting-a-change)
-   [License terms for contributions](#license-terms-for-contributions)
-   [Becoming a maintainer](#becoming-a-maintainer)
-   [Trademarks](#trademarks)

# Code of Conduct

The [PyScript Code of Conduct](https://github.com/pyscript/governance/blob/main/CODE-OF-CONDUCT.md) governs the project and everyone participating in it. By participating, you are expected to uphold this code. Please report unacceptable behavior to the maintainers or administrators as described in that document.

# Contributing

## Opening an Issue

If you encounter a bug, have a feature proposal, or a question, please open an issue on the PyScript repository and select. When opening an issue, make sure to include the following information:

-   A clear and concise title that summarizes the issue.
-   A detailed description of the problem or feature request.
-   Steps to reproduce the issue (if applicable).
-   Any relevant error messages or screenshots.
-   The version of PyScript you are using (if applicable).

### Reporting bugs

Bugs are tracked on the [project issues page](https://github.com/pyscript/pyscript/issues). Please check if your issue has already been filed by someone else by searching the existing issues before filing a new one. Once your issue is filed, it will be triaged by another contributor or maintainer. If there are questions raised about your issue, please respond promptly.

### Creating useful issues

-   Use a clear and descriptive title.
-   Describe the specific steps that reproduce the problem with as many details as possible so that someone can verify the issue.
-   Describe the behavior you observed, and the behavior you had expected.
-   Include screenshots if they help make the issue clear.

### Reporting security issues

If you aren't confident that it is appropriate to submit a security issue using the above process, you can e-mail it to security@pyscript.net

### Asking questions

If you have questions about the project, using PyScript, or anything else, please ask in the [PyScript forum](https://community.anaconda.cloud/c/tech-topics/pyscript).

## Code Contributions

### Opening a Pull Request

To contribute code changes or bug fixes to PyScript, follow these steps to open a pull request:

1. Fork the PyScript repository to your GitHub account.
2. Create a new branch from the `main` branch with a descriptive name for your changes.
3. Make your desired changes, ensuring they adhere to the project's coding styles (detailed in this document).
4. Write tests for your changes to maintain code quality and avoid regressions.
5. Commit your changes with clear and concise commit messages.
6. Push your branch to your forked repository.
7. Open a pull request (PR) from your branch to the `main` branch of the PyScript repository.
8. Provide a clear and descriptive title for your PR.
9. Include a detailed description of the changes made, along with any relevant context or references.
10. Wait for feedback and engage in discussions to address any reviewer comments or change requests.

**Important TIP**: As mentioned below in the [PR approval requirements](#pr-approval-requirements), while not mandatory, all PRs should have a related issue. This is extremely helpful in general but even more important if the PR adds new functionality or changes some behavior. It can be very frustrating to work on something and then learn that not everyone share the same opinion on how that specific problem should be solved. To make sure the problem the PR is solving is undertood and the the solution has been discussed and approved by the majority of the users want to have their say and`maintainers`, creating an issue/discussion and discussing there is the best (and highly recommended) option.

### PR approval requirements

After you've created a PR there are a few extra steps that need to be taken so the PR can be approved. These steps aim to make sure the approval process is clear and that when a PR is merged, the level of quality of the codebase meets the standards set by the project `maintainers` in order to avoid regression and, ultimately, to keep high standards for the project users.

If your PR changes or adds functionality, it's expected that it includes:

**Description**: Every PR should have a meaningful and exhaustive description of what they do and a link to the original issue they address.

**Tests**: This is the way we ensure added/modified functionality meets the related feature expectations and that other code changes don't break functionlity over time.

**Documentation**: If your PR changes or adds functionality, it's expected that you also make sure to add the right information to the docs. For more information about how to work on the project documentation check out the [documentation readme](docs/tutorials/getting-started.md).

**Readable code**: Ok, this is a broad and generic statement and deserves some explanation. The mantra behind this statement is that code that is semantically meaningful (aka "has a meaning" :-) is preferable to code that is short and "saves some line of code". Remember, others will be reading your code and if they understand what's going on easily it's a good sign that your code reflects your intentions while also making it easier for everyone. In addition to that, remember that you may be reading that code in the future and your future self will definitely thank you for making it easy to read! For instance, a code like:

```python
t = "python"
...
# 20 lines later...
xs = engine.fetch_plugins(t)

...
# another 20 lines later...
for x in xs:
    x.init()
```

is harder to read compare to something like:

```python
plugin_type = "python"
...
# 20 lines later...
plugins = engine.fetch_plugins(plugin_type)

...
# another 20 lines later...
for plugin in plugins:
    plugin.init()
```

**Docstrings**: Document. Your. Code! Make sure all your classes and functions have docstrings that document their behaviour, inputs and outputs. Other people (especially users!) shouldn't need to dive your the code implementing a function in order to understand what it does.

**Comments**: In order to support the 2 previous points (remember, we said support, not replace!), make sure your core has meaningful comments that complement the code itself so that anyone reading your code can understand the intentions and the algorithm being implemented. While comments easily become out dated, they do help understanding the intentions.

A PR without the above will likely be kindly rejected. :)

## PR approval process

In order for a PR to be approved it has to be reviewed and approved by at least 1 maintainer, preferably 2.

During the PR review process, the reviewer may ask the author for changes of just have questions in general. It is the PR author responsibility to make sure they address any questions or changes requests and re-submit the PR for review. The author should not expect that PRs pending that process will be taken over by the project `maintainers`.

PRs that have been waiting for the author to answer questions or for code changes will be labeled as `stale` after a week and will be automatically closed after 2 weeks.

### Places to start

If you would like to contribute to PyScript, but you aren't sure where to begin, here are some suggestions:

-   **Read over the existing documentation.** Are there things missing, or could they be clearer? Make some changes/additions to those documents.
-   **Review the open issues.** Are they clear? Can you reproduce them? You can add comments, clarifications, or additions to those issues. If you think you have an idea of how to address the issue, submit a fix!
-   **Look over the open pull requests.** Do you have comments or suggestions for the proposed changes? Add them.
-   **Check out the examples.** Is there a use case that would be good to have sample code for? Create an example for it.

### Setting up your local environment and developing

If you would like to contribute to PyScript, you will need to set up a local development environment. The [following instructions](https://docs.pyscript.net/latest/development/setting-up-environment.html) will help you get started.

You can also read about PyScript's [development process](https://docs.pyscript.net/latest/development/developing.html) to learn how to contribute code to PyScript, how to run tests and what's the PR etiquette of the community!

## License terms for contributions

This Project welcomes contributions, suggestions, and feedback. All contributions, suggestions, and feedback you submitted are accepted under the [Apache 2.0](./LICENSE) license. You represent that if you do not own copyright in the code that you have the authority to submit it under the [Apache 2.0](./LICENSE) license. All feedback, suggestions, or contributions are not confidential.

## Becoming a maintainer

Contributors are invited to be maintainers of the project by demonstrating good decision making in their contributions, a commitment to the goals of the project, and consistent adherence to the [code of conduct](https://github.com/pyscript/governance/blob/main/CODE-OF-CONDUCT.md). New maintainers are invited by a 3/4 vote of the existing maintainers.

## Trademarks

The Project abides by the Organization's [trademark policy](https://github.com/pyscript/governance/blob/main/TRADEMARKS.md).

---

Part of MVG-0.1-beta.
Made with love by GitHub. Licensed under the [CC-BY 4.0 License](https://creativecommons.org/licenses/by-sa/4.0/).

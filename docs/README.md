# PyScript documentation

Welcome to the PyScript documentation directory, where you can find
and contribute to discussions around PyScript and related topics.

## Getting started

Before you start contributing to the documentation, it's worthwhile to
take a look at the general contributing guidelines for the PyScript project. You can find these guidelines here
[Contributing Guidelines](https://github.com/pyscript/pyscript/blob/main/CONTRIBUTING.md)

The documentation is based out of Diátaxis documentation framework  https://diataxis.fr/ , so that we can have an established guide for authoring our technical documentation.

### Setup

The `docs` directory in the pyscript repository contains a
[Sphinx](https://www.sphinx-doc.org/) documentation project. Sphinx is a system
that takes plaintext files containing documentation written in Markdown, along with
and static files like templates and themes, to build the static end result.

To set up the project locally on your machine for contribution;

1. Fork the project and clone it to your local machine by running the following command:
```bash
    git clone https://github.com/pyscript/pyscript.git
```

2. In the terminal window, navigate to the directory:
```sh
cd docs
```

3. Create a new environment, this environment will help you install all the dependecies you need for the project: 
```bash
    conda create --name <name-of-env> 
```

4. Activate the environment:
```bash
    conda activate <name-of-env>
```

5. Install all your dependences by running the command: 
```bash
    conda env update -n <name-of-env> --file environment.yml
```

6. Build the documentation set by running `make html`. This generates files in `/build` directory.

7. You will find the HTML pages in the _build/html direcotry where you can preview your changes

When you're ready to submit your changes, add a descriptive title and comments to summarize the changes made.
Select **Create a new branch for this commit and start a pull request**.
Check the **Propose file change** button.
Scroll down to compare changes with the original document.
Select **Create pull request**. 
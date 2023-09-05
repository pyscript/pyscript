# PyScript documentation

Welcome to the PyScript documentation directory, where you can find
and contribute to discussions around PyScript and related topics.

## Getting started

Before you start contributing to the documentation, it's worthwhile to
take a look at the general contributing guidelines for the PyScript project. You can find these guidelines here
[Contributing Guidelines](https://github.com/pyscript/pyscript/blob/main/CONTRIBUTING.md)

## Documentation Principles

The PyScript documentation is based on a documentation framework called [Diátaxis](https://diataxis.fr/). This framework helps to solve the problem of structure in technical documentation and identifies four modes of documentation - **tutorials, how-to guides, technical reference and explanation**. Each one of these modes answers to a different user need, fulfills a different purpose and requires a different approach to its creation.

The picture below gives a good visual representation of that separation of concerns:

![pyodide-pyscript](./img/diataxis.png)

So, please keep that in mind when contributing to the project documentation. For more information on, make sure to check [their website](https://diataxis.fr/).

### Setup

The `docs` directory in the pyscript repository contains a
[Material for MkDocs](https://squidfunk.github.io/mkdocs-material/) documentation project. Material is a system
that takes plaintext files containing documentation written in Markdown, along with
static files like templates and themes, to build the static end result.

To setup the documentation development environment simply run `make setup` from this folder and, once it's done,
activate your environment by running `conda activate ./_env`

### Build

Simply run `mkdocs serve`

## Cross-referencing

You can link to other pages in the documentation by using the `{doc}` role. For example, to link to the `docs/README.md` file, you would use:

```markdown
{doc}`docs/README.md`
```

You can also cross-reference the python glossary by using the `{term}` role. For example, to link to the `iterable` term, you would use:

```markdown
{term}`iterable`
```

You can also cross-reference functions, methods or data attributes by using the `{attr}` for example:

```markdown
{py:func}`repr`
```

This would link to the `repr` function in the python builtins.

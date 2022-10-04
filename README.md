# PyScript

## What is PyScript

### Summary

PyScript is a framework that allows users to create rich Python applications in the browser using HTML's interface and the power of [Pyodide](https://pyodide.org/en/stable/), [WASM](https://webassembly.org/), and modern web technologies.

To get started see the [getting started tutorial](docs/tutorials/getting-started.md).

For examples see [here](examples).

### Longer Version
PyScript is a meta project that aims to combine multiple open technologies into a framework that allows users to create sophisticated browser applications with Python. It integrates seamlessly with the way the DOM works in the browser and allows users to add Python logic in a way that feels natural both to web and Python developers.

## Try PyScript

To try PyScript, import the appropriate pyscript files into the ```<head>``` tag of your html page with:
```html
<head>
<link rel="stylesheet" href="https://pyscript.net/latest/pyscript.css" />
<script defer src="https://pyscript.net/latest/pyscript.js"></script>
</head>
```
You can then use PyScript components in your html page. PyScript currently implements the following elements:

* `<py-script>`: can be used to define python code that is executable within the web page. The element itself is not rendered to the page and is only used to add logic
* `<py-repl>`: creates a REPL component that is rendered to the page as a code editor and allows users to write executable code

Check out the [the examples directory](examples) folder for more examples on how to use it, all you need to do is open them in Chrome.

## How to Contribute

Read the [contributing guide](CONTRIBUTING.md) to learn about our development process, reporting bugs and improvements, creating issues and asking questions.

## Resources

* [Official docs](https://docs.pyscript.net)
* [Discussion board](https://community.anaconda.cloud/c/tech-topics/pyscript)
* [Home Page](https://pyscript.net/)
* [Blog Post](https://engineering.anaconda.com/2022/04/welcome-pyscript.html)
* [Discord Channel](https://discord.gg/BYB2kvyFwm)

## Notes

* This is an extremely experimental project, so expect things to break!
* PyScript has been only tested on Chrome at the moment.

## Governance

The [PyScript organization governance](https://github.com/pyscript/governance) is documented in a separate repository.

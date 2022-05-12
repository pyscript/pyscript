# What is PyScript?

The PyScript library provides HTML tags for embedding and executing Python code in your browser. PyScript is built using [Pyodide](https://pyodide.org/en/stable/), the WebAssembly port of CPython, which is compiled using [Emscripten](https://emscripten.org/).

PyScript turns the browser into a code deployment tool that anyone can learn to use.

## Example

In this example, we are using the `<py-script>` HTML tag to generate a Matplotlib figure and display it as an image.
Click **Preview** to see the rendered HTML.

To try it in your browser, copy the HTML source to a new HTML file and double-click it to open.


::::{tab-set}
:::{tab-item} HTML Source

```{literalinclude} ../_static/examples/what-is-pyscript.html
---
linenos:
```

:::

:::{tab-item} Preview

```{raw} html
<iframe height="600px" width="100%" scrolling="auto" frameborder="0" src="../_static/examples/what-is-pyscript.html"></iframe>
```

:::
::::

# What is PyScript?

The PyScript library provides HTML tags for embedding and executing Python code in your browser. PyScript is built using [Pyodide](https://pyodide.org/en/stable/), the WebAssembly port of CPython, which is compiled using [Emscripten](https://emscripten.org/).

PyScript turns the browser into a code deployment tool that anyone can learn to use.

## Example

In this example, we are using the `<py-script>` HTML tag to generate a Matplotlib figure and display it as an image.
Click **Preview** to see the rendered HTML.

To try it in your browser, copy the HTML source to a new HTML file and double-click it to open.


````{tabbed} HTML Source
```html
<html>
    <head>
      <link rel="stylesheet" href="https://pyscript.net/alpha/pyscript.css" />
      <script defer src="https://pyscript.net/alpha/pyscript.js"></script>
      <py-env>
        - numpy
        - matplotlib
      </py-env>
    </head>

  <body>
    <h1>Let's plot random numbers</h1>
    <div id="plot"></div>
    <py-script output="plot">
import matplotlib.pyplot as plt
import numpy as np

x = np.random.randn(1000)
y = np.random.randn(1000)

fig, ax = plt.subplots()
ax.scatter(x, y)
fig
    </py-script>
  </body>
</html>
```
````

````{tabbed} Preview
```{raw} html
<iframe width="600" height="480" src="../_static/plot.html"></iframe>
```
````

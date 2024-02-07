# PyScript

## What is PyScript

### Summary

PyScript is a framework that allows users to create rich Python applications in the browser using HTML's interface and the power of [Pyodide](https://pyodide.org/en/stable/), [MicroPython](https://micropython.org/) and [WASM](https://webassembly.org/), and modern web technologies.

To get started see the [Beginning PyScript tutorial](https://docs.pyscript.net/latest/beginning-pyscript/).

For examples see [here](https://pyscript.com/@examples).

Other useful resources:

-   The [official technical docs](https://docs.pyscript.net/).
-   Our current [Home Page](https://pyscript.net/) on the web.
-   A free-to-use [online editor](https://pyscript.com/) for trying PyScript.
-   Our community [Discord Channel](https://discord.gg/BYB2kvyFwm), to keep in touch .

Every Tuesday at 15:30 UTC there is the _PyScript Community Call_ on zoom, where we can talk about PyScript development in the open. Most of the maintainers regularly participate in the call, and everybody is welcome to join.

Every other Thursday at 16:00 UTC there is the _PyScript FUN_ call: this is a call in which everybody is encouraged to show what they did with PyScript.

For more details on how to join the calls and up to date schedule, consult the official calendar:

-   [Google calendar](https://calendar.google.com/calendar/u/0/embed?src=d3afdd81f9c132a8c8f3290f5cc5966adebdf61017fca784eef0f6be9fd519e0@group.calendar.google.com&ctz=UTC) in UTC time;
-   [iCal format](https://calendar.google.com/calendar/ical/d3afdd81f9c132a8c8f3290f5cc5966adebdf61017fca784eef0f6be9fd519e0%40group.calendar.google.com/public/basic.ics).

### Longer Version

PyScript is a meta project that aims to combine multiple open technologies into a framework that allows users to create sophisticated browser applications with Python. It integrates seamlessly with the way the DOM works in the browser and allows users to add Python logic in a way that feels natural both to web and Python developers.

## Try PyScript

To try PyScript, import the appropriate pyscript files into the `<head>` tag of your html page:

```html
<head>
    <link
        rel="stylesheet"
        href="https://pyscript.net/releases/2023.11.2/core.css"
    />
    <script
        type="module"
        src="https://pyscript.net/releases/2023.11.2/core.js"
    ></script>
</head>
<body>
    <script type="py" terminal>
        from pyscript import display
        display("Hello World!") # this goes to the DOM
        print("Hello terminal") # this goes to the terminal
    </script>
</body>
```

You can then use PyScript components in your html page. PyScript currently offers various ways of running Python code:

-   `<script type="py">`: can be used to define python code that is executable within the web page.
-   `<script type="py" src="hello.py">`: same as above, but the python source is fetched from the given URL.
-   `<script type="py" terminal>`: same as above, but also creates a terminal where to display stdout and stderr (e.g., the output of `print()`); `input()` does not work.
-   `<script type="py" terminal worker>`: run Python inside a web worker: the terminal is fully functional and `input()` works.
-   `<py-script>`: same as `<script type="py">`, but it is not recommended because if the code contains HTML tags, they could be parsed wrongly.
-   `<script type="mpy">`: same as above but use MicroPython instead of Python.

Check out the [official docs](https://docs.pyscript.net/) for more detailed documentation.

## How to Contribute

Read the [contributing guide](CONTRIBUTING.md) to learn about our development process, reporting bugs and improvements, creating issues and asking questions.

Check out the [developing process](https://pyscript.github.io/docs/latest/contributing) documentation for more information on how to setup your development environment.

## Governance

The [PyScript organization governance](https://github.com/pyscript/governance) is documented in a separate repository.

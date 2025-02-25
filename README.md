# PyScript

## PyScript is an open source platform for Python in the browser.

Using PyScript is as simple as:

```html
<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>PyScript!</title>
        <link
            rel="stylesheet"
            href="https://pyscript.net/snapshots/2024.9.2/core.css"
        />
        <script
            type="module"
            src="https://pyscript.net/snapshots/2024.9.2/core.js"
        ></script>
    </head>
    <body>
        <!-- Use MicroPython to evaluate some Python -->
        <script type="mpy" terminal>
            print("Hello, world!")
        </script>
    </body>
</html>
```

PyScript enables the creation of rich Python applications in the browser using
[Pyodide](https://pyodide.org/en/stable/) (a version of
[CPython](https://python.org/)), [MicroPython](https://micropython.org/),
[WASM](https://webassembly.org/), and modern web technologies. It means Python
now runs anywhere a browser runs: desktop, laptop, mobile, tablet, or any other
browser enabled device.

To start building, read the
[Beginning PyScript tutorial](https://docs.pyscript.net/latest/beginning-pyscript/).

For example applications, see [here](https://pyscript.com/@examples).

Other useful resources:

-   Our [Home Page](https://pyscript.net/) as an open source project.
-   The [official technical docs](https://docs.pyscript.net/).
-   A [YouTube channel](https://www.youtube.com/@PyScriptTV) with helpful videos
    and community content.
-   A free-to-use [online IDE](https://pyscript.com/) for trying PyScript.
-   Our community [Discord Channel](https://discord.gg/BYB2kvyFwm), to keep in
    touch .

Every Tuesday at 15:30 UTC there is the _PyScript Community Call_ on zoom,
where we can talk about PyScript development in the open. Most of the
maintainers regularly participate in the call, and everybody is welcome to
join. This meeting is recorded and uploaded to our YouTube channel.

Every other Thursday at 16:00 UTC there is the _PyScript FUN_ call: the focus
of this call is to share fun projects, goofy hacks or clever uses of PyScript.
It's a supportive, energetic and entertaining meeting. This meeting is also
recorded and uploaded to our YouTube channel.

For more details on how to join the calls and up to date schedule, consult the
official calendar:

-   [Google calendar](https://calendar.google.com/calendar/u/0/embed?src=d3afdd81f9c132a8c8f3290f5cc5966adebdf61017fca784eef0f6be9fd519e0@group.calendar.google.com&ctz=UTC) in UTC time;
-   [iCal format](https://calendar.google.com/calendar/ical/d3afdd81f9c132a8c8f3290f5cc5966adebdf61017fca784eef0f6be9fd519e0%40group.calendar.google.com/public/basic.ics).

## Contribute

For technical details of the code, please see the [README](core/README.md) in
the `core` directory.

Read the [contributing guide](https://docs.pyscript.net/latest/contributing/)
to learn about our development process, reporting bugs and improvements,
creating issues and asking questions.

Check out the [development process](https://docs.pyscript.net/latest/developers/)
documentation for more information on how to setup your development environment.

## Governance

The [PyScript organization governance](https://github.com/pyscript/governance)
is documented in a separate repository.

## Supporters

PyScript is an independent open source project.

However, PyScript was born at [Anaconda Inc](https://anaconda.com/) and its
core contributors are currently employed by Anaconda to work on PyScript. We
would like to acknowledge and celebrate Anaconda's continued support of this
project. Thank you [Anaconda Inc](https://anaconda.com/)!

# &lt;py-terminal&gt;

This is one of the core plugins in PyScript, which is active by default. With it, you can print to `stdout` and `stderr` from your python code, and the output will be displayed on the page in `<py-terminal>`.

## Configuration

You can control how `<py-terminal>` behaves by setting the values of the `terminal`, `docked`, and `xterm` fields in your configuration in your `<py-config>`.

For the **terminal** field, these are the values:

| value | description |
|-------|-------------|
| `false` | Don't add `<py-terminal>` to the page |
| `true` | Automatically add a `<py-terminal>` to the page |
| `"auto"` | This is the default. Automatically add a `<py-terminal auto>`, to the page. The terminal is initially hidden and automatically shown as soon as something writes to `stdout` and/or `stderr` |

For the **docked** field, these are the values:

| value | description |
|-------|-------------|
| `false` | Don't dock `<py-terminal>` to the page |
| `true` | Automatically dock a `<py-terminal>` to the page |
| `"docked"` | This is the default. Automatically add a `<py-terminal docked>`, to the page. The terminal, once visible, is automatically shown at the bottom of the page, covering the width of such page |

Please note that **docked** mode is currently used as default only when `terminal="auto"`, or *terminal* default, is used.

In all other cases it's up to the user decide if a terminal should be docked or not.

For the **xterm** field, these are the values:

| value | description |
|-------|-------------|
| `false` | This is the default. The `<py-terminal>` is a simple `<pre>` tag with some CSS styling. |
| `true` or `xterm` | The [xtermjs](http://xtermjs.org/) library is loaded and its Terminal object is used as the `<py-terminal>`. It's visibility and position are determined by the  `docked` and `auto` keys in the same way as the default `<py-terminal>` |

The xterm.js [Terminal object](http://xtermjs.org/docs/api/terminal/classes/terminal/) can be accessed directly if you want to adjust its properties, add [custom parser hooks](http://xtermjs.org/docs/guides/hooks/), introduce [xterm.js addons](http://xtermjs.org/docs/guides/using-addons/), etc. Access is best achieved by awaiting the `xtermReady` attribute of the `<py-terminal>` HTML element itself:

```python
import js
import asyncio

async def adjust_term_size(columns, rows):
    xterm = await js.document.querySelector('py-terminal').xtermReady
    xterm.resize(columns, rows)

asyncio.ensure_future(adjust_term_size(40,10))
```

Some terminal-formatting packages read from specific environment variables to determine whether they should emit formatted output; PyScript does not set these variables explicitly - you may need to set them yourself, or force your terminal-formatting package into a state where it outputs correctly formatted output.

A couple of specific examples:
 - the [rich](https://github.com/Textualize/rich) will not, by default, output colorful text, but passing `256` or `truecolor` as an argument as the `color_system` parameter to the [Console constructor](https://rich.readthedocs.io/en/stable/reference/console.html#rich.console.Console) will force it to do so. (As of rich v13)
 - [termcolor](https://github.com/termcolor/termcolor) will not, by default, output colorful text, but setting `os.environ["FORCE_COLOR"] = "True"` or by passing `force_color=True` to the `colored()` function will force it to do so. (As of termcolor v2.3)

### Examples

```html
<py-config>
    terminal = true
    docked = false
</py-config>

<py-script>
    print("Hello, world!")
</py-script>
```

This example will create a new `<py-terminal>`, the value "Hello, world!" that was printed will show in it.

You can also add one (or more) `<py-terminal>` to the page manually.

```html
<py-script>
    print("Hello, world!")
</py-script>

<py-terminal></py-terminal>
```

```{note}
If you include a `<py-terminal>` in the page, you can skip `terminal` from your `<py-config>`.
```

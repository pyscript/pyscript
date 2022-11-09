# &lt;py-terminal&gt;

This is one of the core plugins in PyScript, which is active by default. With it, you can receive `stdout` and `stderr` from your python code, which will be displayed on the page in `<py-terminal>`.

## Configuration

You can control how `<py-terminal>` behaves by setting the value of the  `terminal` configuration in your `<py-config>`.

| value | description |
|-------|-------------|
| `false` | Deactivate the plugin, no `<py-terminal>` will be added to the page |
| `true` | Adds a `<py-terminal>` to the page even if nothing is shown in the terminal yet. |
| `"auto"` | This is the default value for the `<py-terminal>`, the element will be shown on the page once there is something to show |

### Examples

```html
<py-config>
    terminal = true
</py-config>

<py-script>
    print("Hello, world!")
</py-script>
```

This example will create a new `<py-terminal>`, the value "Hello, world!" that was printed will show in it.

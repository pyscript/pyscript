#### `display(*values, target=None, append=True)`

**Parameters:**

    `*values` – `list` of values to be displayed (can be of the following kinds: "text/plain", "text/html", "image/png", "image/jpeg", "image/svg+xml", "application/json" or "application/javascript")
    `target` - the default value for `element_id` is the current `py-script` tag ID, it's possible to specify different IDs for this parameter
    `append` - `boolean` if the output is going to be appended or not to the `target`ed element. It creates a `<div>` tag if `True` and a `<py-script>` tag with a random ID if `False`

Display is the default function to display objects on the screen. Functions like the Python `print()` or JavaScript `console.log()` are now defaulted to only appear on the terminal.

Display will throw an exception if the target is not clear. E.g. the following code is invalid:

```
<py-script>
    def display_hello():
        # this fails because we don't have any implicit target
        # from event handlers
        display('hello')
</py-script>
<button id="my-button" py-onClick="display_hello()">Click me</button>
```

Because it's considered unclear if the `hello` string should be displayed underneath the `<py-script>` tag or the `<button>` tag.

To write compliant code, make sure to specify the target using the `target` parameter.

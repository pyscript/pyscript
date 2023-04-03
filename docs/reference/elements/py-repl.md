# &lt;py-repl&gt;

The `<py-repl>` element provides a REPL(Read Eval Print Loop) to evaluate multi-line Python and display output.

## Attributes

| attribute         | type    | default | description                          |
|-------------------|---------|---------|--------------------------------------|
| **auto-generate** | boolean |         | Auto-generates REPL after evaluation |
| **output-mode**   | string  | ""      | Determines whether the output element is cleared prior to writing output |
| **output**        | string  |         | The id of the element to write `stdout` and `stderr` to     |
| **stderr**        | string  |         | The id of the element to write `stderr` to |
| **src**           | string  |         | Resource to be preloaded into the REPL |


### `auto-generate`
If a \<py-repl\> tag has the `auto-generate` attribute, upon execution, another \<pr-repl\> tag will be created and added to the DOM as a sibling of the current tag.

### `output-mode`
By default, the element which displays the output from a REPL is cleared (`innerHTML` set to "") prior to each new execution of the REPL. If `output-mode` == "append", that element is not cleared, and the output is appended instead.

### `output`
The ID of an element in the DOM that `stdout` (e.g. `print()`), `stderr`, and the results of executing the repl are written to. Defaults to an automatically-generated \<div\> as the next sibling of the REPL itself.

### `stderr`
The ID of an element in the DOM that `stderr` will be written to. Defaults to None, though writes to `stderr` will still appear in the location specified by `output`.

### `src`
If a \<py-repl\> tag has the `src` attribute, during page initialization, resource in the `src` will be preloaded into the REPL. Please note that this will not run in advance. If there is content in the \<py-repl\> tag, it will be cleared and replaced with preloaded resource.

## Examples

### `<py-repl>` element set to auto-generate

```html
<py-repl auto-generate="true"> </py-repl>
```

### `<py-repl>` element with output

The following will write "Hello! World!" to the div with id `replOutput`.

```html
<div id="replOutput"></div>
<py-repl output="replOutput">
    print("Hello!")
    hello = "World!"
    hello
</py-repl>
```

Note that if we `print` from the REPL (or otherwise write to `sys.stdout`), the output will be printed in the [`py-terminal`](../plugins/py-terminal.md) if is enabled.

### `<py-repl>` element with src
Preload resource from src into the REPL
```html
<py-repl id="py-repl" output="replOutput" src="./src/py/py_code.py">
    If a py-repl tag has the src attribute,
    the content here will be cleared and replaced.
</py-repl>
<div id="replOutput"></div>
```
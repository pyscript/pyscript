# &lt;py-repl&gt;

The `<py-repl>` element provides a REPL(Read Eval Print Loop) to evaluate multi-line Python and display output.

## Attributes

| attribute | type | default | description |
|----|----|----|----|
| **auto-generate** | boolean |    | Auto-generates REPL after evaluation. |
| **output** | string |    |The element to write output into |

## Examples

- `<py-repl>` element set to auto-generate
```html
<py-repl auto-generate="true"> </py-repl>
```

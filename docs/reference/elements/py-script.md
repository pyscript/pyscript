# &lt;py-script&gt;

The `<py-script>` element lets you execute multi-line Python scripts both inline and via a src attribute.

## Attributes

| attribute | type   | default | description                  |
|-----------|--------|---------|------------------------------|
| **src**   | url    |         | You don't need to add long python code in py-script, you can provide url of the python source file in py-script tag with `src` attribute. When a Python file is referred with `src` attribute it is executed, and then added to the namespace where it was referred. |
| **output**| string |         | The id of a DOM element to route `sys.stdout` and `stderr` to, in addition to sending it to the `<py-terminal>`|
| **stderr**| string |         | The id of a DOM element to route just `sys.stderr` to, in addition to sending it to the `<py-terminal>`|

### output

If the `output` attribute is provided, any output to [sys.stdout](https://docs.python.org/3/library/sys.html#sys.stdout) or [sys.stderr](https://docs.python.org/3/library/sys.html#sys.stderr) is written to the DOM element with the ID matching the attribute. If no DOM element is found with a matching ID, a warning is shown. The msg is output to the `innerHTML` of the HTML Element, with newlines (`\n'`) converted to breaks (`<br\>`).

This output is in addition to the output being written to the developer console and the `<py-terminal>` if it is being used.

### stderr

If the `stderr` attribute is provided, any output to [sys.stderr](https://docs.python.org/3/library/sys.html#sys.stderr) is written to the DOM element with the ID matching the attribute. If no DOM element is found with a matching ID, a warning is shown. The msg is output to the `innerHTML` of the HTML Element, with newlines (`\n'`) converted to breaks (`<br\>`).

This output is in addition to the output being written to the developer console and the `<py-terminal>` if it is being used.


## Examples

### Inline `<py-script>` element

Let's execute this multi-line Python script to compute π and print it back onto the page

```html
<html>
  <head>
    <link rel="stylesheet" href="https://pyscript.net/latest/pyscript.css" />
    <script defer src="https://pyscript.net/latest/pyscript.js"></script>
  </head>
  <body>
      <py-script>
        print("Let's compute π:")
        def compute_pi(n):
            pi = 2
            for i in range(1,n):
                pi *= 4 * i ** 2 / (4 * i ** 2 - 1)
            return pi

        pi = compute_pi(100000)
        s = f"π is approximately {pi:.3f}"
        print(s)
      </py-script>
  </body>
</html>
```

### Using `<py-script>` element with `src` attribute

we can also move our python code to its own file and reference it via the `src` attribute.


```python
# compute_pi.py
print("Let's compute π:")
def compute_pi(n):
    pi = 2
    for i in range(1,n):
        pi *= 4 * i ** 2 / (4 * i ** 2 - 1)
    return pi

pi = compute_pi(100000)
s = f"π is approximately {pi:.3f}"
print(s)
```

Since both compute_pi.py and index.html are in the same directory, we can reference the python file with a relative path.

```html
<html>
  <head>
    <link rel="stylesheet" href="https://pyscript.net/latest/pyscript.css" />
    <script defer src="https://pyscript.net/latest/pyscript.js"></script>
  </head>
  <body>
      <py-script src="compute_pi.py"></py-script>
  </body>
</html>
```

### Writing into labeled elements

In the example above, we had a single `<py-script>` tag printing
one or more lines onto the page in order. Within the `<py-script>`, you can
use the `Element` class to create a python object for interacting with
page elements. Objects created from the `Element` class provide the `.write()` method
which enables you to send strings into the page elements referenced by those objects.

For example, we'll add some style elements and provide placeholders for
the `<py-script>` tag to write to.

```html
<html>
    <head>
      <link rel="stylesheet" href="https://pyscript.net/latest/pyscript.css" />
      <script defer src="https://pyscript.net/latest/pyscript.js"></script>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet" crossorigin="anonymous">
    </head>

  <body>
    <b><p>Today is <u><label id='today'></label></u></p></b>
    <br>
    <div id="pi" class="alert alert-primary"></div>
    <py-script>
      import datetime as dt
      Element('today').write(dt.date.today().strftime('%A %B %d, %Y'))

      def compute_pi(n):
          pi = 2
          for i in range(1,n):
              pi *= 4 * i ** 2 / (4 * i ** 2 - 1)
          return pi

      pi = compute_pi(100000)
      Element('pi').write(f'π is approximately {pi:.3f}')
    </py-script>
  </body>
</html>
```

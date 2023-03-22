# Event handlers in PyScript

PyScript offer two ways to subscribe to Javascript event handlers:

## Subscribe to event with `py-*` attributes

The value of the attribute contains python code which will be executed when the event is fired. A very common pattern is to call a function which does further work, for example:

```html
<button id="noParam" py-click="say_hello_no_param()">
 No Event - No Params py-click
</button>
<button id="withParam" py-click="say_hello_with_param('World')">
 No Event - With Params py-click
</button>
```

```python
<py-script>
    def say_hello_no_param():
        print("Hello!")
    def say_hello_with_param(name):
        print("Hello " + name + "!")
</py-script>
```

Note that py-\* attributes need a _function call_

Supported py-\* attributes can be seen in the [PyScript API reference](<[../api-reference.md](https://github.com/pyscript/pyscript/blob/66b57bf812dcc472ed6ffee075ace5ced89bbc7c/pyscriptjs/src/components/pyscript.ts#L119-L260)>).

## Subscribe to event with `addEventListener`

You can also subscribe to an event using the `addEventListener` method of the DOM element. This is useful if you want to pass event object to the event handler.

```html
<button id="two">add_event_listener passes event</button>
```

```python
<py-script>
  from js import console, document
  from pyodide.ffi.wrappers import add_event_listener

  def hello_args(*args):
    console.log(f"Hi! I got some args! {args}")

  add_event_listener(document.getElementById("two"), "click", hello_args)
</py-script>
```

or using the `addEventListener` method of the DOM element:

```html
<button id="three">add_event_listener passes event</button>
```

```python
<py-script>
  from js import console, document
  from pyodide.ffi import create_proxy

  def hello_args(*args):
    console.log(f"Hi! I got some args! {args}")

    document.getElementById("three").addEventListener("click", create_proxy(hello_args))
</py-script>
```

or using the PyScript Element class:

```html
<button id="four">add_event_listener passes event</button>
```

```python
<py-script>
  from js import console
  from pyodide.ffi import create_proxy

  def hello_args(*args):
    console.log(f"Hi! I got some args! {args}")

  Element("four").element.addEventListener("click", create_proxy(hello_args))
</py-script>
```

## JavaScript to PyScript and From PyScript to JavaScript

If you're wondering about how to pass objects from JavaScript to PyScript and/or the other way around head over to the [Passing Objects](passing-objects.md) page.


### Exporting all Global Python Objects

We can use our new `createObject` function to "export" the entire Python global object dictionary as a JavaScript object:

```python
<py-script>
    from js import createObject
    from pyodide.ffi import create_proxy
    createObject(create_proxy(globals()), "pyodideGlobals")
</py-script>
```

This will make all Python global variables available in JavaScript with `pyodideGlobals.get('my_variable_name')`.

(Since PyScript tags evaluate _after_ all JavaScript on the page, we can't just dump a `console.log(...)` into a `<script>` tag, since that tag will evaluate before any PyScript has a chance to. We need to delay accessing the Python variable in JavaScript until after the Python code has a chance to run. The following example uses a button with `id="do-math"` to achieve this, but any method would be valid.)

```python
<py-script>
    # create some Python objects:
    symbols = {'pi': 3.1415926, 'e': 2.7182818}

    def rough_exponential(x):
        return symbols['e']**x

    class Circle():
        def __init__(self, radius):
            self.radius = radius

        @property
        def area:
            return symbols['pi'] * self.radius**2
</py-script>
```

```html
<input type="button" value="Log Python Variables" id="do-mmath" />
<script>
 document.getElementById("do-math").addEventListener("click", () => {
  const exp = pyodideGlobals.get("rough_exponential");
  console.log("e squared is about ${exp(2)}");
  const c = pyodideGlobals.get("Circle")(4);
  console.log("The area of c is ${c.area}");
 });
</script>
```

### Exporting Individual Python Objects

We can also export individual Python objects to the JavaScript global scope if we wish.

(As above, the following example uses a button to delay the execution of the `<script>` until after the PyScript has run.)

```python
<py-script>
    import js
    from pyodide.ffi import create_proxy

    # Create 3 python objects
    language = "Python 3"
    animals = ['dog', 'cat', 'bird']
    multiply3 = lambda a, b, c: a * b * c

    # js object can be named the same as Python objects...
    js.createObject(language, "language")

    # ...but don't have to be
    js.createObject(create_proxy(animals), "animals_from_py")

    # functions are objects too, in both Python and Javascript
    js.createObject(create_proxy(multiply3), "multiply")
</py-script>
```

```html
<input type="button" value="Log Python Variables" id="log-python-variables" />
<script>
 document
  .getElementById("log-python-variables")
  .addEventListener("click", () => {
   console.log(`Nice job using ${language}`);
   for (const animal of animals_from_py) {
    console.log(`Do you like ${animal}s? `);
   }
   console.log(`2 times 3 times 4 is ${multiply(2, 3, 4)}`);
  });
</script>
```

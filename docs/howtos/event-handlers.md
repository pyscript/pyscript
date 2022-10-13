# Event handlers in PyScript

PyScript offer two ways to subscribe to Javascript event handlers:

## Subscribe to event with `py-*` attributes

You can subscribe to an event as you would with Javascript, by adding a `py-*` attribute to an HTML element. The value of the attribute should be a Python function.

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

## JavaScript to PyScript

We can use the syntax `from js import ...` to import JavaScript objects directly into PyScript. Simple JavaScript objects are converted to equivalent Python types; these are called [implicit conversions](https://pyodide.org/en/stable/usage/type-conversions.html#implicit-conversions). More complicated objects are wrapped in [JSProxy](https://pyodide.org/en/stable/usage/type-conversions.html) objects to make them behave like Python objects.

`import js` and `from js import ...` [in Pyodide](https://pyodide.org/en/stable/usage/type-conversions.html#type-translations-using-js-obj-from-py) get objects from the [JavaScript globalThis scope](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/globalThis), so keep the [rules of JavaScript variable scoping](https://www.freecodecamp.org/news/var-let-and-const-whats-the-difference/) in mind.

```html
<script>
 name = "Guido"; //A JS variable

 // Define a JS Function
 function addTwoNumbers(x, y) {
  return x + y;
 }
</script>
```

```python
<py-script>
    # Import and use JS function and variable into Python
    from js import name, addTwoNumbers

    print(f"Hello {name}")
    print("Adding 1 and 2 in Javascript: " + str(addTwoNumbers(1, 2)))
</py-script>
```

## PyScript to JavaScript

Since [PyScript doesn't export its instance of Pyodide](https://github.com/pyscript/pyscript/issues/494) and only one instance of Pyodide can be running in a browser window at a time, there isn't currently a way for Javascript to access Objects defined inside PyScript tags "directly".

We can work around this limitation using [JavaScript's eval() function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval), which executes a string as code much like [Python's eval()](https://docs.python.org/3/library/functions.html#eval). First, we create a JS function `createObject` which takes an object and a string, then uses `eval()` to create a variable named after the string and bind it to that object. By calling this function from PyScript (where we have access to the Pyodide global namespace), we can bind JavaScript variables to Python objects without having direct access to that global namespace.

Include the following script tag anywhere in your html document:

```html
<script>
 function createObject(object, variableName) {
  //Bind a variable whose name is the string variableName
  // to the object called 'object'
  let execString = variableName + " = object";
  console.log("Running '" + execString + "'");
  eval(execString);
 }
</script>
```

This function takes a Python Object and creates a variable pointing to it in the JavaScript global scope.

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

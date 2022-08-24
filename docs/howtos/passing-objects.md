# How to Pass Objects from PyScript to Javascript (and Vice Versa)

For our purposes, an 'object' is anything that can be bound to a variable (a number, string, object, [function](https://developer.mozilla.org/en-US/docs/Glossary/First-class_Function), etc). Also, recall that the `import js` or `from js import ...` [in Pyodide](https://pyodide.org/en/stable/usage/type-conversions.html#type-translations-using-js-obj-from-py) gets objects from the [JavaScript globalThis scope](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/globalThis), so keep the[ rules of JavaScript variable scoping](https://www.freecodecamp.org/news/var-let-and-const-whats-the-difference/) in mind.

## JavaScript to PyScript

We can use the simple `from js import ...` to import JavaScript objects directly into PyScript. Simple JavaScript objects are converted to equivalent Python types; more complicated objects are wrapped in [JSProxy](https://pyodide.org/en/stable/usage/type-conversions.html) objects to make them behave like Python objects. See the [Pyodide Documentation on Type Conversion](https://pyodide.org/en/stable/usage/type-conversions.html) for more details.

```html
<script>
    name = "Jeff" //A JS variable

    // Define a JS Function
    function addTwoNumbers(x, y){
        return x + y;
    }
</script>
<py-script>
    # Import and use JS function and varaible into Python
    from js import name, addTwoNumbers

    #import the js developer console so we can display our results
    from js import console
    console.log("Hello " + name + ".Adding 1 and 2 in Javascript: " + str(addTwoNumbers(1, 2)))
</py-script>
```

## PyScript to JavaScript

Since [PyScript doesn't export its instance of Pyodide](https://github.com/pyscript/pyscript/issues/494) and only one instance of Pyodide can be running in a browser window at a time, there isn't currently a way for Javascript to access Objects defined inside PyScript tags "directly".

We can work around this limitation using [JavaScript's eval() function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval), which executes a string as code much like [Python's eval()](https://docs.python.org/3/library/functions.html#eval). First, we create a JS function `createObject` which takes an object and a string, then uses eval() to bind that string as a variable to that object. By calling this function from PyScript (where we have access to the Pyodide global namespace), we can bind JavaScript variables to Python objects without having direct access to that global namespace.

```html
<script>
    function createObject(object, variableName){
        //Bind a variable whose name is the string variableName
        // to the object called 'object'
        let execString = variableName + " = object"
        console.log("Running `" + execString + "`");
        eval(execString)
    }
</script>
```

This takes a Python Object and creates a variable pointing to it in the JavaScript global scope. We can use it to "export" individual Python objects to the JavaScript global scope if we wish:

```html
<py-script>
    import js
        
    // Create 3 python objects
    language = "Python 3"
    animals = ['Dog', 'Cat', 'Bird']
    multiply3 = lambda a, b, c: a * b * c

    // js object can be named the same as Python objects...
    js.createObject(language, "language") 

    // ...but don't have to be
    js.createObject(animals, "animals_from_py")

    // functions are objects too, in both Python and Javascript
    js.createObject(multiply3, "multiply")
</py-script>
```
```html
<script>
    console.log("Nice job using ${language})
    console.log("Do you like ${animals_from_py})
    console.log("2 times 3 times 4 is ${multiply(2,3,4)}")
</script>
```

But we can also "export" the Python global namespace as a js object:

```python
<py-script>
    from js import createObject
    from pyodide import create_proxy
    createObject(create_proxy(globals()), "pyodideGlobals")
</py-script>
```
This will make all Python global variables available in JavaScript with `pyodideGlobals.get('my_variable_name')`.

For example:

```python
<py-script>
    // create some Python objects:
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
<script>
    const exp = pyodideGlobals.get('rough_exponential')
    console.log("e squared is about ${exp(2)}")
    const c = pyodideGlobals.get('Circle')(4)
    console.log("The area of c is ${c.area}")
</script>
```
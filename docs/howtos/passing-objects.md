# How to Pass Objects from PyScript to Javascript and Vice Versa

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
    # Import and use JS function and name in Python
    from js import name, addTwoNumbers

    #import the js developer console so we can display our results
    from js import console
    console.log("Hello " + name + ".Adding 1 and 2 in Javascript: " + str(addTwoNumbers(1, 2)))
</py-script>
```

## PyScript to JavaScript

Since [PyScript doesn't export its instance of Pyodide](https://github.com/pyscript/pyscript/issues/494) and only one instance of Pyodide can be running in a browser window at a time, there isn't currently a way for Javascript to access Objects defined inside PyScript tags "directly".

<p class="post-p">We can work around this limitation using [JavaScript's eval() function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval), which executes a string as code much like [Python's eval()]()https://docs.python.org/3/library/functions.html#eval. First, we create a JS function <code class="code">createObject</code> which takes an object and a string, then uses eval() to bind that string as a variable to that object. By calling this function from PyScript (where we have access to the Pyodide global namespace), we can bind JavaScript variables to Python objects without having direct access to that global namespace.</p>
# pyscript

The code underlying PyScript is a TypeScript/JavaScript module, which is loaded and executed by the browser. This is what loads when you include, for example, `<script defer src="https://pyscript.net/latest/pyscript.js">` in your HTML.

The module is exported to the browser as `pyscript`. The exports from this module are:

## pyscript.version

Once `pyscript.js` has loaded, the version of PyScript that is currently running can be accessed via `pyscript.version`.

```html
<script
    defer
    onload="console.log(`${pyscript.version}`)"
    src="https://pyscript.net/latest/pyscript.js"
></script>
```

```js
//example result
Object { year: 2022, month: 11, patch: 1, releaselevel: "dev" }
```

## pyscript.interpreter

The Interpreter object which is responsible for executing Python code in the Browser. Currently, all interpreters are assumed to be Pyodide interpreters, but there is flexibility to expand this to other web-based Python interpreters in future versions.

The Interpreter object has the following attributes

| attribute           | type                 | description                                                                     |
| ------------------- | -------------------- | ------------------------------------------------------------------------------- |
| **src**             | string               | The URL from which the current interpreter was fetched                          |
| **interface**       | InterpreterInterface | A reference to the interpreter object itself                                    |
| **globals**         | any                  | The globals dictionary of the interpreter, if applicable/accessible             |
| **name (optional)** | string               | A user-designated name for the interpreter                                      |
| **lang (optional)** | string               | A user-designation for the language the interpreter runs ('Python', 'C++', etc) |

### pyscript.interpreter.src

The URL from which the current interpreter was fetched.

### pyscript.interpreter.interface

A reference to the Interpreter wrapper that PyScript uses to execute code. object itself. This allows other frameworks, modules etc to interact with the same [(Pyodide) interpreter instance](https://pyodide.org/en/stable/usage/api/js-api.html) that PyScript uses.

For example, assuming we've loaded Pyodide, we can access the methods of the Pyodide interpreter as follows:

```html
<button onclick="logFromPython()">Click Me to Run Some Python</button>
<script>
    function logFromPython() {
        pyscript.interpreter.interface.runPython(`
            animal = "Python"
            sound = "sss"
            console.warn(f"{animal}s go " + sound * 5)
        `);
    }
</script>
```

### pyscript.interpreter.globals

A proxy for the interpreter's `globals()` dictionary. For example:

```html
<body>
    <py-script>x = 42</py-script>

    <button onclick="showX()">Click Me to Get 'x' from Python</button>
    <script>
        function showX() {
            console.log(
                `In Python right now, x = ${pyscript.interpreter.globals.get(
                    "x",
                )}`,
            );
        }
    </script>
</body>
```

### pyscript.interpreter.name

A user-supplied string for the interpreter given at its creation. For user reference only - does not affect the operation of the interpreter or PyScript.

### PyScript.interpreter.lang

A user-supplied string for the language the interpreter uses given at its creation. For user reference only - does not affect the operation of the interpreter or PyScript.

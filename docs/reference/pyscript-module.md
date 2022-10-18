# The PyScript Module

The code underlying PyScript is a TypeScript/JavaScript module, which is loaded and executed by the browser. This is what loads when you include, for example, `<script defer src="https://pyscript.net/latest/pyscript.js">` in your HTML.

The exports from this module are:

## PyScript.runtime

The RunTime object which is responsible for executing Python code in the Browser. Currently, all runtimes are assumed to be Pyodide runtimes, but there is flexibility to expand this to other web-based Python runtimes in future versions.

The RunTime object has the following attributes

| attribute           | type                | description                                                                 |
|---------------------|---------------------|-----------------------------------------------------------------------------|
| **src**             | string              | The URL from which the current runtime was fetched                          |
| **interpreter**     | RuntimeInterpretter | A reference to the runtime object itself                                    |
| **globals**         | any                 | The globals dictionary of the runtime, if applicable/accessible             |
| **name (optional)** | string              | A user-designated name for the runtime                                      |
| **lang (optional)** | string              | A user-designation for the langauge the runtime runs ('Python', 'C++', etc) |

### PyScript.runtime.src

The URL from which the current runtime was fetched.

### PyScript.runtime.interpreter

A reference to the Runtime warpper that PyScript uses to execute code. object itself. This allows other frameworks, modules etc to interact with the same [(Pyodide) runtime instance](https://pyodide.org/en/stable/usage/api/js-api.html) that PyScript uses.

For example, assuming we've loaded Pyodide, we can access the methods of the Pyodide runtime as follows:

```html
<button onclick="logFromPython()">Click Me to Run Some Python</button>
<script>
    function logFromPython(){
        PyScript.runtime.interpeter.runPython(`
            animal = "Python"
            sound = "sss"
            console.warn(f"{animal}s go " + sound * 5)
        `)
    }
</script>
```

### PyScript.runtime.globals

A proxy for the runtime's `globals()` dictionary. For example:

```html
<body>
    <py-script>x = 42</py-script>

    <button onclick="showX()">Click Me to Get 'x' from Python</button>
    <script>
        function showX(){
            console.log(`In Python right now, x = ${PyScript.globals.get('x')}`)
        }
    </script>
</body>
```
### PyScript.runtime.name

A user-supplied string for the runtime given at its creation. For user reference only - does not affect the operation of the runtime or PyScript.

### PyScript.runtime.lang

A user-supplied string for the language the runtime uses given at its creation. For user reference only - does not affect the operation of the runtime or PyScript.

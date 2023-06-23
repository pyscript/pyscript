# PyScript Core Documentation

 * [Terminology](#terminology) - what we mean by "_term_" in this document
 * [Bootstrapping core](#bootstrapping-core) - how to enable PyScript Next in your page
 * [How Scripts Work](#how-scripts-work) - how `<script type="...">` works
 * [How Events Work](#how-events-work) - how `<button py-click="...">` works
 * [XWorker](#xworker) - how `XWorker` class and its `xworker` reference work
 * [Custom Scripts](#custom-scripts) - how *custom types* can be defined and used to enrich any core feature


## Terminology

This section goal is to avoid confusion around topics discussed in this document, describing each *term* as exhaustively as possible.

<details>
  <summary><strong>Interpreter</strong></summary>
  <div>

Also commonly referred as *runtime* or *engine*, we consider an **interpreter** any "_piece of software_" able to parse, understand, and ultimately execute, a *Programming Language* through this project.

We also explicitly use that "_piece of software_" as the interpreter name it refers to. We currently bundle references to four interpreters:

 * [pyodide](https://pyodide.org/en/stable/index.html) is the name of the interpreter that runs likely the most complete version of latest *Python*, enabling dozen official modules at run time, also offering a great *JS* integration in its core
 * [micropython](https://micropython.org/) is the name of the interpreter that runs a small subset of the *Python* standard library and is optimized to run in constrained environments such as *Mobile* phones, or even *Desktop*, thanks to its tiny size and an extremely fast bootstrap
 * [wasmoon](https://github.com/ceifa/wasmoon) is the name of the interpreter that runs *Lua* on the browser and that, among the previous two interpreters, is fully compatible with all core features
 * [ruby-wasm-wasi](https://github.com/ruby/ruby.wasm) is the name of the (currently *experimental*) interpreter that adds *Ruby* to the list of programming languages currently supported

`<script>` tags specify which *interpreter* to use via the `type` attribute. This is typically the full name of the interpreter:

```html
<script type="pyodide">
    import sys
    print(sys.version)
</script>

<script type="micropython">
    import sys
    print(sys.version)
</script>

<script type="wasmoon">
    print(_VERSION)
</script>

<script type="ruby-wasm-wasi">
    print "ruby #{ RUBY_VERSION }"
</script>
```

ℹ️ - Please note we decided on purpose to not use the generic programming language name instead of its interpreter project name to avoid being too exclusive for alternative projects that would like to target that very same Programming Language (i.e. note *pyodide* & *micropython* not using *python* indeed as interpreter name).

Custom values for the `type` attribute can also be created which alias (and potential build on top of) existing interpreter types. We include `<script type="py">` (and its `<py-script>` custom element counter-part)  which use the Pyodide interpreter while extending its behavior in specific ways familiar to existing PyScript users (*the `<py-config>` tag, `<py-repl>`, etc*).

  </div>
</details>

<details>
  <summary><strong>Target</strong></summary>
  <div>

When it comes to *strings* or *attributes*, we consider the **target** any valid element's *id* on the page or, in most cases, any valid *CSS* selector.

```html
<!-- ℹ️ - requires py-script custom type -->
<script type="py">
    # target here is a string
    display('Hello PyScript', target='output')
</script>
<div id="output">
    <!-- will show "Hello PyScript" once the script executes -->
</div>
```

When it comes to the `property` or `field` attached to a `<script>` element though, that *id* or *selector* would already be resolved, so that such field would always point at the very same related element.

```html
<script type="micropython" target="output">
    from js import document
    document.currentScript.target.textContent = "Hello";
</script>
<div id="output">
    <!-- will show "Hello" once the script executes -->
</div>
```

ℹ️ - Please note that if no `target` attribute is specified, the *script* will automatically create a "_companion element_" when the `target` property/field is accessed for the very first time:

```html
<script type="micropython">
    from js import document

    # will create a <script-micropython> element appended
    # right after the currently executing script
    document.currentScript.target.textContent = "Hello";
</script>
<!--
    created during previous code execution

    <script-micropython>Hello</script-micropython>
-->
```

  </div>
</details>

<details>
  <summary><strong>Env</strong></summary>
  <div>

ℹ️ - This is an **advanced feature** that is worth describing but usually it is not needed for most common use cases.

Mostly due its terseness that plays nicely as attribute's suffix, among its commonly understood meaning, we consider an *env* an identifier that guarantee the used *interpreter* would always be the same and no other interpreters, even if they point at very same project, could interfere with globals, behavior, or what's not.

In few words, every single *env* would spawn a new interpreter dedicated to such env, and global variables defined elsewhere will not affect this "_environment_" and vice-versa, an *env* cannot dictate what will happen to other interpreters.

```html
<!-- default env per each interpreter -->
<script type="micropython">
    shared = True
</script>
<script type="micropython">
    # prints True - shared is global
    print(shared)
</script>

<!-- dedicated interpreter -->
<script type="micropython" env="my-project-env">
    # throws an error - shared doesn't exist
    print(shared)
</script>
```

ℹ️ - Please note if the interpreter takes 1 second to bootstrap, multiple *environments* will take *that* second multiplied by the number of different environments, which is why this feature is considered for **advanced** use cases only and it should be discouraged as generic practice.

  </div>
</details>


## Bootstrapping core

In order to have anything working at all in our pages, we need to at least bootstrap *@pyscript/core* functionalities, otherwise all examples and scripts mentioned in this document would just sit there ... sadly ignored by every browser:

```html
<!doctype html>
<html>
    <head>
        <!-- this is a way to automatically bootstrap @pyscript/core -->
        <script type="module" src="https://esm.run/@pyscript/core"></script>
    </head>
    <body>
        <script type="micropython">
            from js import document
            document.body.textContent = '@pyscript/core'
        </script>
    </body>
</html>
```

As *core* exposes some utility/API, using the following method would also work:

```html
<script type="module">
    import {
        define,      // define a custom type="..."
        whenDefined, // wait for a custom type to be defined
        XWorker      // allows JS <-> Interpreter communication
    } from 'https://esm.run/@pyscript/core';
</script>
```

Please keep reading this document to understand how to use those utilities or how to have other *Pogramming Languages* enabled in your page via `<script>` elements.


## How Scripts Work

The [&lt;script&gt; element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script) has at least these extremely important peculiarities compared to any other element defined by the [HTML Standard](https://html.spec.whatwg.org/multipage/):

 * its only purpose is to contain *data blocks*, meaning that browsers will never try to parse its content as generic *HTML* (and browsers will completely ignore either its content or its attributes, including the `src`, when its [type](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type) is not known)
 * its completely unobtrusive when it comes to both *aria* and *layout*, indeed it's one of the few nodes that can be declared almost anywhere without breaking its parent tree (other notable exception would be a comment node)
 * for our specific use case, it already offers attributes that are historically well understood and known, also simplifying somehow the creation of this document

The long story short is that any `<script type="non-standard-type">` has zero issues with any browser of choice, but it's true that using some specific *custom type* might lead to future issues in case that `type` could have some special meaning for the future of the Web.

We encourage everyone to be careful when using this *core* API as we definitively don't want to clash or conflict, by any mean, with what the Web might need or offer in the near to far future, but we're also confident so far our current *types* are more than safe.

### Script Attributes

| name      | example                                       | behavior |
| :-------- | :-------------------------------------------- | :--------|
| async     | `<script type="pyodide" async>`               | The code is evaluated via `runAsync` utility where, if the *interpreter* allows it, top level *await* would be possible, among other *PL* specific asynchronous features.  |
| config    | `<script type="pyodide" config="./cfg.toml">` | The interpreter will load and parse the *JSON* or *TOML* file to configure itself. Please see [currently supported config values](https://docs.pyscript.net/latest/reference/elements/py-config.html#supported-configuration-values) as this is currently based on `<py-config>` features. |
| env       | `<script type="pyodide" env="brand">`         | Create, if not known yet, a dedicated *environment* for the specified `type`. Please read the [Terminology](#terminology) **env** dedicated details to know more. |
| src       | `<script type="pyodide" src="./app.py">`      | Fetch code from the specified `src` file, overriding or ignoring the content of the `<script>` itself, if any. |
| target    | `<script type="pyodide" target="outcome">`    | Describe as *id* or *CSS* selector the default *target* to use as `document.currentScript.target` field. Please read the [Terminology](#terminology) **target** dedicated details to know more. |
| type      | `<script type="micropython">`                 | Define the *interpreter* to use with this script. Please read the [Terminology](#terminology) **interpreter** dedicated details to know more. |
| version   | `<script type="pyodide" version="0.23.2">`    | Allow the usage of a specific version where, if numeric, must be available through the project *CDN* used by *core* but if specified as fully qualified *URL*, allows usage of any interpreter's version: `<script type="pyodide" version="http://localhost:8080/pyodide.local.mjs">` |


### Script Features

These are all special, *script* related features, offered by *@pyscript/core* out of the box.

<details>
  <summary><strong>document.currentScript</strong></summary>
  <div>

No matter the interpreter of choice, if there is any way to reach the `document` from such interpreter, its `currentScript` will point at the exact/very-same script that is currently executing the code, even if its `async` attribute is used, mimicking what the standard [document.currentScript](https://developer.mozilla.org/en-US/docs/Web/API/Document/currentScript) offers already, and in an unobtrusive way for the rest of the page, as this property only exists for *synchronous* and blocking scripts that are running, hence never interfering with this *core* logic or vice-versa.

```html
<script type="micropython" id="my-target">
    from js import document

    # explicitly grab the current script as target
    my_target = document.getElementById('my-target')

    # verify it is the exact same node with same id
    print(document.currentScript.id == my_target.id)
</script>
```

Not only this is helpful to crawl the surrounding *DOM* or *HTML*, every script will also have a `target` property that will point either to the element reachable through the `target` attribute, or it lazily creates once a companion element that will be appended right after the currently executing *script*.

Please read the [Terminology](#terminology) **target** dedicated details to know more.

  </div>
</details>

<details>
  <summary><strong>XWorker</strong></summary>
  <div>

With or without access to the `document`, every (*non experimental*) interpreter will have defined, at the global level, a reference to the `XWorker` "_class_" (it's just a *function*!), which goal is to enable off-loading heavy operations on a worker, without blocking the main / UI thread (the current page) and allowing such worker to even reach the `document` or anything else available on the very same main / UI thread.

```html
<script type="micropython">
    # XWorker is globally defined
    print(XWorker != None)
</script>
```

Please read the [XWorker](#xworker) dedicated section to know more.

  </div>
</details>


## How Events Work

Inspired by the current [HTML Standard](https://html.spec.whatwg.org/multipage/webappapis.html#event-handlers):

> the event handler is exposed through a name, which is a string that always starts with "_on_" and is followed by the name of the event for which the handler is intended.

We took a similar approach, replacing that `on` prefix with whatever *interpreter* or *custom type* is available on the page, plus a *dash* `-` to avoid clashing with standards:

```html
<script type="micropython">
    def print_type(event, double):
        # logs "click 4"
        print(f"{event.type} {double(2)}")
</script>
<button micropython-click="print_type(event, lambda x: x * 2)">
    print type
</button>
```

If this example felt a bit verbose, be ensured custom types would work the same:

```html
<!-- ℹ️ - requires py-script custom type -->
<button py-click="print(event.type)">
    print type
</button>
```

What is important to understand about *events* in PyScript is that the text within the attribute is executed just like any other inline or external content is, through the very same *interpreter*, with the notably extra feature that the `event` reference is made temporarily available as *global* by *core*.

This really reflects how otherwise native Web inline events handlers work and we think it's a great feature to support ... *but*:

 * if your script runs *asynchronously* the `event` might be gone on the main / UI thread and by that time any of its `event.stopPropagation()` or `event.preventDefault()` goodness will be problematic, as too late to be executed
 * if your *interpreter* is *experimental*, or incapable of running *synchronous* events, the `event` reference might be less useful

ℹ️ - Please note that if your code runs via *XWorker*, hence in a different thread, there are different caveats and constraints to consider. Please read the [XWorker](#xworker) dedicated section to know more.

#### The type-env attribute

Just as the `env` attribute on a `<script>` tag specifies a specific instance of an interpreter to use to run code, it is possible to use the `[type]-env` attribute to specify which instance of an interpreter or custom type should be used to run event code:

```html
<script type="micropython">
    def log():
        print(1)
</script>
<!-- note the env value -->
<script type="micropython" env="two">
    # the button will log 2
    def log():
        print(2)
</script>
<!-- note the micropython-env value -->
<button
    micropython-env="two"
    micropython-click="log()"
>
    log
</button>
```

As mentioned before, this will work with `py-env` too, or any custom type defined out there.


## XWorker

Whenever computing relatively expensive stuff, such as a *matplot* image, or literally anything else that would take more than let's say 100ms to answer, running your *interpreter* of choice within a [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) is likely desirable, so that the main / UI thread won't block users' actions, listeners, or any other computation going on in these days highly dynamic pages.

`@pyscript/core` adds a functionality called `XWorker` to all of the interpreters it offers, which works in each language the way `Worker` does in JavaScript.

In each Interpreter, `XWorker` is a global reference, with a counter `xworker` (lower case) global reference within the worker code.

In short, the `XWorker` global goal is to help, without much thinking, to run any desired interpreter out of a *Worker*, enabling extra features on the *worker*'s code side.

### XWorker options

Before showing any example, it's important to understand how the offered API differs from Web standard *workers*:

| name      | example                                                  | behavior |
| :-------- | :------------------------------------------------------- | :--------|
| async     | `XWorker('./file.py', async=True)`                       | The worker code is evaluated via `runAsync` utility where, if the *interpreter* allows it, top level *await* would be possible, among other *PL* specific asynchronous features.  |
| config    | `XWorker('./file.py', config='./cfg.toml')`              | The worker will load and parse the *JSON* or *TOML* file to configure itself. Please see [currently supported config values](https://docs.pyscript.net/latest/reference/elements/py-config.html#supported-configuration-values) as this is currently based on `<py-config>` features. |
| type      | `XWorker('./file.py', type='pyodide')`                   | Define the *interpreter* to use with this worker which is, by default, the same one used within the running code. Please read the [Terminology](#terminology) **interpreter** dedicated details to know more. |
| version   | `XWorker('./file.py', type='pyodide', version='0.23.2')` | Allow the usage of a specific version where, if numeric, must be available through the project *CDN* used by *core* but if specified as fully qualified *URL*, allows usage of any interpreter's version: `<script type="pyodide" version="http://localhost:8080/pyodide.local.mjs">` |

The returning *JS* reference to any `XWorker(...)` call is literally a `Worker` instance that, among its default API, have the extra following feature:


| name      | example                            | behavior |
| :-------- | :--------------------------------- | :--------|
| sync      | `sync = XWorker('./file.py').sync` | Allows exposure of callbacks that can be run synchronously from the worker file, even if the defined callback is *asynchronous*. This property is also available in the global `xworker` reference. |

```python

sync = XWorker('./file.py').sync

def from_main(some, value):
    # return something interesting from main
    # or do anything else
    print(some)
    print(value)

sync.from_main = from_main
```

In the `xworker` counter part:

```python
# will log 1 and "two" in default stdout console
xworker.sync.from_main(1, "two")
```

### The xworker global reference

The content of the file used to initialize any `XWorker` on the main thread can always reach the `xworker` counter part as globally available (that means: no *import ... form ...* is necessary, it is already there).

Within a *Worker* execution context, the `xworker` exposes the following features:

| name          | example                                    | behavior |
| :------------ | :------------------------------------------| :--------|
| sync          | `xworker.sync.from_main(1, "two")`         | Executes the exposed `from_main` function in the main thread. Returns synchronously its result, if any. |
| window        | `xworker.window.document.title = 'Worker'` | Differently from *pyodide* or *micropython* `import js`, this field allows every single possible operation directly in the main thread. It does not refer to the local `js` environment the interpreter might have decided to expose, it is a proxy to handle otherwise impossible operations in the main thread, such as manipulating the *DOM*, reading `localStorage` otherwise not available in workers, change location or anything else usually possible to do in the main thread. |
| isWindowProxy | `xworker.isWindowProxy(ref)`               | **Advanced** - Allows introspection of *JS* references, helping differentiating between local worker references, and main thread global references. This is valid both for non primitive objects (array, dictionaries) as well as functions, as functions are also enabled via `xworker.window` in both ways: we can add a listener from the worker or invoke a function in the main. Please note that functions passed to the main thread will always be invoked asynchronously.

```python
print(xworker.window.document.title)

xworker.window.document.body.append("Hello Main Thread")

xworker.window.setTimeout(print, 100, "timers too")
```

ℹ️ - Please note that even if non blocking, if too many operations are orchestrated from a *worker*, instead of the *main* thread, the overall performance might still be slower due the communication channel and all the primitives involved in the synchronization process. Feel free to use the `window` feature as a great enabler for unthinkable or quick solutions but keep in mind it is still an indirection.

#### The `sync` utility

This helper does not interfere with the global context but it still ensure a function can be exposed form *main* and be used from *thread* and/or vice-versa.

```python
# main
def alert_user(message):
    import js
    js.alert(message)

w = XWorker('./file.py')
# expose the function to the thread
w.sync.alert_user = alert_user


# thread
if condition == None:
    xworker.sync.alert_user('something wrong!')
```


## Custom Scripts

With `@pyscript/core` it is possible to extend any *interpreter*, allowing users or contributors to define their own `type` for the `<script>` they would like to augment with goodness or extra simplicity.

The *core* module itself exposes two methods to do so:

| name          | example                   | behavior |
| :------------ | :------------------------ | :--------|
| define        | `define('mpy', options)`  | Register once a `<script type="mpy">` and a counter `<mpy-script>` selector that will bootstrap and handle all nodes in the page that match such selectors. The available `options` are described after this table. |
| whenDefined        | `whenDefined('mpy')` | Return a promise that will be resolved once the custom `mpy` script will be available, returning an *interpreter* wrapper once it will be fully ready. |

```js
import { define, whenDefined } from '@pyscript/core';

define('mpy', {
    interpreter: 'micropython',
    // the rest of the custom type options
});

// an "mpy" dependent plugin for the "mpy" custom type
whenDefined("mpy").then(interpreterWrapper => {
    // define or perform any task via the wrapper
})
```

### Custom Scripts Options

**Advanced** - Even if we strive to provide the easiest way for anyone to use core interpreters and features, the life cycle of a custom script might require any hook we also use internally to make `<script type="py">` possible, which is why this list is quite long, but hopefully exhaustive, and it covers pretty much everything we do internally as well.

The list of options' fields is described as such and all of these are *optional* while defining a custom type:

| name                      | example                                       | behavior |
| :------------------------ | :-------------------------------------------- | :--------|
| version                   | `{verstion: '0.23.2'}`                        | Allow the usage of a specific version of an interpreter, same way `version` attribute works with `<script>` elements. |
| config                    | `{config: 'type.toml'}`                       | Ensure such config is already parsed and available for every custom `type` that execute code. |
| env                       | `{env: 'my-project'}`                         | Guarantee same environment for every custom `type`, avoiding conflicts with any other possible default or custom environment. |
| onInterpreterReady        | `{onInterpreterReady(wrap, element) {}}`      | This is the main entry point to define anything extra to the context of the always same interpreter. This callback is *awaited* and executed, after the desired *interpreter* is fully available and bootstrapped *once* though other optional fields, per each element that matches the defined `type`. The `wrap` reference contains many fields and utilities helpful to run most common operations, and it is passed along most other options too, when defined. |
| onBeforeRun               | `{onBeforeRun(wrap, element) {}}`             | This is a **hook** into the logic that runs right before any *interpreter* `run(...)` is performed. It receives the same `wrap` already sent when *onInterpreterReady* executes, and it passes along the current `element` that is going to execute such code. |
| onAfterRun                | `{onAfterRun(wrap, element) {}}`              | This is a **hook** into the logic that runs right after any *interpreter* `run(...)` is performed. It receives the same `wrap` already sent when *onInterpreterReady* executes, and it passes along the current `element` that already executed the code. |
| onBeforeRunAsync          | `{onBeforeRunAsync(wrap, element) {}}`        | This is a **hook** into the logic that runs right before any *interpreter* `runAsync(...)` is performed. It receives the same `wrap` already sent when *onInterpreterReady* executes, and it passes along the current `element` that is going to execute such code asynchronously. |
| onAfterRunAsync           | `{onAfterRunAsync(wrap, element) {}}`         | This is a **hook** into the logic that runs right after any *interpreter* `runAsync(...)` is performed. It receives the same `wrap` already sent when *onInterpreterReady* executes, and it passes along the current `element` that already executed the code asynchronously. |
| onWorkerReady             | `{onWorkerReady(interpreter, xworker) {}}`    | This is a **hook** into the logic that runs right before a new `XWorker` instance has been created in the **main** thread. It makes it possible to pre-define exposed `sync` methods to the `xworker` counter-part, enabling cross thread features out of the custom type without needing any extra effort. |
| codeBeforeRunWorker       | `{codeBeforeRunWorker(){}}`                   | This is a **hook** into the logic that runs right before any *interpreter* `run(...)` is performed *within a worker*. Because all worker code is executed as `code`, this callback is expected to **return a string** that can be prepended for any worker synchronous operation. |
| codeAfterRunWorker        | `{codeAfterRunWorker(){}}`                    | This is a **hook** into the logic that runs right after any *interpreter* `run(...)` is performed *within a worker*. Because all worker code is executed as `code`, this callback is expected to **return a string** that can be appended for any worker synchronous operation. |
| codeBeforeRunWorkerAsync  | `{codeBeforeRunWorkerAsync(){}}`              | This is a **hook** into the logic that runs right before any *interpreter* `runAsync(...)` is performed *within a worker*. Because all worker code is executed as `code`, this callback is expected to **return a string** that can be prepended for any worker asynchronous operation. |
| codeAfterRunWorkerAsync   | `{codeAfterRunWorkerAsync(){}}`               | This is a **hook** into the logic that runs right after any *interpreter* `runAsync(...)` is performed *within a worker*. Because all worker code is executed as `code`, this callback is expected to **return a string** that can be appended for any worker asynchronous operation. |

### Custom Scripts Wrappers

Almost every interpreter has its own way of doing the same thing needed for most common use cases, and with this in mind we abstracted most operations to allow a terser *core* for anyone to consume, granting that its functionalities are the same, no matter which interpreter one prefers.

There are also cases that are not tackled directly in *core*, but necessary to anyone trying to extend *core* as it is, so that some helper felt necessary to enable users and contributors as much as they want.

In few words, while every *interpreter* is literally passed along to unlock its potentials 100%, the most common details or operations we need in core are:

| name                      | example                                       | behavior |
| :------------------------ | :-------------------------------------------- | :--------|
| type                      | `wrap.type`                                   | Return the current `type` (interpreter or custom type) used in the current code execution. |
| interpreter               | `wrap.interpreter`                            | Return the *interpreter* _AS-IS_ after being bootstrapped by the desired `config`. |
| XWorker                   | `wrap.XWorker`                                | Refer to the global `XWorker` class available to the main thread code while executing. |
| io                        | `wrap.io`                                     | Allow to lazily define different `stdout` or `stderr` via the running *interpreter*. This `io` field can be lazily defined and restored back for any element currently running the code. |
| config                    | `wrap.config`                                 | It is the resolved *JSON* config and it is an own clone per each element running the code, usable also as "_state_" reference for the specific element, as changing it at run time will never affect any other element. |
| run                       | `wrap.run(code)`                              | It abstracts away the need to know the exact method name used to run code synchronously, whenever the *interpreter* allows such operation, facilitating future migrations from an interpreter to another. |
| runAsync                  | `wrap.run(code)`                              | It abstracts away the need to know the exact method name used to run code asynchronously, whenever the *interpreter* allows such operation, facilitating future migrations from an interpreter to another. |

This is the `wrap` mentioned with most hooks and initializers previously described, and we're more than happy to learn if we are not passing along some extra helper.

### The io helper

```js
// change the default stdout while running code
wrap.io.stdout = (message) => {
  console.log("🌑", wrap.type, message);
};

// change the default stderr while running code
wrap.io.stderr = (message) => {
  console.error("🌑", wrap.type, message);
};
```

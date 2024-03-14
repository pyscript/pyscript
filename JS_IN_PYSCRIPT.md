# How to use JS libraries in PyScript

This document summarizes various ways to use JS libraries and modules directly in PyScript.

### All ways a JS library can be consumed on the Web

1. as global reference to the main window / context
2. as universal module definition ([UMD](https://github.com/umdjs/umd)), a deprecated and outdated non standard way to provide modules
3. as JS standard module ([ESM](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)), which is the modern way to import / export modules and the suggested way to consume any JS library whenever available / possible
4. as JS standard module ([ESM](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)) but with a default export

In the following sections we will see, per each variant of the list, how the library can be used in Python.

## No.1 [JS Global Library](https://pyscript.com/@agiammarchi/floral-glade/v1)

In this case the `py` or `mpy` _config_ entry for the `[js_modules.main]` or `[js_modules.worker]` detail is useless because the file is not exporting any field, it's meant to somehow leak or land in the main global / window context.

An example of such file could be represented by the following HTML:

```html
<!doctype html>
<!-- this utility escapes and unescape HTML chars -->
<script src="https://cdn.jsdelivr.net/npm/html-escaper@3.0.3/index.js"></script>
<script>
    // the library named `html` landed in the global context
    // as if it was `window.html = '...library code ...'`
    console.log(html);
</script>
```

When this is the case all one needs to do in PyScript is to simply import `window` and access that reference from there.

```python
from pyscript import window, document

html = window.html

# show on body: &lt;&gt;
document.body.append(html.escape("<>"))
```

## No.2 [JS as UMD module](https://pyscript.com/@agiammarchi/floral-glade/v2)

When a file uses _UMD_ it tries to check if there is an `export` and a `module` field in the current scope and it fallbacks to a globally leaked library just like the first presented example.

It is usually possible, in these cases, to use special _CDN_ services that automatically understand and convert such old-style module into a modern one.

A common and usually reliable service is provided by `esm.run/your-module-name`, a service that provides out of the box a standard way to consume the module:

```html
<!doctype html>
<script type="module">
    // this utility escapes and unescape HTML chars
    import { escape, unescape } from "https://esm.run/html-escaper";
    // esm.run returns a module       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^

    console.log(escape("<>"));
    // log: "&lt;&gt;"
</script>
```

If the desired module works without any issue, it is also possible to use the _CDN_ service within the `py` or `mpy` config as explained in the following chapter.

**If the module does not work**, it is wise to assume the module is still not updated or not migrated to _ESM_ and the best way to import such module is to create a `.js` file a part that will be consumed as if it was a real module.

**HTML**

```html
<!doctype html>
<!-- land the utility still globally as generic script -->
<script src="https://cdn.jsdelivr.net/npm/html-escaper@3.0.3/index.js"></script>
```

**TOML**

```toml
[js_modules.main]
# will simulate a standard JS module
"./html-escaper.js" = "html_escaper"
```

**JS** - the `./html-escaper.js` file

```js
// get all utilities needed from the global (aka window)
const { escape, unescape } = globalThis.html;

// export utilities like a module would do
export { escape, unescape };
```

**Python**

```python
from pyscript import document

# import the module either via
from pyscript.js_modules import html_escaper
# or via
from pyscript.js_modules.html_escaper import escape, unescape

# show on body: &lt;&gt;
document.body.append(html.escape("<>"))
```

## No.3 [JS Standard Module - ESM](https://pyscript.com/@agiammarchi/floral-glade/v3)

This is both the easiest and best way to import any standard JS module into Python.

It is possible to both use canonical, or fully qualified, URLs as well as "_magic CDN services_" that will transform the module for us.

In this scenario we don't need neither the script on the HTML side nor the local `.js` file.

A config and an import would be the only parts needed to consume such module:

**TOML**

```toml
[js_modules.main]
"https://cdn.jsdelivr.net/npm/html-escaper@3.0.3/esm/index.js" = "html_escaper"
# or via magic CDN service
# "https://cdn.jsdelivr.net/npm/html-escape/+esm" = "html_escaper"
```

**Python**

```python
from pyscript import document

# import the module either via
from pyscript.js_modules import html_escaper
# or via
from pyscript.js_modules.html_escaper import escape, unescape

# show on body: &lt;&gt;
document.body.append(html.escape("<>"))
```

## No.4 [JS Standard Module - ESM](https://pyscript.com/@agiammarchi/floral-glade/v3) with `default`

If a _JS_ module has been exported with a `default` it is necessary, in _PyScript_, to actually reach that `default` explicitly.

```js
// a theoretical `random` JS module
// which exports just once a random value
export default Math.random();
```

```python
from pyscript.js_modules.random import default as value
# or ...
from pyscript.js_modules import random
value = random.default

print(value)
```

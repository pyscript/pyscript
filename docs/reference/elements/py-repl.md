# &lt;py-repl&gt;

The code underlying PyScript is a TypeScript/JavaScript module, which is loaded and executed by the browser. This is what loads when you include, for example, `<script defer src="https://pyscript.net/latest/pyscript.js">` in your HTML.

The module is exported to the browser as `pyscript`. The exports from this module are:

## pyscript.runtime
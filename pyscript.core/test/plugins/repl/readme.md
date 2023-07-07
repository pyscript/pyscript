To start the interactive REPL session, we execute the code in `interactive.py` in the shared pyodide interpreter.

Probably the cleanest way to do this is with a build step that inlines this source as a string into js. Rollup can do this via ths [rollup-plugin-string](https://www.npmjs.com/package/rollup-plugin-string)

For the simplicity of getting started, currently the source of truth for this code is in `interactive.py`, but it must be transformed into a JavaScript file by running `python make_interactive_js.py`.

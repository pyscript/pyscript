# Release Notes

2023.XX.X
=========


Features
--------


### &lt;py-terminal&gt;
- Added a `docked` field and attribute for the `<py-terminal>` custom element, enabled by default when the terminal is in `auto` mode, and able to dock the terminal at the bottom of the page with auto scroll on new code execution.

### &lt;py-script&gt;
- Restored the `output` attribute of `py-script` tags to route `sys.stdout` to a DOM element with the given ID. ([#1063](https://github.com/pyscript/pyscript/pull/1063))
- Added a `stderr` attribute of `py-script` tags to route `sys.stderr` to a DOM element with the given ID. ([#1063](https://github.com/pyscript/pyscript/pull/1063))

### &lt;py-repl&gt;
- The `output` attribute of `py-repl` tags now specifies the id of the DOM element that `sys.stdout`, `sys.stderr`, and the results of a REPL execution are written to. It no longer affects the location of calls to `display()`
- Added a `stderr` attribute of `py-repl` tags to route `sys.stderr` to a DOM element with the given ID. ([#1106](https://github.com/pyscript/pyscript/pull/1106))
- Resored the `output-mode` attribute of `py-repl` tags. If `output-mode` == 'append', the DOM element where output is printed is _not_ cleared before writing new results.

### Plugins
- Plugins may now implement the `beforePyReplExec()` and `afterPyReplExec()` hooks, which are called immediately before and after code in a `py-repl` tag is executed. ([#1106](https://github.com/pyscript/pyscript/pull/1106))

Bug fixes
---------

- Fixes [#1280](https://github.com/pyscript/pyscript/issues/1280), which describes the errors on the PyRepl tests related to having auto-gen tags that shouldn't be there.

Enhancements
------------

- Py-REPL tests now run on both osx and non osx OSs
- migrated from *rollup* to *esbuild* to create artifacts
- updated `@codemirror` dependency to its latest

Docs
----

- Add docs for event handlers

2023.01.1
=========


Features
--------

Bug fixes
---------

- Fixed an issue where `pyscript` would not be available when using the minified version of PyScript. ([#1054](https://github.com/pyscript/pyscript/pull/1054))
- Fixed missing closing tag when rendering an image with `display`. ([#1058](https://github.com/pyscript/pyscript/pull/1058))
- Fixed a bug where Python plugins methods were being executed twice. ([#1064](https://github.com/pyscript/pyscript/pull/1064))

Enhancements
------------

- When adding a `py-` attribute to an element but didn't added an `id` attribute, PyScript will now generate a random ID for the element instead of throwing an error which caused the splash screen to not shutdown. ([#1122](https://github.com/pyscript/pyscript/pull/1122))
- You can now disable the splashscreen by setting `enabled = false` in your `py-config` under the `[splashscreen]` configuration section. ([#1138](https://github.com/pyscript/pyscript/pull/1138))

Documentation
-------------

- Fixed 'Direct usage of document is deprecated' warning in the getting started guide. ([#1052](https://github.com/pyscript/pyscript/pull/1052))
- Added reference documentation for the `py-splashscreen` plugin ([#1138](https://github.com/pyscript/pyscript/pull/1138))
- Adds doc for installing tests ([#1156](https://github.com/pyscript/pyscript/pull/1156))
- Adds docs for custom Pyscript attributes (`py-*`) that allow you to add event listeners to an element ([#1125](https://github.com/pyscript/pyscript/pull/1125))

Deprecations and Removals
-------------------------

- The py-config `runtimes` to specify an interpreter has been deprecated. The `interpreters` config should be used instead. ([#1082](https://github.com/pyscript/pyscript/pull/1082))
- The attributes `pys-onClick` and `pys-onKeyDown` have been deprecated, but the warning was only shown in the console. An alert banner will now be shown on the page if the attributes are used. They will be removed in the next release. ([#1084](https://github.com/pyscript/pyscript/pull/1084))
- The pyscript elements `py-button`, `py-inputbox`, `py-box` and `py-title` have now completed their deprecation cycle and have been removed. ([#1084](https://github.com/pyscript/pyscript/pull/1084))

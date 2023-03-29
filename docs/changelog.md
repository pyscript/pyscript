# Release Notes

2023.01.1
=========

Features
--------

- Restored the `output` attribute of &lt;py-script&gt; tags to route `sys.stdout` to a DOM element with the given ID. ([#1063](https://github.com/pyscript/pyscript/pull/1063))
- Added a `stderr` attribute of &lt;py-script&gt; tags to route `sys.stderr` to a DOM element with the given ID. ([#1063](https://github.com/pyscript/pyscript/pull/1063))

Bug fixes
---------

- Fixed an issue where `pyscript` would not be available when using the minified version of PyScript. ([#1054](https://github.com/pyscript/pyscript/pull/1054))
- Fixed missing closing tag when rendering an image with `display`. ([#1058](https://github.com/pyscript/pyscript/pull/1058))
- Fixed a bug where Python plugins methods were being executed twice. ([#1064](https://github.com/pyscript/pyscript/pull/1064))
- Fixed a bug where upon clicking a button attached to event, there are repetitive error messages displayed ([#1253](https://github.com/pyscript/pyscript/issues/1253))

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

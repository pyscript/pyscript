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

Documentation
-------------

- Fixed 'Direct usage of document is deprecated' warning in the getting started guide. ([#1052](https://github.com/pyscript/pyscript/pull/1052))

Deprecations and Removals
-------------------------

- The attributes `pys-onClick` and `pys-onKeyDown` have been deprecated, but the warning was only shown in the console. An alert banner will now be shown on the page if the attributes are used. They will be removed in the next release. ([#1084](https://github.com/pyscript/pyscript/pull/1084))
- The pyscript elements `py-button`, `py-inputbox`, `py-box` and `py-title` have now completed their deprecation cycle and have been removed. ([#1084](https://github.com/pyscript/pyscript/pull/1084))

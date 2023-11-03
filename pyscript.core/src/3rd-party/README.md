# PyScript 3rd Party

This folder contains artifacts created via [3rd-party.cjs](../../rollup/3rd-party.cjs).

As we would like to offer a way to run PyScript offline, and we already offer a `dist` folder with all the necessary scripts, we have created a foreign dependencies resolver that allow to lazy-load CDN dependencies out of the box.

Please **note** these dependencies are **not interpreters**, because interpreters have their own mechanism, folders structure, WASM files, and whatnot, to work locally, but at least XTerm or the TOML parser, among other lazy dependencies, should be available within the dist folder.

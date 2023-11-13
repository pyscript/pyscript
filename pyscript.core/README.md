# @pyscript/core

We have moved and renamed previous _core_ module as [polyscript](https://github.com/pyscript/polyscript/#readme), which is the base module used in here to build up _PyScript Next_, now hosted in this folder.

## Documentation

Please read [core documentation](./docs/README.md) to know more about this project.

## Development

Clone this repository then run `npm install` within its folder.

Use `npm run build` to create all artifacts and _dist_ files.

Use `npm run server` to test locally, via the `http://localhost:8080/test/` url, smoke tests or to test manually anything you'd like to check.

### Artifacts

There are two main artifacts in this project:

-   **stdlib** and its content, where `src/stdlib/pyscript.js` exposes as object literal all the _Python_ content within the folder (recursively)
-   **plugins** and its content, where `src/plugins.js` exposes all available _dynamic imports_, able to instrument the bundler to create files a part within the _dist/_ folder, so that by default _core_ remains as small as possible

Accordingly, whenever a file contains this warning at its first line, please do not change such file directly before submitting a merge request, as that file will be overwritten at the next `npm run build` command, either here or in _CI_:

```js
// ⚠️ This file is an artifact: DO NOT MODIFY
```

### Running tests

Before running the tests, we need to create a tests environment first. To do so run the following command from the root folder of the project:

```
make setup
```

This will create a tests environment [in the root of the project, named `./env`]and install all the dependencies needed to run the tests.

After the command has completed and the tests environment has been created, you can run the **integration tests** with
the following command:

```
make test-integration
```

## `pyscript` python package

The `pyscript` package available in _Python_ lives in the folder `src/stdlib/pyscript/`.

All _Python_ files will be embedded automatically whenever `npm run build` happens and reflected into the `src/stdlib/pyscript.js` file.

It is _core_ responsibility to ensure those files will be available through the Filesystem in either the _main_ thread, or any _worker_.

## JS plugins

While community or third party plugins don't need to be part of this repository and can be added just importing `@pyscript/core` as module, there are a few plugins that we would like to make available by default and these are considered _core plugins_.

To add a _core plugin_ to this project you can define your plugin entry-point and name in the `src/plugins` folder (see the `error.js` example) and create, if necessary, a folder with the same name where extra files or dependencies can be added.

The _build_ command will bring plugins by name as artifact so that the bundler can create ad-hoc files within the `dist/` folder.

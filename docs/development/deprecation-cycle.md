# Deprecation Cycle

Pyscript is under heavy development, which means that some things may change, and some features might need to be deprecated so you can use different alternative implementations.

This page describes the deprecation cycle for pyscript.

## Deprecation Steps

1. Remove usage of deprecated features from all examples.
2. Add warnings to all elements/features marked for deprecation.
3. Release a new version of pyscript with the deprecation warnings.
4. Next release, remove the deprecated features.

## Deprecation Warnings

Deprecation warnings are added to the codebase using the `showWarning` function from the `pyscriptjs.utils` module.

This function creates a warning banner on the page if any of the deprecated features was used. You can use HTML to write the message; ideally, you should provide an alternative to the deprecated feature.

### Example

```js
import { showWarning } from "./utils";

showWarning(
    `
    <p>
        The <code>py-deprecated</code> tag is deprecated. Please use the <code>py-actual</code> tag instead. Please refer to <a href="#">this documentation page</a> for more information.
    </p>
`,
    "html",
);
```

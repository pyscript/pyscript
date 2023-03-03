# &lt;py-splashscreen&gt;

This is one of the core plugins in PyScript, which is active by default. The splashscreen is the first thing you see when you open a page with Pyscript while it is loading itself and all the necessary resources.

## Configuration

You can control how `<py-splashscreen>` behaves by setting the value of the `splashscreen` configuration in your `<py-config>`.

| parameter   | default | description                                                                   |
| ----------- | ------- | ----------------------------------------------------------------------------- |
| `autoclose` | `true`  | Whether to close the splashscreen automatically when the page is ready or not |
| `enabled`   | `true`  | Whether to show the splashscreen or not                                       |

### Examples

#### Disabling the splashscreen

If you don't want the splashscreen to show and log any loading messages, you can disable it by setting the splashscreen option `enabled` to `false`.

```html
<py-config>
  [splashscreen]
      enabled = false
</py-config>
```

#### Disabling autoclose

If you want to keep the splashscreen open even after the page is ready, you can disable autoclose by setting `autoclose` to `false`.

```html
<py-config>
  [splashscreen]
      autoclose = false
</py-config>
```

## Adding custom messages

You can add custom messages to the splashscreen. This is useful if you want to show the user that something is happening in the background for your PyScript app.

There are two ways to add your custom messages to the splashscreen, either by dispatching a new custom event, `py-status-message` to the document:

```js
document.dispatchEvent(
  new CustomEvent("py-status-message", { detail: "Hello, world!" }),
);
```

Or by using the `log` method of the `py-splashscreen` tag directly:

```js
const splashscreen = document.querySelector("py-splashscreen");
splashscreen.log("Hello, world!");
```

If you wish, you can also send messages directly to the splashscreen from your python code:

```python
from js import document

splashscreen = document.querySelector("py-splashscreen")
splashscreen.log("Hello, world!")
```

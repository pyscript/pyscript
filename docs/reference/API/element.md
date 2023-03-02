# `Element`

The `Element` API is a helpful way to create and manipulate elements in the DOM. It is a wrapper around the native DOM API, and is designed to be as intuitive as possible.

## Methods and Properties

| Property    | Description                            |
| ----------- | -------------------------------------- |
| `element`   | Returns the element with the given ID. |
| `id`        | Returns the element's ID.              |
| `value`     | Returns the element's value.           |
| `innerHtml` | Returns the element's inner HTML.      |

| Method         | Description                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `write`        | Writes `value` to element and handles various mime types. `append` defaults to `False`, if set to true, it will create a child element.     |
| `clear`        | Clears the element's value or content.                                                                                                      |
| `select`       | Select element from `query` which uses [Document.querySelector()](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector). |
| `clone`        | Clones the with `new_id` if provided and `to` element if provided.                                                                          |
| `remove_class` | Removes one or more class name from the element.                                                                                            |
| `add_class`    | Adds one or more class name to the element.                                                                                                 |

## Element.element

| Parameter | Default | Type |
| --------- | ------- | ---- |
|           |         |      |

The `element` property returns the DOM element with the given ID.

```html
from pyscript import Element my_div = Element('my-div') print(my_div.element)
```

## Element.id

| Parameter | Default | Type |
| --------- | ------- | ---- |
|           |         |      |

Return the element's ID.

```html
<div id="my-div"></div>

<py-script>
    from pyscript import Element my_div = Element('my-div') print(my_div.id) #
    prints 'my-div'
</py-script>
```

## Element.value

| Parameter | Default | Type |
| --------- | ------- | ---- |
|           |         |      |

Return the element's value.

```html
<input id="my-input" value="hello world"></input>

<py-script>
    from pyscript import Element

    my_input = Element('my-input')
    print(my_input.value) # prints 'hello world'
</py-script>
```

## Element.innerHtml

| Parameter | Default | Type |
| --------- | ------- | ---- |
|           |         |      |

Return the element's inner HTML.

```html
<div id="my-innerHtml">
    <b>hello world</b>
</div>

<py-script>
    from pyscript import Element my_innerHtml = Element('my-innerHtml')
    print(my_innerHtml.innerHtml) # prints <b> hello world </b>
</py-script>
```

## Element.write

| Parameter | Default | Type                     |
| --------- | ------- | ------------------------ |
| `value`   |         | `str` or `__mime_type__` |
| `append`  | False   | `bool`                   |

Writes `value` to element and handles various mime types. This method also contains a `append` parameter, which defaults to `False`.

Currently, these are the MIME types that are supported when rendering content using this method

| Method              | Inferred MIME type       |
| ------------------- | ------------------------ |
| `__repr__`          | text/plain               |
| `_repr_html_`       | text/html                |
| `_repr_svg_`        | image/svg+xml            |
| `_repr_png_`        | image/png\*              |
| `_repr_pdf_`        | application/pdf          |
| `_repr_jpeg_`       | image/jpeg\*             |
| `_repr_json_`       | application/json         |
| `_repr_javascript_` | application/javascript\* |
| `savefig`           | image/png                |

```html
<div id="foo"></div>

<py-script>
    from pyscript import Element el = Element("foo") el.write("Hello!")
    el.write("World!") # will replace the previous content
</py-script>
```

If we set `append` to `True`, it will create a child element using a `div`.

```html
<div id="foo"></div>

<py-script>
    from pyscript import Element el = Element("foo") el.write("Hello!",
    append=True) # This will create a child div with the id "foo-1"
    el.write("World!", append=True)
</py-script>
```

## Element.clear

| Parameter | Default | Type |
| --------- | ------- | ---- |
|           |         |      |

Clears the element's value or content. For example, we can clear the value of an input element.

```html
<input id="foo" value="Hello!"></input>

<py-script>
    from pyscript import Element
    el = Element("foo")
    el.clear() # Removes value from input
</py-script>
```

Or we can clear the content of a div element.

```html
<div id="foo">Hello!</div>

<py-script>
    from pyscript import Element el = Element("foo") el.clear() # Removes Hello
    from div content
</py-script>
```

## Element.select

Select element from `query`, it will look into the main Element if `from_content` is `True`. This method is a wrapper of [Document.querySelector()](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector).

```html
<div id="foo">
    <div id="bar"></div>
</div>

<py-script>
    from pyscript import Element el = Element("foo") bar = el.select("#bar")
    print(bar.id) # prints 'bar'
</py-script>
```

## Element.clone

| Parameter | Default | Type      |
| --------- | ------- | --------- |
| `new_id`  | None    | `str`     |
| `to`      | None    | `Element` |

Clones the element to a new element. You can provide `new_id` to set a different id to the cloned element. You can also use a `to` element to append the cloned element to.

```html
<div id="foo">HI!</div>

<py-script>
    from pyscript import Element el = Element("foo") # Creates two divs with the
    id "foo" and content "HI!" el.clone()
</py-script>
```

It's always a good idea to pass a new id to the element you are cloning to avoid confusion if you need to reference the element by id again.

```html
<div id="foo">Hello!</div>

<py-script>
    from pyscript import Element el = Element("foo") # Clones foo and its
    contents, but uses the id 'bar' el.clone(new_id="bar")
</py-script>
```

You can also clone an element into another element.

```html
<div id="bond">Bond</div>
<div id="james">James</div>
<py-script>
    from pyscript import Element bond_div = Element("bond") james_div =
    Element("james") bond_div.clone(new_id="bond-2", to=james_div)
</py-script>
```

## Element.remove_class

| Parameter   | Default | Type                 |
| ----------- | ------- | -------------------- |
| `classname` | None    | `str` or `List[str]` |

Removes one or more class names from the element.

```html
<div id="foo" class="bar baz"></div>
<py-script>
    from pyscript import Element el = Element("foo") el.remove_class("bar")
</py-script>
```

You can also remove multiple classes by passing a list of strings.

```html
<div id="foo" class="bar baz"></div>
<py-script>
    from pyscript import Element el = Element("foo") el.remove_class(["bar",
    "baz"]) # Remove all classes from element
</py-script>
```

## Element.add_class

| Parameter   | Default | Type                 |
| ----------- | ------- | -------------------- |
| `classname` | None    | `str` or `List[str]` |

Adds one or more class names to the element.

```html
<style>
    .red {
        color: red;
    }
</style>
<div id="foo">Hi!</div>
<py-script>
    from pyscript import Element el = Element("foo") el.add_class("red")
</py-script>
```

You can also add multiple classes at once by passing a list of strings.

```html
<style>
    .red {
        color: red;
    }
    .bold {
        font-weight: bold;
    }
</style>
<div id="foo">Hi!</div>
<py-script>
    from pyscript import Element el = Element("foo") el.add_class(["red",
    "bold"])
</py-script>
```

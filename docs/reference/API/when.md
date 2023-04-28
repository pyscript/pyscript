# `@when`

`@when(event_type:str = None, selector:str = None)`

The `@when` decorator attaches the decorated function or Callable as an event handler for selected objects on the page. That is, when the named event is emitted by the selected DOM elements, the decorated Python function will be called.

If the decorated function takes a single (non-self) argument, it will be passed the [Event object](https://developer.mozilla.org/en-US/docs/Web/API/Event) corresponding to the triggered event. If the function takes no (non-self) argument, it will be called with no arguments.

## Parameters

`event_type` - A string representing the event type to match against. This can be any of the [https://developer.mozilla.org/en-US/docs/Web/Events#event_listing](https://developer.mozilla.org/en-US/docs/Web/Events) that HTML elements may emit, as appropriate to their element type.

`selector` = A string containing one or more [CSS selectors](https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/Selectors). The selected DOM elements will have the decorated function attacehed as an event handler.

## Examples:

The following example prints "Hello, world!" whenever the button is clicked. It demonstrates using the `@when` decorator on a Callable which takes no arguments:

```html
<button id="my_btn">Click Me to Say Hi</button>
<py-script>
    from pyscript import when
    @when("click", selector="#my_btn")
    def say_hello():
        print(f"Hello, world!")
</py-script>
```

The following example includes three buttons - when any of the buttons is clicked, that button turns green, and the remaining two buttons turn red. This demonstrates using the `@when` decorator on a Callable which takes one argument, which is then passed the Event object from the associated event. When combined with the ability to look at other elements in on the page, this is quite a powerful feature.

```html
<div id="container">
    <button>First</button>
    <button>Second</button>
    <button>Third</button>
</div>
<py-script>
    from pyscript import when
    import js

    @when("click", selector="#container button")
    def highlight(evt):
        #Set the clicked button's background to green
        evt.target.style.backgroundColor = 'green'

        #Set the background of all buttons to red
        other_buttons = (button for button in js.document.querySelectorAll('button') if button != evt.target)
        for button in other_buttons:
            button.style.backgroundColor = 'red'
</py-script>
```

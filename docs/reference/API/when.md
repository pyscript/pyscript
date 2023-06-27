# `@when`

`@when(event_type:str = None, selector:str = None)`

The `@when` decorator attaches the decorated function or Callable as an event handler for selected objects on the page. That is, when the named event is emitted by the selected DOM elements, the decorated Python function will be called.

If the decorated function takes a single (non-self) argument, it will be passed the [Event object](https://developer.mozilla.org/en-US/docs/Web/API/Event) corresponding to the triggered event. If the function takes no (non-self) argument, it will be called with no arguments.

You will need to import `when` to get access to this feature:
`from pyscript import when`

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

There is a complexity when using `@when` if you are used to Javascript's `addEventHandler()` behavior.
The event will fire on **any child** of the selector which is acted on by the `event_type`.
So you will need to test for where the `event_type` occurred and act depending on which child that is.

E.g. if you have an html dropdown implemented with a div surrounding an input and several option divs.
```html
  <div id="dropdown">
    <input class="text-box" type="text" placeholder="Select" readonly>
    <div class="options">
      <div>HTML</div>
      <div>CSS</div>
    </div>
```
Then you might have the following Javascript to toggle the drawdon div to `active` for your options to show via css.
```javascript
  let dropdown = document.getElementById('dropdown')
  dropdown.onclick = function() {
     dropdown.classList.toggle("active")
  }
```
Even though you may click on the `input` element the javascript will fire the `onclick` function when that event bubbles up to the dropdown div. And so the `active` class will appear on the dropdown div and not on the `input`.

If you do the same operation using `@when` then it might look like this:
```python
@when("click", selector="#dropdown")
def swatch_dropdown(evt):
    evt.target.classList.toggle("active")
```
However the `@when` will fire immediately the input is clicked and so your `active` class will appear on `input` and not the dropdown div.
The event target will be the `input` and your desired behavior will not occur.
You can fix this by getting the `parentElement` of the `input` target. or by getting the Element directly. e.g.
```python
@when("click", selector="#dropdown")
def swatch_dropdown(evt):
    el = Element("dropdown").element
    # or
    #el = evt.target.parentElement # if you can be sure input was clicked on
    el.classList.toggle("active")
```

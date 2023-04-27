# `@when`

`@when(event:str = None, selector:str = None)`

The `@when` decorator attaches the decorated function or Callable as an event handler for selected objects on the page. That is, when the named event is emitted by the selected DOM elements, the decorated Python function will be called.

If the decorated function takes a single (non-self) argument, it will be passed the [Event object](https://developer.mozilla.org/en-US/docs/Web/API/Event) corresponding to the triggered event. If the function takes no (non-self) argument, it will be called with no arguments.

## Parameters

`event` - A string representing the event type to match against. This can be any of the [https://developer.mozilla.org/en-US/docs/Web/Events#event_listing](https://developer.mozilla.org/en-US/docs/Web/Events) that HTML elements may emit, as appropriate to their type.

`selector` = A string containing one or more [CSS selectors](https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/Selectors). The selected DOM elements will have the decorated function attacehed as an event handler.

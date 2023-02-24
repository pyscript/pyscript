# `py-[event]` proposal

## Examples

The following example user code demonstrates all the functionality in this proposal:

```html
<!------------ Event Handlers ------------>
<py-script>
    def eventFunc(evt):
        print(f"This function got the event {evt}")
<py-script>
<button py-click="eventFunc">Takes an Event</button>

<py-script>
    def noEventFunc():
        print("This function doesn't take an argument, and won't be passed one")
</py-script>
<button py-click="noEventFunc">Doesn't Take An Event</button>

<py-script>
    def multipleNotAllowed(first, second):
        ... #Functions with multiple arguments are not valid Event Handlers
</py-script>
<button py-click="multipleNotAllowed">Click me to throw an error</button>

<py-script>
    class SomeClass():
        def oneFunc(self):
            print("This is the oneFunc method")
        
        def twoFunc(self, event):
            print(f"The twoFunc function got event {event}")

        @classmethod
        def threeFunc(self,event):
            print(f"Even classmethods work")

    instance = SomeClass()
</py-script>
<button py-click="instance.somefunc">Instance Methods do work</button>
<button py-click="instance.someEventFunc">Instance Method gets passed event</button><br><br>
<button py-click="Instance.threeFunc">cClass Methods work too</button><br><br>

<!------------ Event Code Runers ------------>

<button py-click-code="print('hello world')">Click to Print</button>
<button py-click-code="print(f'The event was {event}')">'event' as a local variable</button>

<py-script>
    def myFunc(a, b, c):
        print(f"{a} {b} {c}")
    
    ultimateAnswer = 42
</py-script>
<button py-click-code="myFunc('Jeff', 0, ultimateAnswer)">Call a Function with Arguments</button>
```

## Context

As discussed at the PyScript team offsite in February 2023, this is the proposal for the new behavior of the `py-[event]` syntax, and related keywords. The `@when` decorator is not included in this proposal - though its purpose (registering event handlers with Python functions) is very similar, the semantics are different.

### "`[event]`" in this Document

In all of the discussion that follows, the shorthand `[event]` is a stand-in for any* of the [Browser Events](https://developer.mozilla.org/en-US/docs/Web/Events). For example, an example which references `py-[event]=someFunc` could be read as `py-click=someFunc`, `py-change=someFunc` etc. 

*Currently, the events which are supported are enumerated as the `pyAttributeToEvent` map in pyscript.ts. See [Future Improvements:Improved event enumeration](#improved-event-enumeration).

## Description of Usage

When PyScript loads, following the execution off all \<py-script\> tags on, any tags on the the page with an attribute of `py-[event]` are processed as "Python Event Handlers". Any tags on the page with an attribute of `py-[event]-code` are processed as "Python Event CodeRunners". See below for the behavior of these 

### Python Event Handler Behavior (`py-[event]`)

HTML Tags with an attribute matching `py-[event]` are processed in the following fashion. An event handler is registered for this element, hooked to the specified event. When the event is dispatched to the element, the following logic is executed:

The value of the `py-[event]` HTML attribute is retrieved; this is referred to as the `handlerNameString`. `handlerNameString` string is `eval()`'d in the global namespace, for the purposes of resolving what existing Python object (created in a PyScript tag, plugin tag, or similar) it references. If this evaluation fails/erross, and error is raised. If the result of this evaluation is not a Callable, an error is raised.

If the result _is_ a Callable, we inspect the object. If signature takes a single parameter, we call that Callable and pass it the `event` object passed by the event handler. If it takes zero arguments, we simply call it (with no parameters). If it takes two or more parameters, an error is raised.

The method of inspection works "as expected" for instance/class methods that take a `self` or `cls` argument. In the examples above, `py-click="instance.oneFunc"` will result in `oneFunc` being called with no arguments (that is, its `self` parameter is ignored).

### Python Event CodeRunner Behavior (`py-[event]-code`)

HTML Tags with an attribute matching `py-[event]` are processed in the following fashion. An event handler is registered for this element, hooked to the specified event. When the event is dispatched to the element, the following logic is executed:

The value of the `py-[event]` HTML attribute is retrieved; this is referred to as the `userCode`. This code is `eval()`'d in the global namespace, with the local argument of `eval` equal to `{'event': js_event}`, where `js_event` is the event passed from the event dispatch on the JavaScript side. To be explicit - we are _not_ accessing Window.event or similarly acursed behavior; we are making use of an event passed by a JavaScript event handler.

## Future Improvements

The following aspects are improvements that would be useful, and are being deferred to future work.

### Mutation Handling

The first implementation of this proposal will only register the event handlers during the PyScript initialization phase; an improvement would be to have these event handlers registered/changed/removed whenever the `py-[event]` attribute on any HTML elemenet is changed. This could be implemented using a [Mutation Observer](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) or similar.

### Improved event enumeration

Currently, we support a limited subset of events as specified in `pyscript.ts`, in a mapping between "py-" attributes and the name of the actual browser events. It would be good to expand this list. It would be better to somehow dynamically generate this list at initialization time before scanning the DOM for elements with the appropriate attributes.



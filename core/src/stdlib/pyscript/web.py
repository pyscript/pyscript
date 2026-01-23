"""
A lightweight Pythonic interface to the DOM and HTML elements that helps you
interact with web pages, making it easy to find, create, manipulate, and
compose HTML elements from Python.

Highlights include:

Use the `page` object to find elements on the current page:

```python
from pyscript import web


# Find by CSS selector (returns an ElementCollection).
divs = web.page.find("div")
buttons = web.page.find(".button-class")

# Get element by ID (returns single Element or None).
header = web.page["header-id"]
header = web.page["#header-id"]  # the "#" prefix is optional.

# Access page structure.
web.page.body.append(some_element)
web.page.title = "New Page Title"
```

Create new elements and compose them together:

```python
# Create simple elements.
div = web.div("Hello, World!")
paragraph = web.p("Some text", id="my-para", className="text-content")

# Compose elements together.
container = web.div(
    web.h1("Title"),
    web.p("First paragraph"),
    web.p("Second paragraph"),
    id="container"
)

# Add to the page.
web.page.body.append(container)

# Create with initial attributes.
link = web.a(
    "Click me",
    href="https://example.com",
    target="_blank",
    classes=["link", "external"]
)
```

Modify element content and attributes:

```python
# Update content.
element.innerHTML = "<b>Bold text</b>"
element.textContent = "Plain text"

# Update attributes.
element.id = "new-id"
element.title = "Tooltip text"

# Bulk update with convenience method.
element.update(
    classes=["active", "highlighted"],
    style={"color": "red", "font-size": "16px"},
    title="Updated tooltip"
)
```

An element's CSS classes behave like a Python `set`:

```python
# Add and remove classes
element.classes.add("active")
element.classes.add("highlighted")
element.classes.remove("hidden")

# Check membership.
if "active" in element.classes:
    print("Element is active")

# Clear all classes.
element.classes.clear()

# Discard (no error if missing).
element.classes.discard("maybe-not-there")
```

An element's styles behave like a Python `dict`:

```python
# Set individual styles.
element.style["color"] = "red"
element.style["background-color"] = "#f0f0f0"
element.style["font-size"] = "16px"

# Remove a style.
del element.style["margin"]

# Check if style is set.
if "color" in element.style:
    print(f"Color is {element.style['color']}")
```

Update multiple elements at once via an `ElementCollection`:

```python
# Find multiple elements (returns an ElementCollection).
items = web.page.find(".list-item")

# Iterate over collection.
for item in items:
    item.innerHTML = "Updated"
    item.classes.add("processed")

# Bulk update all elements.
items.update_all(
    innerHTML="Hello",
    className="updated-item"
)

# Index and slice collections.
first = items[0]
subset = items[1:3]

# Get an element by ID within the collection.
special = items["special-id"]

# Find descendants within the collection.
subitems = items.find(".sub-item")
```

Manage `select` element options (also for `datalist` and `optgroup`):

```python
# Get existing select.
select = web.page["my-select"]

# Add options.
select.options.add(value="1", html="Option 1")
select.options.add(value="2", html="Option 2", selected=True)

# Get selected option.
selected = select.options.selected
print(f"Selected: {selected.value}")

# Iterate over options.
for option in select.options:
    print(f"{option.value}: {option.innerHTML}")

# Clear all options.
select.options.clear()

# Remove specific option by index.
select.options.remove(0)
```

Attach event handlers to elements:

```python
from pyscript import when

button = web.button("Click me", id="my-button")

# Use the when decorator.
@when("click", button)
def handle_click(event):
    print("Button clicked!")

# Or add directly to the event.
def another_handler(event):
    print("Another handler")

button.on_click.add_listener(another_handler)

# Pass handler during creation.
button = web.button("Click", on_click=handle_click)
```

All `Element` instances provide direct access to the underlying DOM element
via attribute delegation:

```python
# Most DOM methods are accessible directly.
element.scrollIntoView()
element.focus()
element.blur()

# But we do have a historic convenience method for scrolling into view.
element.show_me()  # Calls scrollIntoView()

# Access the raw DOM element when needed for special cases.
dom_element = element._dom_element
```

The main entry point is the `page` object, which represents the current
document and provides access to common elements like `page.body` and methods
like `page.find()` for querying the DOM.
"""

from pyscript import document, when, Event  # noqa: F401
from pyscript.ffi import create_proxy, is_none


# Utility functions for finding and wrapping DOM elements.


def _wrap_if_not_none(dom_element):
    """
    Wrap a `dom_element`, returning `None` if the element is `None`/`null`.
    """
    return Element.wrap_dom_element(dom_element) if not is_none(dom_element) else None


def _find_by_id(dom_node, target_id):
    """
    Find an element by `id` within a `dom_node`.

    The `target_id` can optionally start with '#'. Returns a wrapped `Element`
    or `None` if not found.
    """
    element_id = target_id[1:] if target_id.startswith("#") else target_id
    result = dom_node.querySelector(f"#{element_id}")
    return _wrap_if_not_none(result)


def _find_and_wrap(dom_node, selector):
    """
    Find all descendants of `dom_node` matching the CSS `selector`.

    Returns an `ElementCollection` of wrapped elements.
    """
    return ElementCollection.wrap_dom_elements(dom_node.querySelectorAll(selector))


class Element:
    """
    The base class for all [HTML elements](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements).

    Provides a Pythonic interface to DOM elements with support for attributes,
    events, styles, classes, and DOM manipulation. It can create new elements
    or wrap existing DOM elements.

    Elements are typically created using the tag-specific classes found
    within this namespace (e.g. `web.div`, `web.span`, `web.button`):

    ```python
    from pyscript import web


    # Create a simple div.
    div = web.div("Hello, World!")

    # Create with attributes.
    link = web.a("Click me", href="https://example.com", target="_blank")

    # Create with classes and styles.
    button = web.button(
        "Submit",
        classes=["primary", "large"],
        style={"background-color": "blue", "color": "white"},
        id="submit-btn"
    )
    ```

    !!! info

        Some elements have an underscore suffix in their class names (e.g.
        `select_`, `input_`).

        This is to avoid clashes with Python keywords. The underscore is removed
        when determining the actual HTML tag name.

    Wrap existing DOM elements found on the page:

    ```python
    # Find and wrap an element by CSS selector.
    existing = web.page.find(".my_class")[0]

    # Or, better, just use direct ID lookup (with or without the
    # leading '#').
    existing = web.page["my-element"]
    ```

    Element attributes are accessible as Python properties:

    ```python
    # Get attributes.
    element_id = div.id
    element_title = div.title
    element_href = link.href

    # Set attributes.
    div.id = "new-id"
    div.title = "Tooltip text"
    link.href = "https://new-url.com"

    # HTML content.
    div.innerHTML = "<b>Bold text</b>"
    div.textContent = "Plain text"
    ```

    CSS classes are managed through a `set`-like interface:

    ```python
    # Add classes.
    element.classes.add("active")
    element.classes.add("highlighted")

    # Remove classes.
    element.classes.remove("inactive")
    element.classes.discard("maybe-missing")  # No error if absent

    # Check membership.
    if "active" in element.classes:
        print("Element is active")

    # Iterate over classes.
    for cls in element.classes:
        print(cls)
    ```

    Explicit CSS styles are managed through a `dict`-like interface:

    ```python
    # Set styles using CSS property names (hyphenated).
    element.style["color"] = "red"
    element.style["background-color"] = "#f0f0f0"
    element.style["font-size"] = "16px"

    # Get styles.
    color = element.style["color"]

    # Remove styles.
    del element.style["margin"]
    ```

    Add, find, and navigate elements:

    ```python
    # Append children.
    parent.append(child_element)
    parent.append(child1, child2, child3)  # Multiple at once

    # Find descendants using CSS selectors.
    buttons = parent.find("button")
    items = parent.find(".item-class")

    # Navigate the tree.
    child = parent.children[0]
    parent_elem = child.parent

    # Access children by index or slice.
    first_child = parent[0]
    first_three = parent[0:3]

    # Get a child explicitly by ID. Returns None if not found.
    specific = parent["child-id"]
    ```

    Attach event listeners to elements:

    ```python
    button = web.button("Click me")

    # Use the @when decorator with event name.
    from pyscript import when

    @when("click", button)
    def handle_click(event):
        print("Clicked!")

    # Or use the on_* event directly with @when.
    @when(button.on_click)
    def handle_click(event):
        print("Also works!")

    # Pass handlers during element creation.
    button = web.button("Click", on_click=handle_click)
    ```

    Update multiple properties at once:

    ```python
    element.update(
        classes=["active", "highlighted"],
        style={"color": "red", "font-size": "20px"},
        id="updated-id",
        title="New tooltip"
    )
    ```

    !!! warning
        **Some HTML attributes clash with Python keywords and use trailing
        underscores**.

    Use `for_` instead of `for`, and `class_` instead of `class`.

    ```python
    # The 'for' attribute (on labels)
    label = web.label("Username", for_="username-input")

    # The 'class' attribute (although 'classes' is preferred)
    div.class_ = "my-class"
    ```

    Create copies of elements:

    ```python
    original = web.div("Original content", id="original")
    clone = original.clone(clone_id="cloned")
    ```

    Access the underlying DOM element when needed:

    ```python
    # Most DOM properties and methods are accessible directly.
    element.focus()
    element.scrollIntoView()
    bounding_rect = element.getBoundingClientRect()

    # Or access the raw DOM element.
    dom_element = element._dom_element
    ```
    """

    # Lookup table: tag name -> Element subclass.
    element_classes_by_tag_name = {}

    @classmethod
    def get_tag_name(cls):
        """
        Get the HTML tag name for this class.

        Classes ending with underscore (e.g. `input_`) have it removed to get
        the actual HTML tag name.
        """
        return cls.__name__.replace("_", "")

    @classmethod
    def register_element_classes(cls, element_classes):
        """
        Register `Element` subclasses for tag-based lookup.
        """
        for element_class in element_classes:
            tag_name = element_class.get_tag_name()
            cls.element_classes_by_tag_name[tag_name] = element_class

    @classmethod
    def unregister_element_classes(cls, element_classes):
        """
        Unregister `Element` subclasses from tag-based lookup.
        """
        for element_class in element_classes:
            tag_name = element_class.get_tag_name()
            cls.element_classes_by_tag_name.pop(tag_name, None)

    @classmethod
    def wrap_dom_element(cls, dom_element):
        """
        Wrap a DOM element in the appropriate `Element` subclass.

        Looks up the subclass by tag name. Unknown tags use the base `Element`
        class.
        """
        element_cls = cls.element_classes_by_tag_name.get(
            dom_element.tagName.lower(), cls
        )
        return element_cls(dom_element=dom_element)

    def __init__(self, dom_element=None, classes=None, style=None, **kwargs):
        """
        Create or wrap a DOM element.

        If `dom_element` is `None`, this creates a new element. Otherwise wraps
        the provided DOM element. The `**kwargs` can include HTML attributes
        and event handlers (names starting with `on_`).
        """
        # Create or wrap the DOM element.
        if is_none(dom_element):
            self._dom_element = document.createElement(type(self).get_tag_name())
        else:
            self._dom_element = dom_element
        # Event handling.
        self._on_events = {}
        self.update(classes=classes, style=style, **kwargs)

    def __eq__(self, obj):
        """
        Check equality by comparing underlying DOM elements.
        """
        return isinstance(obj, Element) and obj._dom_element == self._dom_element

    def __getitem__(self, key):
        """
        Get an item within this element.

        Behaviour depends on the key type:

        - Integer: returns the child at that index.
        - Slice: returns a collection of children in that slice.
        - String: looks up an element by id (with or without '#' prefix).

        ```python
        element[0]          # First child.
        element[1:3]        # Second and third children.
        element["my-id"]    # Element with id="my-id" (or None).
        element["#my-id"]   # Same as above (# is optional).
        ```
        """

        if isinstance(key, (int, slice)):
            return self.children[key]
        if isinstance(key, str):
            return _find_by_id(self._dom_element, key)
        raise TypeError(
            f"Element indices must be integers, slices, or strings, "
            f"not {type(key).__name__}."
        )

    def __getattr__(self, name):
        """
        Get an attribute from the element.

        Attributes starting with `on_` return `Event` instances. Other
        attributes are retrieved from the underlying DOM element.
        """
        if name.startswith("on_"):
            return self.get_event(name)
        dom_name = self._normalize_attribute_name(name)
        return getattr(self._dom_element, dom_name)

    def __setattr__(self, name, value):
        """
        Set an attribute on the element.

        Private attributes (starting with `_`) are set on the Python object.
        Public attributes are set on the underlying DOM element. Attributes
        starting with `on_` are treated as events.
        """
        if name.startswith("_"):
            super().__setattr__(name, value)
        elif name.startswith("on_"):
            # Separate events...
            self.get_event(name).add_listener(value)
        else:
            # ...from regular attributes.
            dom_name = self._normalize_attribute_name(name)
            setattr(self._dom_element, dom_name, value)

    def _normalize_attribute_name(self, name):
        """
        Normalize Python attribute names to DOM attribute names.

        Removes trailing underscores and maps special cases.
        """
        if name.endswith("_"):
            name = name[:-1]
        if name == "for":
            return "htmlFor"
        if name == "class":
            return "className"
        return name

    def get_event(self, name):
        """
        Get an `Event` instance for the specified event name.

        Event names must start with `on_` (e.g. `on_click`). Creates and
        caches `Event` instances that are triggered when the DOM event fires.
        """
        if not name.startswith("on_"):
            raise ValueError("Event names must start with 'on_'.")
        event_name = name[3:]  # Remove 'on_' prefix.
        if not hasattr(self._dom_element, event_name):
            raise ValueError(f"Element has no '{event_name}' event.")
        if name in self._on_events:
            return self._on_events[name]
        # Create Event instance and wire it to the DOM event.
        ev = Event()
        self._on_events[name] = ev
        self._dom_element.addEventListener(event_name, create_proxy(ev.trigger))
        return ev

    @property
    def children(self):
        """
        Return this element's children as an `ElementCollection`.
        """
        return ElementCollection.wrap_dom_elements(self._dom_element.children)

    @property
    def classes(self):
        """
        Return the element's CSS classes as a `set`-like `Classes` object.

        Supports set operations: `add`, `remove`, `discard`, `clear`.
        Check membership with `in`, iterate with `for`, get length with `len()`.

        ```python
        element.classes.add("active")
        if "disabled" in element.classes:
            ...
        ```
        """
        if not hasattr(self, "_classes"):
            self._classes = Classes(self)
        return self._classes

    @property
    def style(self):
        """
        Return the element's CSS styles as a `dict`-like `Style` object.

        Access using `dict`-style syntax with standard
        [CSS property names (hyphenated)](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference).

        ```python
        element.style["background-color"] = "red"
        element.style["font-size"] = "16px"
        del element.style["margin"]
        ```
        """
        if not hasattr(self, "_style"):
            self._style = Style(self)
        return self._style

    @property
    def parent(self):
        """
        Return this element's parent `Element`, or `None`.
        """
        if is_none(self._dom_element.parentElement):
            return None
        return Element.wrap_dom_element(self._dom_element.parentElement)

    def append(self, *items):
        """
        Append items to this element's `children`.

        Accepts `Element` instances, `ElementCollection` instances, lists,
        tuples, raw DOM elements, and NodeLists.
        """
        for item in items:
            if isinstance(item, Element):
                self._dom_element.appendChild(item._dom_element)
            elif isinstance(item, ElementCollection):
                for element in item:
                    self._dom_element.appendChild(element._dom_element)
            elif isinstance(item, (list, tuple)):
                for child in item:
                    self.append(child)
            elif hasattr(item, "tagName"):
                # Raw DOM element.
                self._dom_element.appendChild(item)
            elif hasattr(item, "length"):
                # NodeList or similar iterable.
                for element in item:
                    self._dom_element.appendChild(element)
            else:
                raise TypeError(f"Cannot append {type(item).__name__} to element.")

    def clone(self, clone_id=None):
        """
        Clone this element and its underlying DOM element.

        Optionally assign a new `id` to the clone.
        """
        clone = Element.wrap_dom_element(self._dom_element.cloneNode(True))
        clone.id = clone_id
        return clone

    def find(self, selector):
        """
        Find all descendant elements matching the
        [CSS `selector`](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Selectors).

        Returns an `ElementCollection` (possibly empty).

        ```python
        element.find("div")              # All div descendants.
        element.find(".my-class")        # All elements with class.
        element.find("#my-id")           # Element with id (as collection).
        element.find("div.my-class")     # All divs with class.
        ```
        """
        return _find_and_wrap(self._dom_element, selector)

    def show_me(self):
        """
        Scroll this element into view.
        """
        self._dom_element.scrollIntoView()

    def update(self, classes=None, style=None, **kwargs):
        """
        Update this element's `classes`, `style`, and `attributes`
        (via arbitrary `**kwargs`).

        Convenience method for bulk updates.
        """
        if classes:
            if isinstance(classes, str):
                self.classes.add(classes)
            else:
                for class_name in classes:
                    self.classes.add(class_name)
        if style:
            for key, value in style.items():
                self.style[key] = value
        for name, value in kwargs.items():
            setattr(self, name, value)


class Classes(set):
    """
    Behaves like a Python `set` with changes automatically reflected in the
    element's `classList`.

    ```python
    # Add and remove classes.
    element.classes.add("active")
    element.classes.remove("inactive")
    element.classes.discard("maybe-missing")  # No error if absent.

    # Check membership.
    if "active" in element.classes:
        print("Element is active")

    # Clear all classes.
    element.classes.clear()

    # Iterate over classes.
    for cls in element.classes:
        print(cls)
    ```
    """

    def __init__(self, element):
        """Initialise the Classes set for the given element."""
        self._class_list = element._dom_element.classList
        super().__init__(self._class_list)

    def _extract_class_names(self, class_name):
        """
        If the class_name contains several class names separated by spaces,
        split them and return as a list. Otherwise, return the class_name as is
        in a list.
        """
        return (
            [name for name in class_name.split() if name]
            if " " in class_name
            else [class_name]
        )

    def add(self, class_name):
        """Add a class."""
        for name in self._extract_class_names(class_name):
            super().add(name)
            self._class_list.add(name)

    def remove(self, class_name):
        """Remove a class."""
        for name in self._extract_class_names(class_name):
            super().remove(name)
            self._class_list.remove(name)

    def discard(self, class_name):
        """Remove a class if present."""
        for name in self._extract_class_names(class_name):
            super().discard(name)
            if name in self._class_list:
                self._class_list.remove(name)

    def clear(self):
        """Remove all classes."""
        super().clear()
        while self._class_list.length > 0:
            self._class_list.remove(self._class_list.item(0))


class Style(dict):
    """
    Behaves like a Python `dict` with changes automatically reflected in the
    element's `style` attribute.

    ```python
    # Set and get styles using CSS property names (hyphenated).
    element.style["color"] = "red"
    element.style["background-color"] = "#f0f0f0"
    element.style["font-size"] = "16px"

    # Get a style value.
    color = element.style["color"]

    # Remove a style.
    del element.style["margin"]

    # Check if a style is set.
    if "color" in element.style:
        print(f"Color is {element.style['color']}")
    ```
    """

    def __init__(self, element):
        """Initialise the Style dict for the given element."""
        self._style = element._dom_element.style
        super().__init__()

    def __setitem__(self, key, value):
        """Set a style property."""
        super().__setitem__(key, value)
        self._style.setProperty(key, str(value))

    def __delitem__(self, key):
        """Remove a style property."""
        super().__delitem__(key)
        self._style.removeProperty(key)


class HasOptions:
    """
    Mixin for elements with options (`datalist`, `optgroup`, `select`).

    Provides an `options` property that returns an `Options` instance. Used
    in conjunction with the `Options` class.

    ```python
    # Get a select element and work with its options.
    select = web.page["my-select"]

    # Add options.
    select.options.add(value="1", html="Option 1")
    select.options.add(value="2", html="Option 2", selected=True)

    # Get the selected option.
    selected = select.options.selected

    # Iterate over options.
    for option in select.options:
        print(f"{option.value}: {option.innerHTML}")

    # Clear all options.
    select.options.clear()
    ```
    """

    @property
    def options(self):
        """Return this element's options as an `Options` instance."""
        if not hasattr(self, "_options"):
            self._options = Options(self)
        return self._options


class Options:
    """
    Interface to the options of a `datalist`, `optgroup`, or `select` element.

    Supports adding, removing, and accessing option elements. Used in
    conjunction with the `HasOptions` mixin.

    ```python
    # Add options to a select element.
    select.options.add(value="1", html="Option 1")
    select.options.add(value="2", html="Option 2", selected=True)

    # Insert option at specific position.
    select.options.add(value="1.5", html="Option 1.5", before=1)

    # Access options by index.
    first_option = select.options[0]

    # Get the selected option.
    selected = select.options.selected
    print(f"Selected: {selected.value}")

    # Iterate over all options.
    for option in select.options:
        print(option.innerHTML)

    # Remove option by index.
    select.options.remove(0)

    # Clear all options.
    select.options.clear()
    ```
    """

    def __init__(self, element):
        self._element = element

    def __getitem__(self, key):
        return self.options[key]

    def __iter__(self):
        yield from self.options

    def __len__(self):
        return len(self.options)

    def __repr__(self):
        return f"{self.__class__.__name__} (length: {len(self)}) " f"{self.options}"

    @property
    def options(self):
        """
        Return the list of option elements.
        """
        return [Element.wrap_dom_element(o) for o in self._element._dom_element.options]

    @property
    def selected(self):
        """
        Return the currently selected option.
        """
        return self.options[self._element._dom_element.selectedIndex]

    def add(self, value=None, html=None, text=None, before=None, **kwargs):
        """
        Add a new option to the element.

        Can specify `value`, `html` content, and `text`. The `before` parameter can
        be an `Element` or index to insert before. The `**kwargs` are additional
        arbitrary attributes for the new option element.
        """
        if value:
            kwargs["value"] = value
        if html:
            kwargs["innerHTML"] = html
        if text:
            kwargs["text"] = text

        # The `option` element class is dynamically created below.
        new_option = option(**kwargs)  # noqa: F821

        if before and isinstance(before, Element):
            before = before._dom_element

        self._element._dom_element.add(new_option._dom_element, before)

    def clear(self):
        """
        Remove all options.
        """
        self._element._dom_element.length = 0

    def remove(self, index):
        """
        Remove the option at the specified `index`.
        """
        self._element._dom_element.remove(index)


class ContainerElement(Element):
    """
    Base class for elements that can contain other elements.

    Extends `Element` with convenient child handling during initialization.

    ```python
    from pyscript import web


    # Create with child elements as arguments.
    div = web.div(
        web.h1("Title"),
        web.p("Paragraph 1"),
        web.p("Paragraph 2")
    )

    # Or use the children keyword argument.
    div = web.div(children=[web.p("Child 1"), web.p("Child 2")])

    # Mix elements and HTML strings.
    div = web.div(
        web.h1("Title"),
        "<p>HTML content</p>",
        web.button("Click me")
    )

    # Iterate over children.
    for child in div:
        print(child.innerHTML)
    ```
    """

    def __init__(
        self, *args, children=None, dom_element=None, style=None, classes=None, **kwargs
    ):
        """
        Create a container element with optional `children`.

        Children can be passed as positional `*args` or via the `children`
        keyword argument. String children are inserted as unescaped HTML. The
        `style`, `classes`, and `**kwargs` are passed to the base `Element`
        initializer.
        """
        super().__init__(
            dom_element=dom_element, style=style, classes=classes, **kwargs
        )

        for child in list(args) + (children or []):
            if isinstance(child, (Element, ElementCollection)):
                self.append(child)
            else:
                self._dom_element.insertAdjacentHTML("beforeend", child)

    def __iter__(self):
        yield from self.children


class ElementCollection:
    """
    A collection of Element instances with `list`-like operations.

    Supports iteration, indexing, slicing, and finding descendants.
    For bulk operations, iterate over the collection explicitly or use
    the `update_all` method.

    ```python
    # Get a collection of elements.
    items = web.page.find(".item")

    # Access by index.
    first = items[0]
    last = items[-1]

    # Slice the collection.
    subset = items[1:3]

    # Look up a specific element by id (returns None if not found).
    specific = items["item-id"]

    # Iterate over elements.
    for item in items:
        item.innerHTML = "Updated"
        item.classes.add("processed")

    # Bulk update all contained elements.
    items.update_all(innerHTML="Hello", className="updated")

    # Find matches within the collection.
    buttons = items.find("button")

    # Get the count.
    count = len(items)
    ```
    """

    @classmethod
    def wrap_dom_elements(cls, dom_elements):
        """
        Wrap an iterable of DOM elements in an `ElementCollection`.
        """
        return cls(
            [Element.wrap_dom_element(dom_element) for dom_element in dom_elements]
        )

    def __init__(self, elements):
        self._elements = elements

    def __eq__(self, obj):
        """
        Check equality by comparing elements.
        """
        return isinstance(obj, ElementCollection) and obj._elements == self._elements

    def __getitem__(self, key):
        """
        Get items from the collection.

        Behaviour depends on the key type:

        - Integer: returns the element at that index.
        - Slice: returns a new collection with elements in that slice.
        - String: looks up an element by id (with or without '#' prefix).

        ```python
        collection[0]          # First element.
        collection[1:3]        # New collection with 2nd and 3rd elements.
        collection["my-id"]    # Element with id="my-id" (or None).
        collection["#my-id"]   # Same as above (# is optional).
        ```
        """
        if isinstance(key, int):
            return self._elements[key]
        if isinstance(key, slice):
            return ElementCollection(self._elements[key])
        if isinstance(key, str):
            for element in self._elements:
                result = _find_by_id(element._dom_element, key)
                if result:
                    return result
            return None
        raise TypeError(
            f"Collection indices must be integers, slices, or strings, "
            f"not {type(key).__name__}"
        )

    def __iter__(self):
        yield from self._elements

    def __len__(self):
        return len(self._elements)

    def __repr__(self):
        return (
            f"{self.__class__.__name__} (length: {len(self._elements)}) "
            f"{self._elements}"
        )

    @property
    def elements(self):
        """
        Return the underlying `list` of elements.
        """
        return self._elements

    def find(self, selector):
        """
        Find all descendants matching the
        [CSS `selector`](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Selectors).

        Searches within all elements in the collection.

        ```python
        collection.find("div")           # All div descendants.
        collection.find(".my-class")     # All elements with class.
        collection.find("#my-id")        # Element with id (as collection).
        ```
        """
        elements = []
        for element in self._elements:
            elements.extend(_find_and_wrap(element._dom_element, selector))
        return ElementCollection(elements)

    def update_all(self, **kwargs):
        """
        Explicitly update all elements with the given attributes.

        ```python
        collection.update_all(innerHTML="Hello")
        collection.update_all(className="active", title="Updated")
        ```
        """
        for element in self._elements:
            for name, value in kwargs.items():
                setattr(element, name, value)


# Special elements with custom methods and mixins.


class canvas(ContainerElement):
    """
    A bespoke
    [HTML canvas element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas)
    with Pythonic drawing and download capabilities.
    """

    def download(self, filename="snapped.png"):
        """
        Download the canvas content as an image file.

        Creates a temporary download link and triggers it.
        """
        # The `a` element class is dynamically created below.
        download_link = a(  # noqa: F821
            download=filename, href=self._dom_element.toDataURL()
        )
        self.append(download_link)
        download_link._dom_element.click()

    def draw(self, what, width=None, height=None):
        """
        Draw a 2d image source (`what`) onto the canvas. Optionally scale to
        `width` and `height`.

        Accepts canvas image sources: `HTMLImageElement`, `SVGImageElement`,
        `HTMLVideoElement`, `HTMLCanvasElement`, `ImageBitmap`,
        `OffscreenCanvas`, or `VideoFrame`.
        """
        if isinstance(what, Element):
            what = what._dom_element

        ctx = self._dom_element.getContext("2d")
        if width or height:
            ctx.drawImage(what, 0, 0, width, height)
        else:
            ctx.drawImage(what, 0, 0)


class video(ContainerElement):
    """
    A bespoke
    [HTML video element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video)
    with Pythonic snapshot capability (to render an image to a canvas).
    """

    def snap(self, to=None, width=None, height=None):
        """
        Capture a video frame `to` a canvas element. Optionally scale to
        `width` and `height`.

        If no canvas is provided, this will create one. The to parameter
        can be a canvas Element, raw DOM canvas, or CSS selector string.
        """
        width = width if width else self.videoWidth
        height = height if height else self.videoHeight
        if is_none(to):
            to = canvas(width=width, height=height)
        elif isinstance(to, Element):
            if to.tag != "canvas":
                raise TypeError("Element to snap to must be a canvas.")
        elif getattr(to, "tagName", "") == "CANVAS":
            to = canvas(dom_element=to)
        elif isinstance(to, str):
            nodelist = document.querySelectorAll(to)
            if nodelist.length == 0:
                raise TypeError(f"No element with selector {to} to snap to.")
            if nodelist[0].tagName != "CANVAS":
                raise TypeError("Element to snap to must be a canvas.")
            to = canvas(dom_element=nodelist[0])
        to.draw(self, width, height)
        return to


class datalist(ContainerElement, HasOptions):
    """
    HTML datalist element with options support.

    Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/datalist
    """


class optgroup(ContainerElement, HasOptions):
    """
    HTML optgroup element with options support.

    Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/optgroup
    """


class select(ContainerElement, HasOptions):
    """
    HTML select element with options support.

    Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select
    """


# Container elements that can have children.
# Note: canvas, video, datalist, optgroup, and select are defined above
# with special implementations due to the HasOptions mixin.
# fmt: off
CONTAINER_TAGS = [
    "a", "abbr", "address", "article", "aside", "audio",
    "b", "blockquote", "body", "button",
    "caption", "cite", "code", "colgroup",
    "data", "dd", "del", "details", "dialog", "div", "dl", "dt",
    "em",
    "fieldset", "figcaption", "figure", "footer", "form",
    "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "html",
    "i", "iframe", "ins",
    "kbd",
    "label", "legend", "li",
    "main", "map", "mark", "menu", "meta", "meter",
    "nav",
    "object", "ol", "option", "output",
    "p", "param", "picture", "pre", "progress",
    "q",
    "s", "script", "section", "small", "span", "strong", "style",
    "sub", "summary", "sup",
    "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead",
    "time", "title", "tr",
    "u", "ul",
    "var",
    "wbr",
]
"""
Container elements that can have children. Each becomes a class in the
`pyscript.web` namespace and corresponds to an HTML tag.
"""
# fmt: on

# Void elements that cannot have children.
VOID_TAGS = [
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "source",
    "track",
]
"""
Void elements that cannot have children. Each becomes a class in the
`pyscript.web` namespace and corresponds to an HTML tag.
"""


def _create_element_classes():
    """
    Create element classes dynamically and register them.

    Generates classes for all standard HTML elements, using the appropriate
    base class (ContainerElement or Element) for each tag.
    """
    # The existing special element classes defined above.
    classes = [canvas, video, datalist, optgroup, select]
    for tag in CONTAINER_TAGS:
        # Tags that clash with Python keywords get a trailing underscore.
        class_name = f"{tag}_" if tag in ("del", "map", "object") else tag
        doc = (
            f"HTML <{tag}> element. "
            f"Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/"
            f"Element/{tag}"
        )
        cls = type(class_name, (ContainerElement,), {"__doc__": doc})
        globals()[class_name] = cls
        classes.append(cls)
    for tag in VOID_TAGS:
        class_name = f"{tag}_" if tag == "input" else tag
        doc = (
            f"HTML <{tag}> element. "
            f"Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/"
            f"Element/{tag}"
        )
        cls = type(class_name, (Element,), {"__doc__": doc})
        globals()[class_name] = cls
        classes.append(cls)
    Element.register_element_classes(classes)


# Initialize element classes at module load time. :-)
_create_element_classes()


class Page:
    """
    Represents the current web page.

    Provides access to the document's `html`, `head`, and `body` elements,
    plus convenience methods for finding elements and appending to the body.

    ```python
    from pyscript import web


    # Access page structure.
    web.page.html  # The <html> element.
    web.page.head  # The <head> element.
    web.page.body  # The <body> element.

    # Get and set page title.
    web.page.title = "New Title"
    print(web.page.title)

    # Find elements by CSS selector.
    divs = web.page.find("div")
    items = web.page.find(".item-class")

    # Look up element by id.
    element = web.page["my-id"]
    element = web.page["#my-id"]  # The "#" prefix is optional.

    # Append to the body (shortcut for page.body.append).
    web.page.append(web.div("Hello"))
    ```
    """

    def __init__(self):
        self.html = Element.wrap_dom_element(document.documentElement)
        self.body = Element.wrap_dom_element(document.body)
        self.head = Element.wrap_dom_element(document.head)

    def __getitem__(self, key):
        """
        Look up an element by id.

        The '#' prefix is optional and will be stripped if present.
        Returns None if no element with that id exists.

        ```python
        page["my-id"]      # Element with id="my-id" (or None)
        page["#my-id"]     # Same as above (# is optional)
        ```
        """
        return _find_by_id(document, key)

    @property
    def title(self):
        """
        Get the page `title`.
        """
        return document.title

    @title.setter
    def title(self, value):
        """
        Set the page `title`.
        """
        document.title = value

    def append(self, *items):
        """
        Append items to the page `body`.

        Shortcut for `page.body.append(*items)`.
        """
        self.body.append(*items)

    def find(self, selector):
        """
        Find all elements matching the
        [CSS `selector`](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Selectors).

        Returns an `ElementCollection` of matching elements.

        ```python
        page.find("div")              # All divs on the page
        page.find(".my-class")        # All elements with class
        page.find("#my-id")           # Element with id (as collection)
        page.find("div.my-class")     # All divs with class
        ```
        """
        return _find_and_wrap(document, selector)


page = Page()
"""A reference to the current web page. An instance of the `Page` class."""

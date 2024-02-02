from textwrap import dedent

from pyscript import document, when, window
from pyweb import JSProperty, js_property, pydom

# Global attributes that all elements have (this list is a subset of the official one)
# and tries to capture the most used ones
GLOBAL_ATTRIBUTES = [
    "accesskey",
    "autocapitalize",
    "autofocus",
    "draggable",
    "enterkeyhint",
    "hidden",
    "id",
    "lang",
    "nonce",
    "part",
    "popover",
    "slot",
    "spellcheck",
    "tabindex",
    "title",
    "translate",
    "virtualkeyboardpolicy",
    "className",
]

# class and style are different ones that are handled by pydom.element directly


class ElementBase(pydom.Element):
    tag = "div"

    def __init__(self, style=None, **kwargs):
        super().__init__(document.createElement(self.tag))

        # set all the style properties provided in input
        if style:
            for key, value in style.items():
                self.style[key] = value

        # IMPORTANT!!! This is used to auto-harvest all input arguments and set them as properties
        self._init_properties(**kwargs)

    def _init_properties(self, **kwargs):
        """Set all the properties (of type JSProperties) provided in input as properties
        of the class instance.

        Args:
            **kwargs: The properties to set
        """
        # Look at all the properties of the class and see if they were provided in kwargs
        for attr_name, attr in self.__class__.__dict__.items():
            # For each one, actually check if it is a property of the class and set it
            if isinstance(attr, JSProperty) and attr_name in kwargs:
                setattr(self, attr_name, kwargs[attr_name])


class TextElementBase(ElementBase):
    def __init__(self, content=None, style=None, **kwargs):
        super().__init__(style=style, **kwargs)

        # If it's an element, append the element
        if isinstance(content, pydom.Element):
            self.append(content)
        # If it's a list of elements
        elif isinstance(content, list):
            for item in content:
                self.append(item)
        # If the content wasn't set just ignore
        elif content is None:
            pass
        else:
            # Otherwise, set content as the html of the element
            self.html = content


def _add_js_properties(cls, *attrs):
    """Add JSProperties to a class as `js_property` class attributes."""
    # First we set all the global properties as JSProperties
    for attr in GLOBAL_ATTRIBUTES:
        setattr(cls, attr, js_property(attr))

    # Now the specific class properties
    for attr in attrs:
        setattr(cls, attr, js_property(attr))

    # Now we patch the __init__ method to specify the properties
    cls.__init__.__doc__ = f"""Class constructor.

    Args:


        * content: The content of the element (can be a string, a list of elements or a single element)
        * style: The style of the element (a dictionary)
        * All the properties of the class: {attrs}

        """


class a(TextElementBase):
    tag = "a"


_add_js_properties(a, "download", "href", "referrerpolicy", "rel", "target", "type")


class button(TextElementBase):
    tag = "button"

    # JS Properties
    autofocus = js_property("autofocus")
    disabled = js_property("disabled")
    name = js_property("name")
    type = js_property("type")
    value = js_property("value")


class h1(TextElementBase):
    tag = "h1"


class h2(TextElementBase):
    tag = "h2"


class h3(TextElementBase):
    tag = "h3"


class link(TextElementBase):
    tag = "link"

    rel = js_property("rel")
    type = js_property("type")
    href = js_property("href")
    media = js_property("media")

    def __init__(
        self,
        content=None,
        rel=None,
        type=None,
        href=None,
        media=None,
        style=None,
        **kwargs,
    ):
        super().__init__(
            content=content,
            rel=rel,
            type=type,
            href=href,
            media=media,
            style=style,
            **kwargs,
        )


class style(TextElementBase):
    tag = "style"

    blocking = js_property("blocking")
    title = js_property("title")
    nonce = js_property("nonce")
    media = js_property("media")

    def __init__(
        self,
        content=None,
        blocking=None,
        title=None,
        nonce=None,
        media=None,
        style=None,
        **kwargs,
    ):
        super().__init__(
            content=content,
            blocking=blocking,
            title=title,
            nonce=nonce,
            media=media,
            style=style,
            **kwargs,
        )


class script(TextElementBase):
    tag = "script"

    async_ = js_property("async")
    defer = js_property("defer")
    blocking = js_property("blocking")
    crossorigin = js_property("crossorigin")
    fetchpriority = js_property("fetchpriority")
    src = js_property("src")
    type = js_property("type")
    nonce = js_property("nonce")
    nomodule = js_property("nomodule")
    integrity = js_property("integrity")

    def __init__(
        self,
        content=None,
        src=None,
        type=None,
        async_=None,
        defer=None,
        blocking=None,
        crossorigin=None,
        fetchpriority=None,
        nonce=None,
        nomodule=None,
        integrity=None,
        style=None,
        **kwargs,
    ):
        super().__init__(
            content=content,
            src=src,
            type=type,
            async_=async_,
            defer=defer,
            blocking=blocking,
            crossorigin=crossorigin,
            fetchpriority=fetchpriority,
            nonce=nonce,
            nomodule=nomodule,
            integrity=integrity,
            style=style,
            **kwargs,
        )


class p(TextElementBase):
    tag = "p"


class code(TextElementBase):
    tag = "code"


class pre(TextElementBase):
    tag = "pre"


class strong(TextElementBase):
    tag = "strong"


class small(TextElementBase):
    tag = "small"


class br(ElementBase):
    tag = "br"


class div(TextElementBase):
    tag = "div"


_add_js_properties(div)


class img(ElementBase):
    tag = "img"
    src = js_property("src")
    # TODO: This should probably go on the ElementBase class since it's a global attribute
    # https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/slot
    slot = js_property("slot")

    def __init__(self, src, alt="", style=None, **kwargs):
        super().__init__(src=src, alt=alt, style=style, **kwargs)


class Grid(ElementBase):
    tag = "div"

    def __init__(self, layout="", gap=None, **kwargs):
        super().__init__(**kwargs)
        self.style["display"] = "grid"
        self.style["grid-template-columns"] = layout

        # TODO: This should be a property
        if not gap is None:
            self.style["gap"] = gap


class input(ElementBase):
    tag = "input"

    # JS Properties
    autofocus = js_property("autofocus")
    alt = js_property("alt")
    autocapitalize = js_property("autocapitalize")
    autocomplete = js_property("autocomplete")
    checked = js_property("checked")
    disabled = js_property("disabled")
    name = js_property("name")
    type = js_property("type")
    value = js_property("value")
    placeholder = js_property("placeholder")

    # TODO: This is by anymeans complete!! We need to add more attributes

    def __init__(self, style=None, **kwargs):
        super().__init__(style=style, **kwargs)

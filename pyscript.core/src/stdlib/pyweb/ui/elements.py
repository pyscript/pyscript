from textwrap import dedent

from pyweb import JSProperty, js_property, pydom

from pyscript import document, when, window

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


# IMPORTANT: For all HTML components defined below, we are not mapping all
# available attributes, only the global ones


class a(TextElementBase):
    tag = "a"


# Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#attributes
_add_js_properties(a, "download", "href", "referrerpolicy", "rel", "target", "type")


class abbr(ElementBase):
    tag = "abbr"


# br tags only have the global attributes ones (others have been deprecated)
_add_js_properties(abbr)


class address(ElementBase):
    tag = "address"


# br tags only have the global attributes ones (others have been deprecated)
_add_js_properties(address)


class area(ElementBase):
    tag = "area"


# br tags only have the global attributes ones (others have been deprecated)
_add_js_properties(area, "alt", "coords", "download", "href", "ping", "referrerpolicy",
                   "rel", "shape", "target")


class article(ElementBase):
    tag = "article"


# br tags only have the global attributes ones (others have been deprecated)
_add_js_properties(article)


class aside(ElementBase):
    tag = "aside"


# br tags only have the global attributes ones (others have been deprecated)
_add_js_properties(aside)


class audio(ElementBase):
    tag = "audio"


# br tags only have the global attributes ones (others have been deprecated)
_add_js_properties(audio, "autoplay", "controls", "controlslist", "crossorigin",
                   "disableremoteplayback", "loop", "muted", "preload", "src")


class b(ElementBase):
    tag = "b"


# br tags only have the global attributes ones (others have been deprecated)
_add_js_properties(b)


class blockquote(ElementBase):
    tag = "blockquote"


# br tags only have the global attributes ones (others have been deprecated)
_add_js_properties(blockquote, "cite")


class br(ElementBase):
    tag = "br"


# br tags only have the global attributes ones (others have been deprecated)
_add_js_properties(br)


class button(TextElementBase):
    tag = "button"


# https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#attributes
_add_js_properties(
    button,
    "autofocus",
    "disabled",
    "form",
    "formaction",
    "formenctype",
    "formmethod",
    "formnovalidate",
    "formtarget",
    "name",
    "type",
    "value",
)


class canvas(ElementBase):
    tag = "canvas"


# br tags only have the global attributes ones (others have been deprecated)
_add_js_properties(canvas, "height", "width")


class caption(ElementBase):
    tag = "caption"


# br tags only have the global attributes ones (others have been deprecated)
_add_js_properties(caption)


class cite(TextElementBase):
    tag = "cite"


# br tags only have the global attributes ones (others have been deprecated)
_add_js_properties(cite)


class code(TextElementBase):
    tag = "code"


# code tags only have the global attributes ones
_add_js_properties(code)


class data(TextElementBase):
    tag = "data"


# code tags only have the global attributes ones
_add_js_properties(data, 'value')


class datalist(TextElementBase):
    tag = "datalist"


# code tags only have the global attributes ones
_add_js_properties(datalist)


class dd(TextElementBase):
    tag = "dd"


# code tags only have the global attributes ones
_add_js_properties(dd, 'value')


class details(TextElementBase):
    tag = "details"


# code tags only have the global attributes ones
_add_js_properties(details)


class dialog(TextElementBase):
    tag = "dialog"


# code tags only have the global attributes ones
_add_js_properties(dialog, 'open')


class datalist(TextElementBase):
    tag = "datalist"


# code tags only have the global attributes ones
_add_js_properties(datalist)


class div(TextElementBase):
    tag = "div"

# div tags only have the global attributes ones (others have been deprecated)
_add_js_properties(div)


class dl(TextElementBase):
    tag = "dl"

# code tags only have the global attributes ones
_add_js_properties(dl, 'value')


class dt(TextElementBase):
    tag = "dt"


# code tags only have the global attributes ones
_add_js_properties(dt, 'value')



class em(TextElementBase):
    tag = "em"


# code tags only have the global attributes ones
_add_js_properties(em, 'value')


class img(ElementBase):
    tag = "img"


# https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attributes
_add_js_properties(
    img,
    "alt",
    "crossorigin",
    "decoding",
    "fetchpriority",
    "height",
    "ismap",
    "loading",
    "referrerpolicy",
    "sizes",
    "src",
    "width",
)


# NOTE: Input is a reserved keyword in Python, so we use input_ instead
class input_(ElementBase):
    tag = "input"


# https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attributes
_add_js_properties(
    input_,
    "accept",
    "alt",
    "autofocus",
    "capture",
    "checked",
    "dirname",
    "disabled",
    "form",
    "formaction",
    "formenctype",
    "formmethod",
    "formnovalidate",
    "formtarget",
    "height",
    "list",
    "max",
    "maxlength",
    "min",
    "minlength",
    "multiple",
    "name",
    "pattern",
    "placeholder",
    "popovertarget",
    "popovertargetaction",
    "readonly",
    "required",
    "size",
    "src",
    "step",
    "type",
    "value",
    "width",
)


class h1(TextElementBase):
    tag = "h1"


# https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Heading_Elements#attributes
# Heading elements only have global attributes
_add_js_properties(h1)


class h2(TextElementBase):
    tag = "h2"


_add_js_properties(h2)


class h3(TextElementBase):
    tag = "h3"


_add_js_properties(h3)


class h4(TextElementBase):
    tag = "h4"


_add_js_properties(h4)


class h5(TextElementBase):
    tag = "h5"


_add_js_properties(h5)


class h6(TextElementBase):
    tag = "h6"


_add_js_properties(h6)


class link(TextElementBase):
    tag = "link"


# https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link#attributes
_add_js_properties(
    link,
    "as",
    "crossorigin",
    "disabled",
    "fetchpriority",
    "href",
    "imagesizes",
    "imagesrcset",
    "integrity",
    "media",
    "rel",
    "referrerpolicy",
    "sizes",
    "title",
    "type",
)


class p(TextElementBase):
    tag = "p"


# p tags only have the global attributes ones
_add_js_properties(p)


class pre(TextElementBase):
    tag = "pre"


# pre tags only have the global attributes ones (others have been deprecated)
_add_js_properties(pre)


class style(TextElementBase):
    tag = "style"


# https://developer.mozilla.org/en-US/docs/Web/HTML/Element/style#attributes
_add_js_properties(style, "blocking", "media", "nonce", "title")


class script(TextElementBase):
    tag = "script"

    # Let's add async manually since it's a reserved keyword in Python
    async_ = js_property("async")


# https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#attributes
_add_js_properties(
    script,
    "blocking",
    "crossorigin",
    "defer",
    "fetchpriority",
    "integrity",
    "nomodule",
    "nonce",
    "referrerpolicy",
    "src",
    "type",
)


class small(TextElementBase):
    tag = "small"


# small tags only have the global attributes ones
_add_js_properties(small)


class strong(TextElementBase):
    tag = "strong"


class main(TextElementBase):
    tag = "main"


# strong tags only have the global attributes ones
_add_js_properties(strong)


# Custom Elements
class grid(TextElementBase):
    tag = "div"

    def __init__(self, layout, content=None, gap=None, **kwargs):
        super().__init__(content, **kwargs)
        self.style["display"] = "grid"
        self.style["grid-template-columns"] = layout

        # TODO: This should be a property
        if not gap is None:
            self.style["gap"] = gap

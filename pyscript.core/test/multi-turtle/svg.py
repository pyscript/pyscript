"""
A rewrite of Brython's SVG module, to remove JavaScript / document related
interactions (so this can be used within a web worker, where document is not
conveniently available).

Author: Nicholas H.Tollervey (ntollervey@anaconda.com)
Based on original work by: Romain Casati

License: GPL v3 or higher.
"""


class Node:
    """
    Represents a node in the DOM.
    """

    def __init__(self, **kwargs):
        self._node = kwargs
        self.parent = kwargs.get("parent")

    @property
    def outerHTML(self):
        """
        Get a string representation of the element's outer HTML.
        """
        return NotImplemented


class ElementNode(Node):
    """
    An element defined by a tag, may have attributes and children.
    """

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.tagName = kwargs["tagName"]
        self.attributes = kwargs.get("attributes", {})
        self.value = kwargs.get("value")
        self.childNodes = []

    def appendChild(self, child):
        """
        Add a child node to the children of this node. Using DOM API naming
        conventions.
        """
        child.parent = self
        self.childNodes.append(child)

    def setAttribute(self, key, value):
        """
        Sets an attribute on the node.
        """
        self.attributes[key] = value

    @property
    def outerHTML(self):
        """
        Get a string representation of the element's outer HTML. Using DOM API
        naming conventions.
        """
        result = "<" + self.tagName
        for attr, val in self.attributes.items():
            result += " " + attr + '="' + str(val) + '"'
        result += ">"
        result += self.innerHTML
        result += "</" + self.tagName + ">"
        return result

    @property
    def innerHTML(self):
        """
        Get a string representation of the element's inner HTML. Using DOM API
        naming conventions.
        """
        result = ""
        for child in self.childNodes:
            result += child.outerHTML
        return result


class TextNode(Node):
    """
    Textual content inside an ElementNode.
    """

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.nodeValue = kwargs.get("nodeValue")

    @property
    def outerHTML(self):
        """
        Get a string representation of the element's outer HTML.
        """
        return self.nodeValue


_svg_ns = "http://www.w3.org/2000/svg"
_xlink_ns = "http://www.w3.org/1999/xlink"


def _tag_func(tag):
    def func(*args, **kwargs):
        node = ElementNode(tagName=tag)
        # this is mandatory to display svg properly
        if tag == "svg":
            node.setAttribute("xmlns", _svg_ns)
        for arg in args:
            if isinstance(arg, (str, int, float)):
                arg = TextNode(nodeValue=str(arg))
            node.appendChild(arg)
        for key, value in kwargs.items():
            key = key.lower()
            if key[0:2] == "on":
                # Ignore event handlers within the SVG. This shouldn't happen.
                pass
            elif key == "style":
                node.setAttribute(
                    "style", ";".join(f"{k}: {v}" for k, v in value.items())
                )
            elif value is not False:
                node.setAttribute(key.replace("_", "-"), str(value))
        return node

    return func


a = _tag_func("a")
altGlyph = _tag_func("altGlyph")
altGlyphDef = _tag_func("altGlyphDef")
altGlyphItem = _tag_func("altGlyphItem")
animate = _tag_func("animate")
animateColor = _tag_func("animateColor")
animateMotion = _tag_func("animateMotion")
animateTransform = _tag_func("animateTransform")
circle = _tag_func("circle")
clipPath = _tag_func("clipPath")
color_profile = _tag_func("color_profile")
cursor = _tag_func("cursor")
defs = _tag_func("defs")
desc = _tag_func("desc")
ellipse = _tag_func("ellipse")
feBlend = _tag_func("feBlend")
foreignObject = _tag_func("foreignObject")
g = _tag_func("g")
image = _tag_func("image")
line = _tag_func("line")
linearGradient = _tag_func("linearGradient")
marker = _tag_func("marker")
mask = _tag_func("mask")
path = _tag_func("path")
pattern = _tag_func("pattern")
polygon = _tag_func("polygon")
polyline = _tag_func("polyline")
radialGradient = _tag_func("radialGradient")
rect = _tag_func("rect")
set = _tag_func("set")
stop = _tag_func("stop")
svg = _tag_func("svg")
text = _tag_func("text")
tref = _tag_func("tref")
tspan = _tag_func("tspan")
use = _tag_func("use")

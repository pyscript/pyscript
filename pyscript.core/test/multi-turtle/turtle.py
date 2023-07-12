"""
A port of Basthon's Turtle module for PyScript (it works with both Pyodide
and MicroPython interpreters), by Nicholas H.Tollervey under the GPLv3
License. ntollervey@anaconda.com

A port of the Brython's Turtle module to Basthon by Romain Casati
under the GPLv3 License.

A revised version of CPython's turtle module written for Brython

Note: This version is not intended to be used in interactive mode,
nor use help() to look up methods/functions definitions. The docstrings
have thus been shortened considerably as compared with the CPython's version.

All public methods/functions of the CPython version should exist, if only
to print out a warning that they are not implemented. The intent is to make
it easier to "port" any existing turtle program from CPython to the browser.

IMPORTANT: We use SVG for drawing turtles. If we have a turtle at an angle
of 350 degrees and we rotate it by an additional 20 degrees, we will have
a turtle at an angle of 370 degrees.  For turtles drawn periodically on
a screen (like typical animations, including the CPython turtle module),
drawing a turtle with a rotation of 370 degrees is the same as a rotation of
10 degrees.  However, using SVG, if we "slowly" animate an object,
rotating it from 350 to 370 degrees, the result will not be the same
as rotating it from 350 to 10 degree.
"""
import math
import sys
import random
from math import cos, sin
import svg as SVG


def appendTo(root, node):
    root.appendChild(node)


def generate_id():
    chars = "abcdefghijklmnopqrstuvwxyz1234567890"
    return "".join([random.choice(chars) for i in range(16)])


# Even though it is a private object, use the same name for the configuration
# dict as the CPython's module.


# Commented out configuration items are those found on the CPython version
def _default_cfg():
    return {
        # "width" : 0.5,               # Screen
        # "height" : 0.75,
        "canvwidth": 640,
        "canvheight": 480,
        # "leftright": None,
        # "topbottom": None,
        "mode": "standard",
        # "colormode": 1.0,
        # "delay": 10,
        # "undobuffersize": 1000,
        "shape": "turtle",
        "pencolor": "black",
        "fillcolor": "black",
        # "resizemode" : "noresize",
        "visible": True,
        # "language": "english",        # docstrings
        # "exampleturtle": "turtle",
        # "examplescreen": "screen",
        # "title": "Python Turtle Graphics",
        # "using_IDLE": False
        # Below are configuration items specific to this version
        "min_duration": "1ms",
    }


_CFG = _default_cfg()


def set_defaults(**params):
    """Allows to override defaults."""
    _CFG.update(**params)
    Screen().reset()


class Vec2D(tuple):
    """
    Used to give a nicer representation of the position.

    Because we're using SVG, if we "slowly" animate an object, rotating it
    from 350 to 370 degrees, the result will not be the same as rotating it
    from 350 to 10 degrees. For this reason, we did not use the Vec2D class
    from the CPython module and handle the rotations quite differently.

    This version of Vec2D is implemented for completeness.

    Provides (for a, b vectors, k number):
       a+b vector addition
       a-b vector subtraction
       a*b inner product
       k*a and a*k multiplication with scalar
       |a| absolute value of a

    As mentioned above, does not provide a.rotate(ange) rotation because of
    SVG reasons.
    """

    def __add__(self, other):
        return Vec2D(self[0] + other[0], self[1] + other[1])

    def __mul__(self, other):
        if isinstance(other, Vec2D):
            return self[0] * other[0] + self[1] * other[1]
        return Vec2D(self[0] * other, self[1] * other)

    def __rmul__(self, other):
        if isinstance(other, int) or isinstance(other, float):
            return Vec2D(self[0] * other, self[1] * other)
        return NotImplemented

    def __sub__(self, other):
        return Vec2D(self[0] - other[0], self[1] - other[1])

    def __neg__(self):
        return Vec2D(-self[0], -self[1])

    def __abs__(self):
        return math.sqrt(sum(i**2 for i in self))

    def __getnewargs__(self):
        return (self[0], self[1])

    def __repr__(self):
        return "(%.2f, %.2f)" % self


def create_circle(r):
    """Creates a circle of radius r centered at the origin"""
    circle = SVG.circle(x=0, y=0, r=r, stroke="black", fill="black")
    circle.setAttribute("stroke-width", 1)
    return circle


def create_polygon(points):
    """Creates a polygon using the points provided"""
    points = " ".join(",".join(map(str, p)) for p in points)
    polygon = SVG.polygon(points=points, stroke="black", fill="black")
    polygon.setAttribute("stroke-width", 1)
    return polygon


def create_rectangle(width=2, height=2, rx=None, ry=None):
    """Creates a rectangle centered at the origin. rx and ry can be
    used to have rounded corners"""
    rectangle = SVG.rect(
        x=-width / 2,
        y=-height / 2,
        width=width,
        height=height,
        stroke="black",
        fill="black",
    )
    rectangle.setAttribute("stroke-width", 1)
    if rx is not None:
        rectangle.setAttribute("rx", rx)
    if ry is not None:
        rectangle.setAttribute("ry", ry)
    return rectangle


def create_square(size=2, r=None):
    """Creates a square centered at the origin. rx and ry can be
    used to have rounded corners"""
    return create_rectangle(width=size, height=size, rx=r, ry=r)


class TurtleGraphicsError(Exception):
    """Some TurtleGraphics Error"""

    pass


class Screen:
    _instance = None
    _initialised = False

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = object.__new__(cls, *args, **kwargs)
        return cls._instance

    def __init__(self):
        if not self._initialised:
            self.shapes = {
                "arrow": (create_polygon, ((-10, 0), (10, 0), (0, 10))),
                "turtle": (
                    create_polygon,
                    (
                        (0, 16),
                        (-2, 14),
                        (-1, 10),
                        (-4, 7),
                        (-7, 9),
                        (-9, 8),
                        (-6, 5),
                        (-7, 1),
                        (-5, -3),
                        (-8, -6),
                        (-6, -8),
                        (-4, -5),
                        (0, -7),
                        (4, -5),
                        (6, -8),
                        (8, -6),
                        (5, -3),
                        (7, 1),
                        (6, 5),
                        (9, 8),
                        (7, 9),
                        (4, 7),
                        (1, 10),
                        (2, 14),
                    ),
                ),
                "classic": (
                    create_polygon,
                    ((0, 0), (-5, -9), (0, -7), (5, -9)),
                ),
                "triangle": (
                    create_polygon,
                    ((10, -5.77), (0, 11.55), (-10, -5.77)),
                ),
                "square": (create_square, 20),
                "circle": (create_circle, 10),
            }
            self._animate = True
            self._old_svg_scene = None
            self.reset()
            self._initialised = True

    def animation(self, onoff):
        onoff = onoff.lower()
        if onoff == "on":
            self._animate = True
        elif onoff == "off":
            self._animate = False
        else:
            raise ValueError("Supported values are only 'on' and 'off'.")

    def _repr_svg_(self):
        return self._old_svg_scene.outerHTML

    def svg(self):
        return self._repr_svg_()

    def save(self, file):
        """Save SVG to a file.
        file can be a file descriptor or a filename.
        If file is a file descriptor, it should be open in text mode.
        """
        if self._old_svg_scene is None:
            raise RuntimeError(
                "No turtle scene ended! " "You should call 'done' first."
            )
        html = self._old_svg_scene.outerHTML
        if isinstance(file, str):
            with open(file, "w") as f:
                f.write(html)
        else:
            # file should be a file descriptor
            file.write(html)

    def animation_frame_id(self, index):
        return "af_{}_{}".format(self.svg_id, index)

    def bgcolor(self, color=None):
        """sets the background with the given color if color is not None,
        else return current background color.
        """
        if color is None:
            return self.background_color
        self.background_color = color
        width = _CFG["canvwidth"]
        height = _CFG["canvheight"]
        if self.mode() in ["logo", "standard"]:
            x = -width // 2
            y = -height // 2
        else:
            x = 0
            y = -height

        self.frame_index += 1
        rect = SVG.rect(x=x, y=y, width=width, height=height, fill=color)
        if self._animate:
            rect.setAttribute("style", "display: none;")
            an = SVG.animate(
                Id=self.animation_frame_id(self.frame_index),
                attributeName="display",
                attributeType="CSS",
                From="block",
                to="block",
                dur=_CFG["min_duration"],
                fill="freeze",
            )
            an.setAttribute(
                "begin", self.animation_frame_id(self.frame_index - 1) + ".end"
            )
            appendTo(rect, an)

        appendTo(self.background_canvas, rect)

    def _convert_coordinates(self, x, y):
        """In the browser, the increasing y-coordinate is towards the
        bottom of the screen; this is the opposite of what is assumed
        normally for the methods in the CPython turtle module.

        This method makes the necessary orientation. It should be called
        just prior to creating any SVG element.
        """
        return x * self.yscale, self.y_points_down * y * self.yscale

    def create_svg_turtle(self, _turtle, name):
        if name in self.shapes:
            fn, arg = self.shapes[name]
        else:
            print("Unknown turtle '%s'; the default turtle will be used")
            fn, arg = self.shapes[_CFG["shape"]]
        shape = fn(arg)
        if self._mode == "standard" or self._mode == "world":
            rotation = -90
        else:
            rotation = 0
        return shape, rotation

    def _dot(self, pos, size, color):
        """Draws a filled circle of specified size and color"""
        if color is None:
            color = "black"
        if size is None or size < 1:
            size = 1
        self.frame_index += 1

        # `size` represents the diameter, svg needs the radius
        radius = size / 2

        x, y = self._convert_coordinates(pos[0], pos[1])

        circle = SVG.circle(cx=x, cy=y, r=radius, fill=color)
        if self._animate:
            circle.setAttribute("style", "display: none;")
            an = SVG.animate(
                Id=self.animation_frame_id(self.frame_index),
                attributeName="display",
                attributeType="CSS",
                From="block",
                to="block",
                dur=_CFG["min_duration"],
                fill="freeze",
            )
            an.setAttribute(
                "begin", self.animation_frame_id(self.frame_index - 1) + ".end"
            )
            appendTo(circle, an)
        appendTo(self.canvas, circle)

    def _drawline(self, _turtle, coordlist=None, color=None, width=1, speed=None):
        """Draws an animated line with a turtle
        - coordlist is the egin and end coordinates of the line
        - color should include the current outline and fill colors;
        - width is width of line to be drawn.
        - speed is the animation speed
        """

        outline = color[0]
        fill = color[1]

        x0, y0 = coordlist[0]
        x1, y1 = coordlist[1]

        x0, y0 = self._convert_coordinates(x0, y0)
        x1, y1 = self._convert_coordinates(x1, y1)

        # The speed scale does not correspond exactly to the CPython one...
        if speed == 0:
            duration = _CFG["min_duration"]
        else:
            dist = _turtle._distance
            if speed is None or speed == 1:
                duration = 0.02 * dist
            else:
                duration = 0.02 * dist / speed**1.2
            if duration < 0.001:
                duration = _CFG["min_duration"]
            else:
                duration = "%6.3fs" % duration

        drawing = _turtle._drawing

        style = {"stroke": outline, "stroke-width": width}
        if self._animate:
            _line = SVG.line(x1=x0, y1=y0, x2=x0, y2=y0, style=style)
        else:
            _line = SVG.line(x1=x0, y1=y0, x2=x1, y2=y1, style=style)

        if not drawing:
            _line.setAttribute("opacity", 0)

        # always create one animation for timing purpose
        begin = self.animation_frame_id(self.frame_index) + ".end"
        self.frame_index += 1
        if self._animate:
            _an1 = SVG.animate(
                Id=self.animation_frame_id(self.frame_index),
                attributeName="x2",
                attributeType="XML",
                From=x0,
                to=x1,
                dur=duration,
                fill="freeze",
                begin=begin,
            )
            appendTo(_line, _an1)

        # But, do not bother adding animations that will not be shown.
        if drawing:
            if self._animate:
                _an2 = SVG.animate(
                    attributeName="y2",
                    attributeType="XML",
                    begin=begin,
                    From=y0,
                    to=y1,
                    dur=duration,
                    fill="freeze",
                )
                appendTo(_line, _an2)

            if width > 2:
                if self._animate:
                    _line_cap = SVG.set(
                        attributeName="stroke-linecap",
                        begin=begin,
                        attributeType="xml",
                        to="round",
                        dur=duration,
                        fill="freeze",
                    )
                    appendTo(_line, _line_cap)
                else:
                    _line.setAttribute("stroke-linecap", "round")

        appendTo(self.canvas, _line)
        return begin, duration, (x0, y0), (x1, y1)

    def _drawpoly(self, coordlist, outline=None, fill=None, width=None):
        """Draws a path according to provided arguments:
        - coordlist is sequence of coordinates
        - fill is filling color
        - outline is outline color
        - width is the outline width
        """
        self.frame_index += 1

        if self._animate:
            style = {"display": "none"}
        else:
            style = {"display": "block"}

        if fill is not None:
            style["fill"] = fill
        if outline is not None:
            style["stroke"] = outline
            if width is not None:
                style["stroke-width"] = width
            else:
                style["stroke-width"] = 1

        points = " ".join(
            ",".join(map(str, self._convert_coordinates(*p))) for p in coordlist
        )
        polygon = SVG.polygon(points=points, style=style)

        if self._animate:
            an = SVG.animate(
                Id=self.animation_frame_id(self.frame_index),
                attributeName="display",
                attributeType="CSS",
                From="block",
                to="block",
                dur=_CFG["min_duration"],
                fill="freeze",
            )

            an.setAttribute(
                "begin", self.animation_frame_id(self.frame_index - 1) + ".end"
            )
            appendTo(polygon, an)

        appendTo(self.canvas, polygon)

    def _new_frame(self):
        """returns a new animation frame index and update the current index"""

        previous_end = self.animation_frame_id(self.frame_index) + ".end"
        self.frame_index += 1
        new_frame_id = self.animation_frame_id(self.frame_index)
        return previous_end, new_frame_id

    def mode(self, _mode=None):
        if _mode is None:
            return self._mode
        _CFG["mode"] = _mode
        self.reset()

    def reset(self):
        self._turtles = []
        self.frame_index = 0
        self.background_color = "white"
        self._scene_finished = False
        self._set_geometry()

    def restart(self):
        _CFG.update(_default_cfg())
        self.reset()
        Turtle._pen = None

    def _set_geometry(self):
        self.width = _CFG["canvwidth"]
        self.height = _CFG["canvheight"]
        self.x_offset = self.y_offset = 0
        self.xscale = self.yscale = 1

        self.y_points_down = -1
        self._mode = _CFG["mode"].lower()
        if self._mode in ["logo", "standard"]:
            self.translate_canvas = (self.width // 2, self.height // 2)
        elif self._mode == "world":
            self.translate_canvas = (0, self.height)
        self._setup_canvas()

    def _setup_canvas(self):
        self.svg_id = generate_id()
        self.svg_scene = SVG.svg(
            width=self.width,
            height=self.height,
            preserveAspectRatio="xMidYMid meet",
            viewBox="0 0 {} {}".format(self.width, self.height),
        )
        translate = "translate(%d %d)" % self.translate_canvas

        # always create one animation for timing purpose
        # if _animate is False, we remove it in end_scene()
        self._timing_anim = SVG.animate(
            Id=self.animation_frame_id(self.frame_index),
            attributeName="opacity",
            attributeType="CSS",
            From=1,
            to=1,
            begin="0s",
            dur=_CFG["min_duration"],
            fill="freeze",
        )
        appendTo(self.svg_scene, self._timing_anim)

        # Unlike html elements, svg elements have no concept of a z-index: each
        # new element is drawn on top of each other.
        # Having separate canvas keeps the ordering
        self.background_canvas = SVG.g(transform=translate)
        self.canvas = SVG.g(transform=translate)
        self.writing_canvas = SVG.g(transform=translate)
        self.turtle_canvas = SVG.g(transform=translate)

        appendTo(self.svg_scene, self.background_canvas)
        appendTo(self.svg_scene, self.canvas)
        appendTo(self.svg_scene, self.writing_canvas)
        appendTo(self.svg_scene, self.turtle_canvas)

    def setworldcoordinates(self, llx, lly, urx, ury):
        """Set up a user defined coordinate-system.

        Arguments:
        llx -- a number, x-coordinate of lower left corner of canvas
        lly -- a number, y-coordinate of lower left corner of canvas
        urx -- a number, x-coordinate of upper right corner of canvas
        ury -- a number, y-coordinate of upper right corner of canvas

        Note: llx must be less than urx in this version.

        Warning: in user-defined coordinate systems angles may appear distorted.
        """
        self._mode = "world"

        if urx < llx:
            sys.stderr.write(
                "Warning: urx must be greater than llx; your choice will be reversed"
            )
            urx, llx = llx, urx
        xspan = urx - llx
        yspan = abs(ury - lly)

        self.xscale = int(self.width) / xspan
        self.yscale = int(self.height) / yspan
        self.x_offset = -llx * self.xscale
        if ury < lly:
            self.y_points_down = 1  # standard orientation in the browser
        else:
            self.y_points_down = -1
        self.y_offset = self.y_points_down * lly * self.yscale
        self.translate_canvas = (self.x_offset, self.height - self.y_offset)
        self._setup_canvas()

    def end_scene(self):
        """Ends the creation of a "scene" and has it displayed"""
        # removing animation used for timing purpose
        if not self._animate and self._timing_anim is not None:
            self.svg_scene.removeChild(self._timing_anim)
            self._timing_anim = None
        if not self._scene_finished:
            for t in self._turtles:
                appendTo(self.turtle_canvas, t.svg)
            self._scene_finished = True
        self._old_svg_scene = self.svg_scene
        return self.svg_scene

    def show_scene(self):
        """Ends the creation of a "scene" and has it displayed"""
        return self.end_scene()

    def turtles(self):
        """Return the list of turtles on the screen."""
        return self._turtles

    def _write(self, pos, txt, align, font, color):
        """Write txt at pos in canvas with specified font
        and color."""
        if isinstance(color, tuple):
            stroke = color[0]
            fill = color[1]
        else:
            fill = color
            stroke = None
        x, y = self._convert_coordinates(pos[0], pos[1])
        text = SVG.text(
            txt,
            x=x,
            y=y,
            fill=fill,
            style={
                "display": "none" if self._animate else "block",
                "font-family": font[0],
                "font-size": font[1],
                "font-style": font[2],
            },
        )

        if stroke is not None:
            text.setAttribute("stroke", stroke)
        if align == "left":
            text.setAttribute("text-anchor", "start")
        elif align == "center" or align == "centre":
            text.setAttribute("text-anchor", "middle")
        elif align == "right":
            text.setAttribute("text-anchor", "end")

        self.frame_index += 1
        if self._animate:
            an = SVG.animate(
                Id=self.animation_frame_id(self.frame_index),
                attributeName="display",
                attributeType="CSS",
                From="block",
                to="block",
                dur=_CFG["min_duration"],
                fill="freeze",
            )
            an.setAttribute(
                "begin", self.animation_frame_id(self.frame_index - 1) + ".end"
            )
            appendTo(text, an)

        appendTo(self.writing_canvas, text)

    def addshape(self, *args, **kwargs):
        sys.stderr.write("Warning: Screen.addshape() is not implemented.\n")

    def bgpic(self, *args, **kwargs):
        sys.stderr.write("Warning: Screen.bgpic() is not implemented.\n")

    def bye(self, *args, **kwargs):
        sys.stderr.write("Warning: Screen.bye() is not implemented.\n")

    def clearscreen(self, *args, **kwargs):
        sys.stderr.write("Warning: Screen.clearscreen() is not implemented.\n")

    def colormode(self, *args, **kwargs):
        sys.stderr.write("Warning: Screen.colormode() is not implemented.\n")

    def delay(self, *args, **kwargs):
        sys.stderr.write("Warning: Screen.delay() is not implemented.\n")

    def exitonclick(self, *args, **kwargs):
        sys.stderr.write("Warning: Screen.exitonclick() is not implemented.\n")

    def getcanvas(self, *args, **kwargs):
        sys.stderr.write("Warning: Screen.getcanvas() is not implemented.\n")

    def getshapes(self, *args, **kwargs):
        sys.stderr.write("Warning: Screen.getshapes() is not implemented.\n")

    def listen(self, *args, **kwargs):
        sys.stderr.write("Warning: Screen.listen() is not implemented.\n")

    def numinput(self, *args, **kwargs):
        sys.stderr.write("Warning: Screen.numinput() is not implemented.\n")

    def onkey(self, *args, **kwargs):
        sys.stderr.write("Warning: Screen.onkey() is not implemented.\n")

    def onkeypress(self, *args, **kwargs):
        sys.stderr.write("Warning: Screen.onkeypress() is not implemented.\n")

    def onkeyrelease(self, *args, **kwargs):
        sys.stderr.write("Warning: Screen.onkeyrelease() is not implemented.\n")

    def onscreenclick(self, *args, **kwargs):
        sys.stderr.write("Warning: Screen.onscreenclick() is not implemented.\n")

    def ontimer(self, *args, **kwargs):
        sys.stderr.write("Warning: Screen.ontimer() is not implemented.\n")

    def register_shape(self, *args, **kwargs):
        sys.stderr.write("Warning: Screen.register_shape() is not implemented.\n")

    def resetscreen(self, *args, **kwargs):
        sys.stderr.write("Warning: Screen.resetscreen() is not implemented.\n")

    def screensize(self, *args, **kwargs):
        sys.stderr.write("Warning: Screen.screensize() is not implemented.\n")

    def setup(self, *args, **kwargs):
        sys.stderr.write("Warning: Screen.setup() is not implemented.\n")

    def textinput(self, *args, **kwargs):
        sys.stderr.write("Warning: Screen.textinput() is not implemented.\n")

    def title(self, *args, **kwargs):
        sys.stderr.write("Warning: Screen.title() is not implemented.\n")

    def tracer(self, *args, **kwargs):
        sys.stderr.write("Warning: Screen.tracer() is not implemented.\n")

    def update(self, *args, **kwargs):
        sys.stderr.write("Warning: Screen.update() is not implemented.\n")

    def window_height(self, *args, **kwargs):
        sys.stderr.write("Warning: Screen.window_height() is not implemented.\n")

    def window_width(self, *args, **kwargs):
        sys.stderr.write("Warning: Screen.window_width() is not implemented.\n")


class TNavigator:
    """Navigation part of the Turtle.
    Implements methods for turtle movement.
    """

    # START_ORIENTATION = {
    #     "standard": Vec2D(1.0, 0.0),
    #     "world": Vec2D(1.0, 0.0),
    #     "logo": Vec2D(0.0, 1.0)}
    DEFAULT_MODE = "standard"
    DEFAULT_ANGLEOFFSET = 0
    DEFAULT_ANGLEORIENT = 1

    def __init__(self, mode=DEFAULT_MODE):
        self._angleOffset = self.DEFAULT_ANGLEOFFSET
        self._angleOrient = self.DEFAULT_ANGLEORIENT
        self._mode = mode
        self.degree_to_radians = math.pi / 180
        self.degrees()
        self._mode = _CFG["mode"]
        self._setmode(mode)
        TNavigator.reset(self)

    def reset(self):
        """reset turtle navigation to its initial values

        The derived class, which will call it directly and add its own
        """
        self._position = (0.0, 0.0)
        self._x = 0
        self._y = 0
        self._angle = 0
        self._old_heading = 0

    def _setmode(self, mode=None):
        """Set turtle-mode to 'standard', 'world' or 'logo'."""
        if mode is None:
            return self._mode
        if mode not in ["standard", "logo", "world"]:
            print(mode, "is an unknown mode; it will be ignored.")
            return
        self._mode = mode
        if mode in ["standard", "world"]:
            self._angleOffset = 0
            self._angleOrient = 1
        else:  # mode == "logo":
            self._angleOffset = -self._fullcircle / 4.0
            self._angleOrient = 1

    def _setDegreesPerAU(self, fullcircle):
        """Helper function for degrees() and radians()"""
        self._fullcircle = fullcircle
        self._degreesPerAU = 360 / fullcircle

    def degrees(self, fullcircle=360.0):
        """Set angle measurement units to degrees, or possibly other system."""
        self._setDegreesPerAU(fullcircle)

    def radians(self):
        """Set the angle measurement units to radians."""
        self._setDegreesPerAU(2 * math.pi)

    def _rotate(self, angle):
        """Turn turtle counterclockwise by specified angle if angle > 0."""
        pass

    def _goto(self, x, y):
        pass  # implemented by derived class

    def forward(self, distance):
        """Move the turtle forward by the specified distance."""
        x1 = distance * cos(self._angle * self.degree_to_radians)
        y1 = distance * sin(self._angle * self.degree_to_radians)
        self._distance = distance
        self._goto(self._x + x1, self._y + y1)

    fd = forward

    def back(self, distance):
        """Move the turtle backward by distance."""
        x1 = -distance * cos(self._angle * self.degree_to_radians)
        y1 = -distance * sin(self._angle * self.degree_to_radians)
        self._distance = distance
        self._goto(self._x + x1, self._y + y1)

    backward = back
    bk = back

    def right(self, angle):
        """Turn turtle right by angle units."""
        angle *= self._degreesPerAU
        self._angle += self.screen.y_points_down * angle
        self._rotate_image(-angle)

    rt = right

    def left(self, angle):
        """Turn turtle left by angle units."""
        angle *= self._degreesPerAU
        self._angle += -self.screen.y_points_down * angle
        self._rotate_image(angle)

    lt = left

    def pos(self):
        """Return the turtle's current location (x,y), as a formatted tuple"""
        return Vec2D((self._x, self._y))

    position = pos

    def xcor(self):
        """Return the turtle's x coordinate."""
        return self._x

    def ycor(self):
        """Return the turtle's y coordinate"""
        return self._y

    def goto(self, x, y=None):
        """Move turtle to an absolute position."""
        if y is None:
            x, y = x[0], x[1]  # "*x" here raises SyntaxError
        # distance only needed to calculate the duration of
        # the animation which is based on "distance" and "speed" as well.
        # We use the Manhattan distance here as it is *much* faster on Chrome,
        # than using the proper distance with calls to math.sqrt, while
        # giving acceptable results
        #
        # forward, backward, etc., call _goto directly with the distance
        # given by the user
        self._distance = abs(self._x - x) + abs(self._y - y)
        self._goto(x, y)

    setpos = goto
    setposition = goto

    def home(self):
        """Move turtle to the origin - coordinates (0,0), facing in the
        default orientation
        """
        self.goto(0, 0)
        self.setheading(0)

    def setx(self, x):
        """Set the turtle's first coordinate to x"""
        self._distance = abs(x - self._x)
        self._goto(x, self._y)

    def sety(self, y):
        """Set the turtle's second coordinate to y"""
        self._distance = abs(y - self._y)
        self._goto(self._x, y)

    def distance(self, x, y=None):
        """
        Return the distance from the turtle to (x,y) in turtle step units.
        """
        if y is None:
            assert isinstance(x, tuple)
            x, y = x
        return math.sqrt((self._x - x) ** 2 + (self._y - y) ** 2)

    def towards(self, x, y=None):
        """
        Return the angle of the line from the turtle's position to (x, y).
        """
        if y is None:
            assert isinstance(x, tuple)
            x, y = x
        x, y = x - self._x, y - self._y
        result = round(math.atan2(y, x) * 180.0 / math.pi, 10) % 360.0
        result /= self._degreesPerAU
        return (self._angleOffset + self._angleOrient * result) % self._fullcircle

    def heading(self):
        """Return the turtle's current heading."""
        angle = self._angle / self._degreesPerAU
        return (self._angleOffset + self._angleOrient * angle) % self._fullcircle

    def setheading(self, to_angle):
        """Set the orientation of the turtle to to_angle."""
        rot = min((to_angle + i * 360 - self._angle for i in range(-2, 3)), key=abs)
        self._rotate(rot)

    seth = setheading

    def circle(self, radius, extent=None, steps=None):
        """
        Draw an approximate (arc) circle with given radius, using straight
        line segments.

        Arguments:
        radius -- a number
        extent (optional) -- a number
        steps (optional) -- an integer

        Draw a circle with given radius. The center is radius units left
        of the turtle; extent - an angle - determines which part of the
        circle is drawn. If extent is not given, draw the entire circle.
        If extent is not a full circle, one endpoint of the arc is the
        current pen position. Draw the arc in counterclockwise direction
        if radius is positive, otherwise in clockwise direction. Finally
        the direction of the turtle is changed by the amount of extent.

        As the circle is approximated by an inscribed regular polygon,
        steps determines the number of steps to use. If not given,
        it will be calculated automatically. Maybe used to draw regular
        polygons.
        """
        speed = self.speed()
        if extent is None:
            extent = self._fullcircle
        if steps is None:
            frac = abs(extent) / self._fullcircle
            steps = 1 + int(min(11 + abs(radius) / 6.0, 59.0) * frac)
        w = 1.0 * extent / steps
        w2 = 0.5 * w
        l = 2.0 * radius * math.sin(w2 * math.pi / 180.0 * self._degreesPerAU)
        if radius < 0:
            l, w, w2 = -l, -w, -w2
        self._rotate(w2)
        for i in range(steps):
            self.speed(speed)
            self.forward(l)
            self.speed(0)
            self._rotate(w)
        self._rotate(-w2)
        self.speed(speed)


class TPen:
    """Drawing part of the Turtle."""

    def __init__(self):
        self.screen = Screen()
        self._reset()

    def _reset(self, pencolor=_CFG["pencolor"], fillcolor=_CFG["fillcolor"]):
        self._pensize = 1
        self._shown = True
        self._drawing = True
        self._pencolor = "black"
        self._fillcolor = "black"
        self._speed = 3
        self._stretchfactor = (1.0, 1.0)

    def resizemode(self, rmode=None):
        sys.stderr.write("Warning: TPen.resizemode() is not implemented.\n")

    def pensize(self, width=None):
        """Set or return the line thickness."""
        if width is None:
            return self._pensize
        self.pen(pensize=width)

    width = pensize

    def pendown(self):
        """Pull the pen down -- drawing when moving."""
        if self._drawing:
            return
        self.pen(pendown=True)

    pd = pendown
    down = pendown

    def penup(self):
        """Pull the pen up -- no drawing when moving."""
        if not self._drawing:
            return
        self.pen(pendown=False)

    pu = penup
    up = penup

    def isdown(self):
        """Return True if pen is down, False if it's up."""
        return self._drawing

    def speed(self, speed=None):
        """Return or set the turtle's speed.

        Optional argument:
        speed -- an integer in the range 0..10 or a speedstring (see below)

        Set the turtle's speed to an integer value in the range 0 .. 10.
        If no argument is given: return current speed.

        If input is a number greater than 10 or smaller than 0.5,
        speed is set to 0.
        Speedstrings  are mapped to speedvalues in the following way:
            'fastest' :  0
            'fast'    :  10
            'normal'  :  6
            'slow'    :  3
            'slowest' :  1
        speeds from 1 to 10 enforce increasingly faster animation of
        line drawing and turtle turning.

        Attention:
        speed = 0 : *no* animation takes place. forward/back makes turtle jump
        and likewise left/right make the turtle turn instantly.
        """
        speeds = {
            "fastest": 0,
            "fast": 10,
            "normal": 6,
            "slow": 3,
            "slowest": 1,
        }
        if speed is None:
            return self._speed
        if speed in speeds:
            speed = speeds[speed]
        elif 0.5 < speed < 10.5:
            speed = int(round(speed))
        else:
            speed = 0
        self.pen(speed=speed)

    def color(self, *args):
        """Return or set the pencolor and fillcolor.

        IMPORTANT: this is very different than the CPython's version.

        Colors are using strings in any format recognized by a browser
        (named color, rgb, rgba, hex, hsl, etc.)

        Acceptable arguments:

            no argument: returns (pencolor, fillcolor)
            single string -> sets both pencolor and fillcolor to that value
            two string arguments -> taken to be pencolor, fillcolor
            tuple of two strings -> taken to be (pencolor, fillcolor)
        """
        if args:
            pencolor, fillcolor = None, None
            l = len(args)
            if l == 1:
                if isinstance(args[0], tuple):
                    pencolor = args[0][0]
                    fillcolor = args[0][1]
                else:
                    pencolor = fillcolor = args[0]
            elif l == 2:
                pencolor, fillcolor = args

            if not isinstance(pencolor, str) or not isinstance(fillcolor, str):
                raise TurtleGraphicsError("bad color arguments: %s" % str(args))

            self.pen(pencolor=pencolor, fillcolor=fillcolor)
        else:
            return self._pencolor, self._fillcolor

    def pencolor(self, color=None):
        """Return or set the pencolor.

        IMPORTANT: this is very different than the CPython's version.

        Colors are using strings in any format recognized by a browser
        (named color, rgb, rgba, hex, hsl, etc.)
        """
        if color is not None:
            if not isinstance(color, str):
                raise TurtleGraphicsError("bad color arguments: %s" % str(color))
            if color == self._pencolor:
                return
            self.pen(pencolor=color)
        else:
            return self._pencolor

    def fillcolor(self, color=None):
        """Return or set the fillcolor.

        IMPORTANT: this is very different than the CPython's version.

        Colors are using strings in any format recognized by a browser
        (named color, rgb, rgba, hex, hsl, etc.)
        """
        if color is not None:
            if not isinstance(color, str):
                raise TurtleGraphicsError("bad color arguments: %s" % str(color))
            if color == self._fillcolor:
                return
            self.pen(fillcolor=color)
        else:
            return self._pencolor

    def showturtle(self):
        """Makes the turtle visible."""
        if self._shown:
            return
        self.pen(shown=True)
        self.left(0)  # this will update the display to the correct rotation

    st = showturtle

    def hideturtle(self):
        """Makes the turtle invisible."""
        if self._shown:
            self.pen(shown=False)

    ht = hideturtle

    def isvisible(self):
        """Return True if the Turtle is shown, False if it's hidden."""
        return self._shown

    def pen(self, pen=None, **pendict):
        """Return or set the pen's attributes.

        Arguments:
            pen -- a dictionary with some or all of the below listed keys.
            **pendict -- one or more keyword-arguments with the below
                         listed keys as keywords.

        Return or set the pen's attributes in a 'pen-dictionary'
        with the following key/value pairs:
           "shown"      :   True/False
           "pendown"    :   True/False
           "pencolor"   :   color-string or color-tuple
           "fillcolor"  :   color-string or color-tuple
           "pensize"    :   positive number
           "speed"      :   number in range 0..10
        """
        _pd = {
            "shown": self._shown,
            "pendown": self._drawing,
            "pencolor": self._pencolor,
            "fillcolor": self._fillcolor,
            "pensize": self._pensize,
            "speed": self._speed,
        }

        if not (pen or pendict):
            return _pd

        if isinstance(pen, dict):
            p = pen
        else:
            p = {}
        p.update(pendict)

        _p_buf = {}
        for key in p:
            _p_buf[key] = _pd[key]
        if "pendown" in p:
            self._drawing = p["pendown"]
        if "pencolor" in p:
            old_color = self._pencolor
            self._pencolor = p["pencolor"]
            previous_end, new_frame_id = self.screen._new_frame()
            if self.screen._animate:
                anim = SVG.animate(
                    Id=new_frame_id,
                    begin=previous_end,
                    dur=_CFG["min_duration"],
                    fill="freeze",
                    attributeName="stroke",
                    attributeType="XML",
                    From=old_color,
                    to=self._pencolor,
                )
                appendTo(self.svg, anim)
            else:
                self.svg.setAttribute("stroke", self._pencolor)
        if "pensize" in p:
            self._pensize = p["pensize"]
        if "fillcolor" in p:
            old_color = self._fillcolor
            self._fillcolor = p["fillcolor"]
            previous_end, new_frame_id = self.screen._new_frame()
            if self.screen._animate:
                anim = SVG.animate(
                    Id=new_frame_id,
                    begin=previous_end,
                    dur=_CFG["min_duration"],
                    fill="freeze",
                    attributeName="fill",
                    attributeType="XML",
                    From=old_color,
                    to=self._fillcolor,
                )
                appendTo(self.svg, anim)
            else:
                self.svg.setAttribute("fill", self._fillcolor)
        if "speed" in p:
            self._speed = p["speed"]
        if "shown" in p:
            old_shown = self._shown
            if old_shown:
                opacity = 0
                old_opacity = 1
            else:
                opacity = 1
                old_opacity = 0
            previous_end, new_frame_id = self.screen._new_frame()
            if self.screen._animate:
                anim = SVG.animate(
                    Id=new_frame_id,
                    begin=previous_end,
                    dur=_CFG["min_duration"],
                    fill="freeze",
                    attributeName="opacity",
                    attributeType="XML",
                    From=old_opacity,
                    to=opacity,
                )
                appendTo(self.svg, anim)
            else:
                self.svg.setAttribute("opacity", opacity)
            self.forward(0)  # updates the turtle visibility on screen
            self._shown = p["shown"]


# No RawTurtle/RawPen for this version, unlike CPython's; only Turtle/Pen
class Turtle(TPen, TNavigator):
    """Animation part of the Turtle.
    Puts Turtle upon a TurtleScreen and provides tools for
    its animation.
    """

    _pen = None
    screen = None

    def __init__(self, shape=_CFG["shape"], visible=_CFG["visible"]):
        self.screen = Screen()
        TPen.__init__(self)
        TNavigator.__init__(self, self.screen.mode())
        self._poly = None
        self._creatingPoly = False
        self._fillitem = self._fillpath = None

        self.name = shape
        self.svg, rotation = self.screen.create_svg_turtle(self, name=shape)
        self.svg.setAttribute("opacity", 0)
        self._shown = False
        if visible:
            self.showturtle()  # will ensure that turtle become visible at appropriate time
        self.screen._turtles.append(self)
        self.rotation_correction = rotation
        # apply correction to image orientation
        self._old_heading = self.heading() + self.rotation_correction
        speed = self.speed()
        self.speed(0)
        self.left(
            -self._angleOffset
        )  # this will update the display to include the correction
        self.speed(speed)

    def reset(self):
        """Delete the turtle's drawings and restore its default values."""
        # TODO: review this and most likely revise docstring.
        TNavigator.reset(self)
        TPen._reset(self)
        self._old_heading = self.heading() + self.rotation_correction
        self.home()
        self.color(_CFG["pencolor"], _CFG["fillcolor"])

    def clear(self):
        sys.stderr.write("Warning: Turtle.clear() is not implemented.\n")

    def shape(self, name=None):
        """Set turtle shape to shape with given name
        / return current shapename if no name is provided
        """
        if name is None:
            return self.name
        _turtle = self._make_copy(name=name)

        visible = self.isvisible()
        if visible:
            self.hideturtle()
        appendTo(self.screen.turtle_canvas, self.svg)
        self.svg = _turtle
        self.screen._turtles.append(self)
        if visible:
            self.showturtle()

    def clearstamp(self, *args, **kwargs):
        sys.stderr.write("Warning: Turtle.clearstamp() is not implemented.\n")

    def clearstamps(self, *args, **kwargs):
        sys.stderr.write("Warning: Turtle.clearstamps() is not implemented.\n")

    def onclick(self, *args, **kwargs):
        sys.stderr.write("Warning: Turtle.onclick() is not implemented.\n")

    def ondrag(self, *args, **kwargs):
        sys.stderr.write("Warning: Turtle.ondrag() is not implemented.\n")

    def onrelease(self, *args, **kwargs):
        sys.stderr.write("Warning: Turtle.onrelease() is not implemented.\n")

    def undo(self, *args, **kwargs):
        sys.stderr.write("Warning: Turtle.undo() is not implemented.\n")

    def setundobuffer(self, *args, **kwargs):
        sys.stderr.write("Warning: Turtle.setundobuffer() is not implemented.\n")

    def undobufferentries(self, *args, **kwargs):
        sys.stderr.write("Warning: Turtle.undobufferentries() is not implemented.\n")

    def shapesize(self, *args, **kwargs):
        sys.stderr.write("Warning: Turtle.shapesize() is not implemented.\n")

    turtlesize = shapesize

    def shearfactor(self, shear=None):
        sys.stderr.write("Warning: Turtle.shearfactor() is not implemented.\n")

    def settiltangle(self, angle):
        sys.stderr.write("Warning: Turtle.settiltangle() is not implemented.\n")

    def tiltangle(self, angle=None):
        sys.stderr.write("Warning: Turtle.tiltangle() is not implemented.\n")

    def tilt(self, angle):
        sys.stderr.write("Warning: Turtle.tilt() is not implemented.\n")

    def shapetransform(self, t11=None, t12=None, t21=None, t22=None):
        sys.stderr.write("Warning: Turtle.shapetransform() is not implemented.\n")

    def get_shapepoly(self):
        sys.stderr.write("Warning: Turtle.get_shapepoly() is not implemented.\n")

    def _goto(self, x, y):
        """Move the pen to the point end, thereby drawing a line
        if pen is down. All other methods for turtle movement depend
        on this one.
        """

        begin, duration, _from, _to = self.screen._drawline(
            self,
            ((self._x, self._y), (x, y)),
            (self._pencolor, self._fillcolor),
            self._pensize,
            self._speed,
        )
        if self._shown:
            if self.screen._animate:
                appendTo(
                    self.svg,
                    SVG.animateMotion(
                        begin=begin, dur=_CFG["min_duration"], fill="remove"
                    ),
                )

                appendTo(
                    self.svg,
                    SVG.animateMotion(
                        From="%s,%s" % _from,
                        to="%s,%s" % _to,
                        dur=duration,
                        begin=begin,
                        fill="freeze",
                    ),
                )
            else:
                self.svg.setAttribute(
                    "transform",
                    f"translate({_to[0]}, {_to[1]}) rotate({self._old_heading}, 0, 0)",
                )

        if self._fillpath is not None:
            self._fillpath.append((x, y))
        self._position = (x, y)
        self._x = x
        self._y = y

    def _rotate(self, angle):
        """Turns pen clockwise by angle."""
        angle *= self._degreesPerAU
        self._angle += -self.screen.y_points_down * angle
        self._rotate_image(angle)

    def _rotate_image(self, angle):
        new_heading = self._old_heading - angle

        if self.isvisible():
            previous_end, new_frame_id = self.screen._new_frame()
            if self._speed == 0:
                duration = _CFG["min_duration"]
            else:
                duration = abs(angle) / (self._speed * 360)
                if duration < 0.001:
                    duration = _CFG["min_duration"]
                else:
                    duration = "%6.3fs" % duration

            if self.screen._animate:
                appendTo(
                    self.svg,
                    SVG.animateMotion(
                        begin=previous_end,
                        dur=_CFG["min_duration"],
                        fill="remove",
                    ),
                )
                appendTo(
                    self.svg,
                    SVG.animateTransform(
                        attributeName="transform",
                        Id=new_frame_id,
                        type="rotate",
                        From=f"{self._old_heading},0,0",
                        to=f"{new_heading},0,0",
                        begin=previous_end,
                        dur=duration,
                        fill="freeze",
                    ),
                )
            else:
                x, y = self.screen._convert_coordinates(self._x, self._y)
                self.svg.setAttribute(
                    "transform",
                    f"translate({x}, {y}) rotate({new_heading}, 0, 0)",
                )
        self._old_heading = new_heading

    def filling(self):
        """Return fillstate (True if filling, False else)."""
        return self._fillpath is not None

    def begin_fill(self):
        """Called just before drawing a shape to be filled."""
        self._fillpath = [(self._x, self._y)]

    def end_fill(self):
        """Fill the shape drawn after the call begin_fill()."""
        if self.filling() and len(self._fillpath) > 2:
            self.screen._drawpoly(
                self._fillpath,
                outline=self._pencolor,
                fill=self._fillcolor,
            )
        else:
            print("No path to fill.")
        self._fillpath = None

    def dot(self, size=None, color=None):
        """Draw a filled circle with diameter size, using color."""
        if size is None:
            size = max(self._pensize + 4, 2 * self._pensize)
        if color is None:
            color = self._pencolor
        item = self.screen._dot((self._x, self._y), size, color=color)

    def _write(self, txt, align, font, color=None):
        """Performs the writing for write()"""
        if color is None:
            color = self._pencolor
        self.screen._write((self._x, self._y), txt, align, font, color)

    def write(self, arg, align="left", font=("Arial", 8, "normal"), color=None):
        """Write text at the current turtle position.

        Arguments:
        arg -- info, which is to be written to the TurtleScreen; it will be
           converted to a string.
        align (optional) -- one of the strings "left", "center" or right"
        font (optional) -- a triple (fontname, fontsize, fonttype)
        """
        self._write(str(arg), align.lower(), font, color=color)

    def begin_poly(self):
        """Start recording the vertices of a polygon."""
        self._poly = [(self._x, self._y)]
        self._creatingPoly = True

    def end_poly(self):
        """Stop recording the vertices of a polygon."""
        self._creatingPoly = False

    def get_poly(self):
        """Return the lastly recorded polygon."""
        # check if there is any poly?
        if self._poly is not None:
            return tuple(self._poly)

    def getscreen(self):
        """Return the TurtleScreen object, the turtle is drawing on."""
        return self.screen

    def getturtle(self):
        """Return the Turtle object itself.

        Only reasonable use: as a function to return the 'anonymous turtle'
        """
        return self

    getpen = getturtle

    def _make_copy(self, name=None):
        """makes a copy of the current svg turtle, but possibly using a
        different shape. This copy is then ready to be inserted
        into a canvas."""

        if name is None:
            name = self.name

        # We recreate a copy of the existing turtle, possibly using a different
        # name/shape; we set the opacity to
        # 0 since there is no specific time associated with the creation of
        # such an object: we do not want to show it early.
        _turtle, rotation = self.screen.create_svg_turtle(self, name=name)
        _turtle.setAttribute("opacity", 0 if self.screen._animate else 1)
        _turtle.setAttribute("fill", self._fillcolor)
        _turtle.setAttribute("stroke", self._pencolor)

        # We use timed animations to get it with the proper location,
        # orientation and appear at the desired time.
        previous_end, new_frame_id = self.screen._new_frame()
        x, y = self.screen._convert_coordinates(self._x, self._y)
        if self.screen._animate:
            appendTo(
                _turtle,
                SVG.animateMotion(
                    begin=previous_end, dur=_CFG["min_duration"], fill="remove"
                ),
            )

            appendTo(
                _turtle,
                SVG.animateMotion(
                    Id=new_frame_id,
                    From="%s,%s" % (x, y),
                    to="%s,%s" % (x, y),
                    dur=_CFG["min_duration"],
                    begin=previous_end,
                    fill="freeze",
                ),
            )
            appendTo(
                _turtle,
                SVG.animateTransform(
                    attributeName="transform",
                    type="rotate",
                    From=f"{self._old_heading},0,0",
                    to=f"{self._old_heading},0,0",
                    begin=previous_end,
                    dur=_CFG["min_duration"],
                    fill="freeze",
                ),
            )

            appendTo(
                _turtle,
                SVG.animate(
                    begin=previous_end,
                    dur=_CFG["min_duration"],
                    fill="freeze",
                    attributeName="opacity",
                    attributeType="XML",
                    From=0,
                    to=1,
                ),
            )
        else:
            _turtle.setAttribute(
                "transform",
                f"translate({x}, {y}) rotate({self._old_heading}, 0, 0)",
            )
            _turtle.setAttribute("opacity", "1")
        return _turtle

    def stamp(self):
        """draws a permanent copy of the turtle at its current location"""

        _turtle = self._make_copy(name=self.name)
        appendTo(self.screen.canvas, _turtle)

    def clone(self):
        """Create and return a clone of the turtle."""
        n = Turtle(self.name)

        attrs = dir(self)
        new_dict = {}
        for attr in attrs:
            if isinstance(getattr(self, attr), (int, str, float)):
                new_dict[attr] = getattr(self, attr)
        n.__dict__.update(**new_dict)
        # ensure that visible characteristics are consistent with settings
        if not n._shown:
            n._shown = True  # otherwise, hideturtle() would have not effect
            n.hideturtle()
        n.left(0)
        n.fd(0)
        n.color(n.color())
        return n


Pen = Turtle


def done(target=None):
    """
    If target_id is given, the SVG element containing the turtle output will
    become a child of the HtmlElement with that id. If no element with that id
    can be found, a ValueError is raised.

    If no target_id is given (the default), the document body has a new child
    appended to it.
    """
    Screen().show_scene()
    if target:
        container = target
    else:
        import js

        container = js.document.createElement("div")
        js.document.body.appendChild(container)
    container.innerHTML = svg()


show_scene = done
mainloop = done


def replay_scene():
    "Start playing an animation by 'refreshing' the canvas."
    sys.stderr.write("Warning: turtle.replay_scene() is not implemented.\n")


def restart():
    "For Brython turtle: clears the existing drawing and canvas"
    _CFG.update(_default_cfg())
    Screen().reset()
    Turtle._pen = None


# The following functions are auto-generated.


def back(distance):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.back(distance)


def backward(distance):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.backward(distance)


def begin_fill():
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.begin_fill()


def begin_poly():
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.begin_poly()


def bk(distance):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.bk(distance)


def circle(radius, extent=None, steps=None):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.circle(radius, extent, steps)


def clear():
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.clear()


def clearstamp(*args, **kwargs):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.clearstamp(*args, **kwargs)


def clearstamps(*args, **kwargs):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.clearstamps(*args, **kwargs)


def clone():
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.clone()


def color(*args):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.color(*args)


def degrees(fullcircle=360.0):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.degrees(fullcircle)


def distance(x, y=None):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.distance(x, y)


def dot(size=None, color=None):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.dot(size, color)


def down():
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.down()


def end_fill():
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.end_fill()


def end_poly():
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.end_poly()


def fd(distance):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.fd(distance)


def fillcolor(color=None):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.fillcolor(color)


def filling():
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.filling()


def forward(distance):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.forward(distance)


def get_poly():
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.get_poly()


def getpen():
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.getpen()


def getscreen():
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.getscreen()


def get_shapepoly():
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.get_shapepoly()


def getturtle():
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.getturtle()


def goto(x, y=None):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.goto(x, y)


def heading():
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.heading()


def hideturtle():
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.hideturtle()


def home():
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.home()


def ht():
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.ht()


def isdown():
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.isdown()


def isvisible():
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.isvisible()


def left(angle):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.left(angle)


def lt(angle):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.lt(angle)


def onclick(*args, **kwargs):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.onclick(*args, **kwargs)


def ondrag(*args, **kwargs):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.ondrag(*args, **kwargs)


def onrelease(*args, **kwargs):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.onrelease(*args, **kwargs)


def pd():
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.pd()


def pen(pen=None, **pendict):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.pen(pen, **pendict)


def pencolor(color=None):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.pencolor(color)


def pendown():
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.pendown()


def pensize(width=None):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.pensize(width)


def penup():
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.penup()


def pos():
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.pos()


def position():
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.position()


def pu():
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.pu()


def radians():
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.radians()


def right(angle):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.right(angle)


def reset():
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.reset()


def resizemode(rmode=None):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.resizemode(rmode)


def rt(angle):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.rt(angle)


def seth(to_angle):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.seth(to_angle)


def setheading(to_angle):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.setheading(to_angle)


def setpos(x, y=None):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.setpos(x, y)


def setposition(x, y=None):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.setposition(x, y)


def settiltangle(angle):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.settiltangle(angle)


def setundobuffer(*args, **kwargs):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.setundobuffer(*args, **kwargs)


def setx(x):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.setx(x)


def sety(y):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.sety(y)


def shape(name=None):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.shape(name)


def shapesize(*args, **kwargs):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.shapesize(*args, **kwargs)


def shapetransform(t11=None, t12=None, t21=None, t22=None):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.shapetransform(t11, t12, t21, t22)


def shearfactor(shear=None):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.shearfactor(shear)


def showturtle():
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.showturtle()


def speed(speed=None):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.speed(speed)


def st():
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.st()


def stamp():
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.stamp()


def tilt(angle):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.tilt(angle)


def tiltangle(angle=None):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.tiltangle(angle)


def towards(x, y=None):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.towards(x, y)


def turtlesize(*args, **kwargs):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.turtlesize(*args, **kwargs)


def undo(*args, **kwargs):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.undo(*args, **kwargs)


def undobufferentries(*args, **kwargs):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.undobufferentries(*args, **kwargs)


def up():
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.up()


def width(width=None):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.width(width)


def write(arg, align="left", font=("Arial", 8, "normal"), color=None):
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.write(arg, align, font, color)


def xcor():
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.xcor()


def ycor():
    if Turtle._pen is None:
        Turtle._pen = Turtle()
    return Turtle._pen.ycor()


def addshape(*args, **kwargs):
    if Turtle.screen is None:
        Turtle.screen = Screen()
    return Turtle.screen.addshape(*args, **kwargs)


def animation(onoff):
    if Turtle.screen is None:
        Turtle.screen = Screen()
    return Turtle.screen.animation(onoff)


def bgcolor(color=None):
    if Turtle.screen is None:
        Turtle.screen = Screen()
    return Turtle.screen.bgcolor(color)


def bgpic(*args, **kwargs):
    if Turtle.screen is None:
        Turtle.screen = Screen()
    return Turtle.screen.bgpic(*args, **kwargs)


def bye(*args, **kwargs):
    if Turtle.screen is None:
        Turtle.screen = Screen()
    return Turtle.screen.bye(*args, **kwargs)


def clearscreen(*args, **kwargs):
    if Turtle.screen is None:
        Turtle.screen = Screen()
    return Turtle.screen.clearscreen(*args, **kwargs)


def colormode(*args, **kwargs):
    if Turtle.screen is None:
        Turtle.screen = Screen()
    return Turtle.screen.colormode(*args, **kwargs)


def delay(*args, **kwargs):
    if Turtle.screen is None:
        Turtle.screen = Screen()
    return Turtle.screen.delay(*args, **kwargs)


def exitonclick(*args, **kwargs):
    if Turtle.screen is None:
        Turtle.screen = Screen()
    return Turtle.screen.exitonclick(*args, **kwargs)


def getcanvas(*args, **kwargs):
    if Turtle.screen is None:
        Turtle.screen = Screen()
    return Turtle.screen.getcanvas(*args, **kwargs)


def getshapes(*args, **kwargs):
    if Turtle.screen is None:
        Turtle.screen = Screen()
    return Turtle.screen.getshapes(*args, **kwargs)


def listen(*args, **kwargs):
    if Turtle.screen is None:
        Turtle.screen = Screen()
    return Turtle.screen.listen(*args, **kwargs)


def mode(_mode=None):
    if Turtle.screen is None:
        Turtle.screen = Screen()
    return Turtle.screen.mode(_mode)


def numinput(*args, **kwargs):
    if Turtle.screen is None:
        Turtle.screen = Screen()
    return Turtle.screen.numinput(*args, **kwargs)


def onkey(*args, **kwargs):
    if Turtle.screen is None:
        Turtle.screen = Screen()
    return Turtle.screen.onkey(*args, **kwargs)


def onkeypress(*args, **kwargs):
    if Turtle.screen is None:
        Turtle.screen = Screen()
    return Turtle.screen.onkeypress(*args, **kwargs)


def onkeyrelease(*args, **kwargs):
    if Turtle.screen is None:
        Turtle.screen = Screen()
    return Turtle.screen.onkeyrelease(*args, **kwargs)


def onscreenclick(*args, **kwargs):
    if Turtle.screen is None:
        Turtle.screen = Screen()
    return Turtle.screen.onscreenclick(*args, **kwargs)


def ontimer(*args, **kwargs):
    if Turtle.screen is None:
        Turtle.screen = Screen()
    return Turtle.screen.ontimer(*args, **kwargs)


def register_shape(*args, **kwargs):
    if Turtle.screen is None:
        Turtle.screen = Screen()
    return Turtle.screen.register_shape(*args, **kwargs)


def resetscreen(*args, **kwargs):
    if Turtle.screen is None:
        Turtle.screen = Screen()
    return Turtle.screen.resetscreen(*args, **kwargs)


def save(file):
    if Turtle.screen is None:
        Turtle.screen = Screen()
    return Turtle.screen.save(file)


def screensize(*args, **kwargs):
    if Turtle.screen is None:
        Turtle.screen = Screen()
    return Turtle.screen.screensize(*args, **kwargs)


def setup(*args, **kwargs):
    if Turtle.screen is None:
        Turtle.screen = Screen()
    return Turtle.screen.setup(*args, **kwargs)


def setworldcoordinates(llx, lly, urx, ury):
    if Turtle.screen is None:
        Turtle.screen = Screen()
    return Turtle.screen.setworldcoordinates(llx, lly, urx, ury)


def svg():
    if Turtle.screen is None:
        Turtle.screen = Screen()
    return Turtle.screen.svg()


def textinput(*args, **kwargs):
    if Turtle.screen is None:
        Turtle.screen = Screen()
    return Turtle.screen.textinput(*args, **kwargs)


def title(*args, **kwargs):
    if Turtle.screen is None:
        Turtle.screen = Screen()
    return Turtle.screen.title(*args, **kwargs)


def tracer(*args, **kwargs):
    if Turtle.screen is None:
        Turtle.screen = Screen()
    return Turtle.screen.tracer(*args, **kwargs)


def turtles():
    if Turtle.screen is None:
        Turtle.screen = Screen()
    return Turtle.screen.turtles()


def update(*args, **kwargs):
    if Turtle.screen is None:
        Turtle.screen = Screen()
    return Turtle.screen.update(*args, **kwargs)


def window_height(*args, **kwargs):
    if Turtle.screen is None:
        Turtle.screen = Screen()
    return Turtle.screen.window_height(*args, **kwargs)


def window_width(*args, **kwargs):
    if Turtle.screen is None:
        Turtle.screen = Screen()
    return Turtle.screen.window_width(*args, **kwargs)


__all__ = [
    "addshape",
    "animation",
    "bgcolor",
    "bgpic",
    "bye",
    "clearscreen",
    "colormode",
    "delay",
    "exitonclick",
    "getcanvas",
    "getshapes",
    "listen",
    "mode",
    "numinput",
    "onkey",
    "onkeypress",
    "onkeyrelease",
    "onscreenclick",
    "ontimer",
    "register_shape",
    "resetscreen",
    "save",
    "screensize",
    "setup",
    "setworldcoordinates",
    "svg",
    "textinput",
    "title",
    "tracer",
    "turtles",
    "update",
    "window_height",
    "window_width",
    "back",
    "backward",
    "begin_fill",
    "begin_poly",
    "bk",
    "circle",
    "clear",
    "clearstamp",
    "clearstamps",
    "clone",
    "color",
    "degrees",
    "distance",
    "dot",
    "down",
    "end_fill",
    "end_poly",
    "fd",
    "fillcolor",
    "filling",
    "forward",
    "get_poly",
    "getpen",
    "getscreen",
    "get_shapepoly",
    "getturtle",
    "goto",
    "heading",
    "hideturtle",
    "home",
    "ht",
    "isdown",
    "isvisible",
    "left",
    "lt",
    "onclick",
    "ondrag",
    "onrelease",
    "pd",
    "pen",
    "pencolor",
    "pendown",
    "pensize",
    "penup",
    "pos",
    "position",
    "pu",
    "radians",
    "right",
    "reset",
    "resizemode",
    "rt",
    "seth",
    "setheading",
    "setpos",
    "setposition",
    "settiltangle",
    "setundobuffer",
    "setx",
    "sety",
    "shape",
    "shapesize",
    "shapetransform",
    "shearfactor",
    "showturtle",
    "speed",
    "st",
    "stamp",
    "tilt",
    "tiltangle",
    "towards",
    "turtlesize",
    "undo",
    "undobufferentries",
    "up",
    "width",
    "write",
    "xcor",
    "ycor",
    "done",
    "mainloop",
    "restart",
    "replay_scene",
    "Turtle",
    "Screen",
]

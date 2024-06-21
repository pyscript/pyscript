import inspect
import sys

from pyscript import document, when, window
from pyweb import JSProperty, pydom

#: A flag to show if MicroPython is the current Python interpreter.
is_micropython = "MicroPython" in sys.version


def getmembers_static(cls):
    """Cross-interpreter implementation of inspect.getmembers_static."""

    if is_micropython:  # pragma: no cover
        return [(name, getattr(cls, name)) for name, _ in inspect.getmembers(cls)]

    return inspect.getmembers_static(cls)


class ElementBase(pydom.Element):
    tag = "div"

    # GLOBAL ATTRIBUTES
    # These are attribute that all elements have (this list is a subset of the official one)
    # We are trying to capture the most used ones
    accesskey = JSProperty("accesskey")
    autofocus = JSProperty("autofocus")
    autocapitalize = JSProperty("autocapitalize")
    className = JSProperty("className")
    contenteditable = JSProperty("contenteditable")
    draggable = JSProperty("draggable")
    enterkeyhint = JSProperty("enterkeyhint")
    hidden = JSProperty("hidden")
    id = JSProperty("id")
    lang = JSProperty("lang")
    nonce = JSProperty("nonce")
    part = JSProperty("part")
    popover = JSProperty("popover")
    slot = JSProperty("slot")
    spellcheck = JSProperty("spellcheck")
    tabindex = JSProperty("tabindex")
    title = JSProperty("title")
    translate = JSProperty("translate")
    virtualkeyboardpolicy = JSProperty("virtualkeyboardpolicy")

    def __init__(self, style=None, **kwargs):
        super().__init__(document.createElement(self.tag))

        # set all the style properties provided in input
        if isinstance(style, dict):
            for key, value in style.items():
                self.style[key] = value
        elif style is None:
            pass
        else:
            raise ValueError(
                f"Style should be a dictionary, received {style} (type {type(style)}) instead."
            )

        # IMPORTANT!!! This is used to auto-harvest all input arguments and set them as properties
        self._init_properties(**kwargs)

    def _init_properties(self, **kwargs):
        """Set all the properties (of type JSProperties) provided in input as properties
        of the class instance.

        Args:
            **kwargs: The properties to set
        """
        # Look at all the properties of the class and see if they were provided in kwargs
        for attr_name, attr in getmembers_static(self.__class__):
            # For each one, actually check if it is a property of the class and set it
            if isinstance(attr, JSProperty) and attr_name in kwargs:
                try:
                    setattr(self, attr_name, kwargs[attr_name])
                except Exception as e:
                    print(f"Error setting {attr_name} to {kwargs[attr_name]}: {e}")
                    raise


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


# IMPORTANT: For all HTML components defined below, we are not mapping all
# available attributes, just the global and the most common ones.
# If you need to access a specific attribute, you can always use the `_js.<attribute>`
class a(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a"""

    tag = "a"

    download = JSProperty("download")
    href = JSProperty("href")
    referrerpolicy = JSProperty("referrerpolicy")
    rel = JSProperty("rel")
    target = JSProperty("target")
    type = JSProperty("type")


class abbr(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/abbr"""

    tag = "abbr"


class address(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/address"""

    tag = "address"


class area(ElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/area"""

    tag = "area"

    alt = JSProperty("alt")
    coords = JSProperty("coords")
    download = JSProperty("download")
    href = JSProperty("href")
    ping = JSProperty("ping")
    referrerpolicy = JSProperty("referrerpolicy")
    rel = JSProperty("rel")
    shape = JSProperty("shape")
    target = JSProperty("target")


class article(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/article"""

    tag = "article"


class aside(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/aside"""

    tag = "aside"


class audio(ElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio"""

    tag = "audio"

    autoplay = JSProperty("autoplay")
    controls = JSProperty("controls")
    controlslist = JSProperty("controlslist")
    crossorigin = JSProperty("crossorigin")
    disableremoteplayback = JSProperty("disableremoteplayback")
    loop = JSProperty("loop")
    muted = JSProperty("muted")
    preload = JSProperty("preload")
    src = JSProperty("src")


class b(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/b"""

    tag = "b"


class blockquote(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/blockquote"""

    tag = "blockquote"

    cite = JSProperty("cite")


class br(ElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/br"""

    tag = "br"


class button(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button"""

    tag = "button"

    autofocus = JSProperty("autofocus")
    disabled = JSProperty("disabled")
    form = JSProperty("form")
    formaction = JSProperty("formaction")
    formenctype = JSProperty("formenctype")
    formmethod = JSProperty("formmethod")
    formnovalidate = JSProperty("formnovalidate")
    formtarget = JSProperty("formtarget")
    name = JSProperty("name")
    type = JSProperty("type")
    value = JSProperty("value")


class canvas(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas"""

    tag = "canvas"

    height = JSProperty("height")
    width = JSProperty("width")


class caption(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/caption"""

    tag = "caption"


class cite(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/cite"""

    tag = "cite"


class code(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/code"""

    tag = "code"


class data(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/data"""

    tag = "data"

    value = JSProperty("value")


class datalist(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/datalist"""

    tag = "datalist"


class dd(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dd"""

    tag = "dd"


class del_(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/del"""

    tag = "del"

    cite = JSProperty("cite")
    datetime = JSProperty("datetime")


class details(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details"""

    tag = "details"

    open = JSProperty("open")


class dialog(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog"""

    tag = "dialog"

    open = JSProperty("open")


class div(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/div"""

    tag = "div"


class dl(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dl"""

    tag = "dl"

    value = JSProperty("value")


class dt(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dt"""

    tag = "dt"


class em(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/em"""

    tag = "em"


class embed(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/embed"""

    tag = "embed"

    height = JSProperty("height")
    src = JSProperty("src")
    type = JSProperty("type")
    width = JSProperty("width")


class fieldset(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/fieldset"""

    tag = "fieldset"

    disabled = JSProperty("disabled")
    form = JSProperty("form")
    name = JSProperty("name")


class figcaption(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figcaption"""

    tag = "figcaption"


class figure(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figure"""

    tag = "figure"


class footer(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/footer"""

    tag = "footer"


class form(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form"""

    tag = "form"

    accept_charset = JSProperty("accept-charset")
    action = JSProperty("action")
    autocapitalize = JSProperty("autocapitalize")
    autocomplete = JSProperty("autocomplete")
    enctype = JSProperty("enctype")
    name = JSProperty("name")
    method = JSProperty("method")
    nonvalidate = JSProperty("nonvalidate")
    rel = JSProperty("rel")
    target = JSProperty("target")


class h1(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h1"""

    tag = "h1"


class h2(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h2"""

    tag = "h2"


class h3(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h3"""

    tag = "h3"


class h4(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h4"""

    tag = "h4"


class h5(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h5"""

    tag = "h5"


class h6(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h6"""

    tag = "h6"


class header(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/header"""

    tag = "header"


class hgroup(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hgroup"""

    tag = "hgroup"


class hr(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hr"""

    tag = "hr"


class i(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/i"""

    tag = "i"


class iframe(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe"""

    tag = "iframe"

    allow = JSProperty("allow")
    allowfullscreen = JSProperty("allowfullscreen")
    height = JSProperty("height")
    loading = JSProperty("loading")
    name = JSProperty("name")
    referrerpolicy = JSProperty("referrerpolicy")
    sandbox = JSProperty("sandbox")
    src = JSProperty("src")
    srcdoc = JSProperty("srcdoc")
    width = JSProperty("width")


class img(ElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img"""

    tag = "img"

    alt = JSProperty("alt")
    crossorigin = JSProperty("crossorigin")
    decoding = JSProperty("decoding")
    fetchpriority = JSProperty("fetchpriority")
    height = JSProperty("height")
    ismap = JSProperty("ismap")
    loading = JSProperty("loading")
    referrerpolicy = JSProperty("referrerpolicy")
    sizes = JSProperty("sizes")
    src = JSProperty("src")
    width = JSProperty("width")


# NOTE: Input is a reserved keyword in Python, so we use input_ instead
class input_(ElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input"""

    tag = "input"

    accept = JSProperty("accept")
    alt = JSProperty("alt")
    autofocus = JSProperty("autofocus")
    capture = JSProperty("capture")
    checked = JSProperty("checked")
    dirname = JSProperty("dirname")
    disabled = JSProperty("disabled")
    form = JSProperty("form")
    formaction = JSProperty("formaction")
    formenctype = JSProperty("formenctype")
    formmethod = JSProperty("formmethod")
    formnovalidate = JSProperty("formnovalidate")
    formtarget = JSProperty("formtarget")
    height = JSProperty("height")
    list = JSProperty("list")
    max = JSProperty("max")
    maxlength = JSProperty("maxlength")
    min = JSProperty("min")
    minlength = JSProperty("minlength")
    multiple = JSProperty("multiple")
    name = JSProperty("name")
    pattern = JSProperty("pattern")
    placeholder = JSProperty("placeholder")
    popovertarget = JSProperty("popovertarget")
    popovertargetaction = JSProperty("popovertargetaction")
    readonly = JSProperty("readonly")
    required = JSProperty("required")
    size = JSProperty("size")
    src = JSProperty("src")
    step = JSProperty("step")
    type = JSProperty("type")
    value = JSProperty("value")
    width = JSProperty("width")


class ins(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ins"""

    tag = "ins"

    cite = JSProperty("cite")
    datetime = JSProperty("datetime")


class kbd(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/kbd"""

    tag = "kbd"


class label(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label"""

    tag = "label"

    for_ = JSProperty("for")


class legend(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/legend"""

    tag = "legend"


class li(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/li"""

    tag = "li"

    value = JSProperty("value")


class link(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link"""

    tag = "link"

    as_ = JSProperty("as")
    crossorigin = JSProperty("crossorigin")
    disabled = JSProperty("disabled")
    fetchpriority = JSProperty("fetchpriority")
    href = JSProperty("href")
    imagesizes = JSProperty("imagesizes")
    imagesrcset = JSProperty("imagesrcset")
    integrity = JSProperty("integrity")
    media = JSProperty("media")
    rel = JSProperty("rel")
    referrerpolicy = JSProperty("referrerpolicy")
    sizes = JSProperty("sizes")
    title = JSProperty("title")
    type = JSProperty("type")


class main(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/main"""

    tag = "main"


class map_(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/map"""

    tag = "map"

    name = JSProperty("name")


class mark(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/mark"""

    tag = "mark"


class menu(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/menu"""

    tag = "menu"


class meter(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meter"""

    tag = "meter"

    form = JSProperty("form")
    high = JSProperty("high")
    low = JSProperty("low")
    max = JSProperty("max")
    min = JSProperty("min")
    optimum = JSProperty("optimum")
    value = JSProperty("value")


class nav(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nav"""

    tag = "nav"


class object_(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/object"""

    tag = "object"

    data = JSProperty("data")
    form = JSProperty("form")
    height = JSProperty("height")
    name = JSProperty("name")
    type = JSProperty("type")
    usemap = JSProperty("usemap")
    width = JSProperty("width")


class ol(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ol"""

    tag = "ol"

    reversed = JSProperty("reversed")
    start = JSProperty("start")
    type = JSProperty("type")


class optgroup(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/optgroup"""

    tag = "optgroup"

    disabled = JSProperty("disabled")
    label = JSProperty("label")


class option(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/option"""

    tag = "option"

    disabled = JSProperty("value")
    label = JSProperty("label")
    selected = JSProperty("selected")
    value = JSProperty("value")


class output(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/output"""

    tag = "output"

    for_ = JSProperty("for")
    form = JSProperty("form")
    name = JSProperty("name")


class p(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/p"""

    tag = "p"


class picture(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/picture"""

    tag = "picture"


class pre(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/pre"""

    tag = "pre"


class progress(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress"""

    tag = "progress"

    max = JSProperty("max")
    value = JSProperty("value")


class q(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/q"""

    tag = "q"

    cite = JSProperty("cite")


class s(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/s"""

    tag = "s"


class script(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script"""

    tag = "script"

    # Let's add async manually since it's a reserved keyword in Python
    async_ = JSProperty("async")
    blocking = JSProperty("blocking")
    crossorigin = JSProperty("crossorigin")
    defer = JSProperty("defer")
    fetchpriority = JSProperty("fetchpriority")
    integrity = JSProperty("integrity")
    nomodule = JSProperty("nomodule")
    nonce = JSProperty("nonce")
    referrerpolicy = JSProperty("referrerpolicy")
    src = JSProperty("src")
    type = JSProperty("type")


class section(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/section"""

    tag = "section"


class select(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select"""

    tag = "select"


class small(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/small"""

    tag = "small"


class source(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/source"""

    tag = "source"

    media = JSProperty("media")
    sizes = JSProperty("sizes")
    src = JSProperty("src")
    srcset = JSProperty("srcset")
    type = JSProperty("type")


class span(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/span"""

    tag = "span"


class strong(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/strong"""

    tag = "strong"


class style(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/style"""

    tag = "style"

    blocking = JSProperty("blocking")
    media = JSProperty("media")
    nonce = JSProperty("nonce")
    title = JSProperty("title")


class sub(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/sub"""

    tag = "sub"


class summary(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/summary"""

    tag = "summary"


class sup(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/sup"""

    tag = "sup"


class table(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table"""

    tag = "table"


class tbody(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tbody"""

    tag = "tbody"


class td(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td"""

    tag = "td"

    colspan = JSProperty("colspan")
    headers = JSProperty("headers")
    rowspan = JSProperty("rowspan")


class template(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template"""

    tag = "template"

    shadowrootmode = JSProperty("shadowrootmode")


class textarea(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea"""

    tag = "textarea"

    autocapitalize = JSProperty("autocapitalize")
    autocomplete = JSProperty("autocomplete")
    autofocus = JSProperty("autofocus")
    cols = JSProperty("cols")
    dirname = JSProperty("dirname")
    disabled = JSProperty("disabled")
    form = JSProperty("form")
    maxlength = JSProperty("maxlength")
    minlength = JSProperty("minlength")
    name = JSProperty("name")
    placeholder = JSProperty("placeholder")
    readonly = JSProperty("readonly")
    required = JSProperty("required")
    rows = JSProperty("rows")
    spellcheck = JSProperty("spellcheck")
    wrap = JSProperty("wrap")


class tfoot(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tfoot"""

    tag = "tfoot"


class th(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th"""

    tag = "th"


class thead(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/thead"""

    tag = "thead"


class time(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/time"""

    tag = "time"

    datetime = JSProperty("datetime")


class title(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/title"""

    tag = "title"


class tr(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tr"""

    tag = "tr"

    abbr = JSProperty("abbr")
    colspan = JSProperty("colspan")
    headers = JSProperty("headers")
    rowspan = JSProperty("rowspan")
    scope = JSProperty("scope")


class track(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track"""

    tag = "track"

    default = JSProperty("default")
    kind = JSProperty("kind")
    label = JSProperty("label")
    src = JSProperty("src")
    srclang = JSProperty("srclang")


class u(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/u"""

    tag = "u"


class ul(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ul"""

    tag = "ul"


class var(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/var"""

    tag = "var"


class video(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video"""

    tag = "video"

    autoplay = JSProperty("autoplay")
    controls = JSProperty("controls")
    crossorigin = JSProperty("crossorigin")
    disablepictureinpicture = JSProperty("disablepictureinpicture")
    disableremoteplayback = JSProperty("disableremoteplayback")
    height = JSProperty("height")
    loop = JSProperty("loop")
    muted = JSProperty("muted")
    playsinline = JSProperty("playsinline")
    poster = JSProperty("poster")
    preload = JSProperty("preload")
    src = JSProperty("src")
    width = JSProperty("width")


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

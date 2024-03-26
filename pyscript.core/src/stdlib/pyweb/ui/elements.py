from textwrap import dedent

from pyweb import JSProperty, js_property, pydom

from pyscript import document, when, window


class ElementBase(pydom.Element):
    tag = "div"

    # GLOBAL ATTRIBUTES
    # These are attribute that all elements have (this list is a subset of the official one)
    # We are trying to capture the most used ones
    accesskey = js_property("accesskey")
    autofocus = js_property("autofocus")
    autocapitalize = js_property("autocapitalize")
    className = js_property("className")
    contenteditable = js_property("contenteditable")
    draggable = js_property("draggable")
    enterkeyhint = js_property("enterkeyhint")
    hidden = js_property("hidden")
    id = js_property("id")
    lang = js_property("lang")
    nonce = js_property("nonce")
    part = js_property("part")
    popover = js_property("popover")
    slot = js_property("slot")
    spellcheck = js_property("spellcheck")
    tabindex = js_property("tabindex")
    title = js_property("title")
    translate = js_property("translate")
    virtualkeyboardpolicy = js_property("virtualkeyboardpolicy")

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
        for attr_name, attr in self.__class__.__dict__.items():
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

    download = js_property("download")
    href = js_property("href")
    referrerpolicy = js_property("referrerpolicy")
    rel = js_property("rel")
    target = js_property("target")
    type = js_property("type")


class abbr(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/abbr"""

    tag = "abbr"


class address(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/address"""

    tag = "address"


class area(ElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/area"""

    tag = "area"

    alt = js_property("alt")
    coords = js_property("coords")
    download = js_property("download")
    href = js_property("href")
    ping = js_property("ping")
    referrerpolicy = js_property("referrerpolicy")
    rel = js_property("rel")
    shape = js_property("shape")
    target = js_property("target")


class article(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/article"""

    tag = "article"


class aside(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/aside"""

    tag = "aside"


class audio(ElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio"""

    tag = "audio"

    autoplay = js_property("autoplay")
    controls = js_property("controls")
    controlslist = js_property("controlslist")
    crossorigin = js_property("crossorigin")
    disableremoteplayback = js_property("disableremoteplayback")
    loop = js_property("loop")
    muted = js_property("muted")
    preload = js_property("preload")
    src = js_property("src")


class b(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/b"""

    tag = "b"


class blockquote(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/blockquote"""

    tag = "blockquote"

    cite = js_property("cite")


class br(ElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/br"""

    tag = "br"


class button(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button"""

    tag = "button"

    autofocus = js_property("autofocus")
    disabled = js_property("disabled")
    form = js_property("form")
    formaction = js_property("formaction")
    formenctype = js_property("formenctype")
    formmethod = js_property("formmethod")
    formnovalidate = js_property("formnovalidate")
    formtarget = js_property("formtarget")
    name = js_property("name")
    type = js_property("type")
    value = js_property("value")


class canvas(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas"""

    tag = "canvas"

    height = js_property("height")
    width = js_property("width")


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

    value = js_property("value")


class datalist(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/datalist"""

    tag = "datalist"


class dd(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dd"""

    tag = "dd"


class del_(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/del"""

    tag = "del"

    cite = js_property("cite")
    datetime = js_property("datetime")


class details(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details"""

    tag = "details"

    open = js_property("open")


class dialog(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog"""

    tag = "dialog"

    open = js_property("open")


class div(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/div"""

    tag = "div"


class dl(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dl"""

    tag = "dl"

    value = js_property("value")


class dt(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dt"""

    tag = "dt"


class em(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/em"""

    tag = "em"


class embed(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/embed"""

    tag = "embed"

    height = js_property("height")
    src = js_property("src")
    type = js_property("type")
    width = js_property("width")


class fieldset(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/fieldset"""

    tag = "fieldset"

    disabled = js_property("disabled")
    form = js_property("form")
    name = js_property("name")


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

    accept_charset = js_property("accept-charset")
    action = js_property("action")
    autocapitalize = js_property("autocapitalize")
    autocomplete = js_property("autocomplete")
    enctype = js_property("enctype")
    name = js_property("name")
    method = js_property("method")
    nonvalidate = js_property("nonvalidate")
    rel = js_property("rel")
    target = js_property("target")


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

    allow = js_property("allow")
    allowfullscreen = js_property("allowfullscreen")
    height = js_property("height")
    loading = js_property("loading")
    name = js_property("name")
    referrerpolicy = js_property("referrerpolicy")
    sandbox = js_property("sandbox")
    src = js_property("src")
    srcdoc = js_property("srcdoc")
    width = js_property("width")


class img(ElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img"""

    tag = "img"

    alt = js_property("alt")
    crossorigin = js_property("crossorigin")
    decoding = js_property("decoding")
    fetchpriority = js_property("fetchpriority")
    height = js_property("height")
    ismap = js_property("ismap")
    loading = js_property("loading")
    referrerpolicy = js_property("referrerpolicy")
    sizes = js_property("sizes")
    src = js_property("src")
    width = js_property("width")


# NOTE: Input is a reserved keyword in Python, so we use input_ instead
class input_(ElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input"""

    tag = "input"

    accept = js_property("accept")
    alt = js_property("alt")
    autofocus = js_property("autofocus")
    capture = js_property("capture")
    checked = js_property("checked")
    dirname = js_property("dirname")
    disabled = js_property("disabled")
    form = js_property("form")
    formaction = js_property("formaction")
    formenctype = js_property("formenctype")
    formmethod = js_property("formmethod")
    formnovalidate = js_property("formnovalidate")
    formtarget = js_property("formtarget")
    height = js_property("height")
    list = js_property("list")
    max = js_property("max")
    maxlength = js_property("maxlength")
    min = js_property("min")
    minlength = js_property("minlength")
    multiple = js_property("multiple")
    name = js_property("name")
    pattern = js_property("pattern")
    placeholder = js_property("placeholder")
    popovertarget = js_property("popovertarget")
    popovertargetaction = js_property("popovertargetaction")
    readonly = js_property("readonly")
    required = js_property("required")
    size = js_property("size")
    src = js_property("src")
    step = js_property("step")
    type = js_property("type")
    value = js_property("value")
    width = js_property("width")


class ins(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ins"""

    tag = "ins"

    cite = js_property("cite")
    datetime = js_property("datetime")


class kbd(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/kbd"""

    tag = "kbd"


class label(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label"""

    tag = "label"

    for_ = js_property("for")


class legend(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/legend"""

    tag = "legend"


class li(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/li"""

    tag = "li"

    value = js_property("value")


class link(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link"""

    tag = "link"

    as_ = js_property("as")
    crossorigin = js_property("crossorigin")
    disabled = js_property("disabled")
    fetchpriority = js_property("fetchpriority")
    href = js_property("href")
    imagesizes = js_property("imagesizes")
    imagesrcset = js_property("imagesrcset")
    integrity = js_property("integrity")
    media = js_property("media")
    rel = js_property("rel")
    referrerpolicy = js_property("referrerpolicy")
    sizes = js_property("sizes")
    title = js_property("title")
    type = js_property("type")


class main(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/main"""

    tag = "main"


class map_(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/map"""

    tag = "map"

    name = js_property("name")


class mark(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/mark"""

    tag = "mark"


class menu(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/menu"""

    tag = "menu"


class meter(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meter"""

    tag = "meter"

    form = js_property("form")
    high = js_property("high")
    low = js_property("low")
    max = js_property("max")
    min = js_property("min")
    optimum = js_property("optimum")
    value = js_property("value")


class nav(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nav"""

    tag = "nav"


class object_(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/object"""

    tag = "object"

    data = js_property("data")
    form = js_property("form")
    height = js_property("height")
    name = js_property("name")
    type = js_property("type")
    usemap = js_property("usemap")
    width = js_property("width")


class ol(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ol"""

    tag = "ol"

    reversed = js_property("reversed")
    start = js_property("start")
    type = js_property("type")


class optgroup(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/optgroup"""

    tag = "optgroup"

    disabled = js_property("disabled")
    label = js_property("label")


class option(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/option"""

    tag = "option"


class output(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/output"""

    tag = "output"

    for_ = js_property("for")
    form = js_property("form")
    name = js_property("name")


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

    max = js_property("max")
    value = js_property("value")


class q(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/q"""

    tag = "q"

    cite = js_property("cite")


class s(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/s"""

    tag = "s"


class script(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script"""

    tag = "script"

    # Let's add async manually since it's a reserved keyword in Python
    async_ = js_property("async")
    blocking = js_property("blocking")
    crossorigin = js_property("crossorigin")
    defer = js_property("defer")
    fetchpriority = js_property("fetchpriority")
    integrity = js_property("integrity")
    nomodule = js_property("nomodule")
    nonce = js_property("nonce")
    referrerpolicy = js_property("referrerpolicy")
    src = js_property("src")
    type = js_property("type")


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

    media = js_property("media")
    sizes = js_property("sizes")
    src = js_property("src")
    srcset = js_property("srcset")
    type = js_property("type")


class span(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/span"""

    tag = "span"


class strong(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/strong"""

    tag = "strong"


class style(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/style"""

    tag = "style"

    blocking = js_property("blocking")
    media = js_property("media")
    nonce = js_property("nonce")
    title = js_property("title")


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

    colspan = js_property("colspan")
    headers = js_property("headers")
    rowspan = js_property("rowspan")


class template(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template"""

    tag = "template"

    shadowrootmode = js_property("shadowrootmode")


class textarea(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea"""

    tag = "textarea"

    autocapitalize = js_property("autocapitalize")
    autocomplete = js_property("autocomplete")
    autofocus = js_property("autofocus")
    cols = js_property("cols")
    dirname = js_property("dirname")
    disabled = js_property("disabled")
    form = js_property("form")
    maxlength = js_property("maxlength")
    minlength = js_property("minlength")
    name = js_property("name")
    placeholder = js_property("placeholder")
    readonly = js_property("readonly")
    required = js_property("required")
    rows = js_property("rows")
    spellcheck = js_property("spellcheck")
    wrap = js_property("wrap")


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

    datetime = js_property("datetime")


class title(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/title"""

    tag = "title"


class tr(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tr"""

    tag = "tr"

    abbr = js_property("abbr")
    colspan = js_property("colspan")
    headers = js_property("headers")
    rowspan = js_property("rowspan")
    scope = js_property("scope")


class track(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track"""

    tag = "track"

    default = js_property("default")
    kind = js_property("kind")
    label = js_property("label")
    src = js_property("src")
    srclang = js_property("srclang")


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

    autoplay = js_property("autoplay")
    controls = js_property("controls")
    crossorigin = js_property("crossorigin")
    disablepictureinpicture = js_property("disablepictureinpicture")
    disableremoteplayback = js_property("disableremoteplayback")
    height = js_property("height")
    loop = js_property("loop")
    muted = js_property("muted")
    playsinline = js_property("playsinline")
    poster = js_property("poster")
    preload = js_property("preload")
    src = js_property("src")
    width = js_property("width")


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

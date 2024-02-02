import string
from textwrap import dedent

from pyscript import document, when, window
from pyweb import JSProperty, js_property, pydom
from pyweb.ui import elements as el


class ShoeBase(pydom.Element):
    tag = "div"

    def __init__(self, style=None, **kwargs):
        super().__init__(document.createElement(self.tag))

        # set all the style properties provided in input
        if style:
            for key, value in style.items():
                self.style[key] = value

        # IMPORTANT!!! This is used to auto-harvest all input arguments and set them as properties
        kwargs["self"] = self
        self._init_properties(**kwargs)

    @staticmethod
    def _init_properties(**kwargs):
        self = kwargs.pop("self")

        # Look at all the properties of the class and see if they were provided in kwargs
        # print(f"Looking for element properties for {self.__class__}...")
        for attr_name, attr in self.__class__.__dict__.items():
            # print("Checking", attr_name, isinstance(attr, ShoelaceProperty),  attr_name in kwargs)
            # For each one, actually check if it is a property of the class and set it
            if isinstance(attr, JSProperty) and attr_name in kwargs:
                setattr(self, attr_name, kwargs[attr_name])


class TextShoeBase(ShoeBase):
    def __init__(self, content, style=None, **kwargs):
        if not style and getattr(self, "default_style", None):
            style = self.default_style

        super().__init__(style=style, **kwargs)

        if isinstance(content, pydom.Element):
            self.append(content)
        else:
            self._js.innerHTML = content


class Button(ShoeBase):
    tag = "sl-button"
    variant = js_property("variant")
    size = js_property("size")
    outline = js_property("outline")
    pill = js_property("pill")
    circle = js_property("circle")

    def __init__(
        self,
        content,
        variant="primary",
        size=None,
        outline=False,
        pill=False,
        circle=False,
        **kwargs,
    ):
        super().__init__(**kwargs)
        self._js.textContent = content

        # IMPORTANT!!! This is use to auto-harvest all input arguments and set them as properties
        self._init_properties(**locals())


class Alert(TextShoeBase):
    """Alerts are used to display important messages inline or as toast notifications.

    Example: Alert("This is a standard alert. You can customize its content and even the icon.")
    """

    tag = "sl-alert"
    open = js_property("open")
    variant = js_property("variant")

    def __init__(self, content, variant=None, open=True, **kwargs):
        # TODO: Should content be appended so we can support html Elements as well?
        super().__init__(content, variant=variant, open=open, **kwargs)


class Select(ShoeBase):
    tag = "sl-select"
    label = js_property("label")
    helpText = js_property("helpText")
    placeholder = js_property("placeholder")
    pill = js_property("pill")
    value = js_property("value")

    def __init__(
        self,
        label=None,
        options=None,
        placeholder=None,
        help_text=None,
        value=None,
        style=None,
        **kwargs,
    ):
        super().__init__(
            label=label,
            placeholder=placeholder,
            help_text=help_text,
            value=value,
            style=style,
            **kwargs,
        )
        html_ = "\n".join(
            [f'<sl-option value="{option}">{option}</sl-option>' for option in options]
        )
        self.html = html_
        print("options", options)
        print("HTML", html_)
        print("HTML", self.html)
        # for option in options:
        #     self.append(el.option(option))


class Button(TextShoeBase):
    """Buttons represent actions that are available to the user."""

    tag = "sl-button"
    variant = js_property("variant")
    size = js_property("size")
    outline = js_property("outline")
    pill = js_property("pill")
    circle = js_property("circle")

    def __init__(
        self,
        content,
        variant="primary",
        size=None,
        outline=False,
        pill=False,
        circle=False,
        **kwargs,
    ):
        super().__init__(
            content,
            variant=variant,
            size=size,
            outline=outline,
            pill=pill,
            circle=circle,
            **kwargs,
        )


class Details(TextShoeBase):
    """Details are used as a disclosure widget from which users can retrieve additional information."""

    tag = "sl-details"
    open = js_property("open")
    summary = js_property("summary")
    disabled = js_property("disabled")
    update_complete = js_property("updateComplete")

    def __init__(
        self, content, summary, open=None, disabled=None, style=None, **kwargs
    ):
        super().__init__(
            content,
            summary=summary,
            open=open,
            disabled=disabled,
            style=style,
            **kwargs,
        )


class Dialog(TextShoeBase):
    tag = "sl-dialog"
    label = js_property("label")
    noheader = js_property("noheader")
    open = js_property("open")
    # TODO: We should map the `modal` property as well but it's a bit of special...

    def __init__(
        self, content, label=None, open=None, disabled=None, style=None, **kwargs
    ):
        super().__init__(
            content, label=label, open=open, disabled=disabled, style=style, **kwargs
        )


class Divider(ShoeBase):
    tag = "sl-divider"

    vertical = js_property("vertical")

    def __init__(self, vertical=None, **kwargs):
        super().__init__(vertical=vertical, **kwargs)

        self._init_properties(**locals())


class BaseMixin(pydom.Element):
    @property
    def label(self):
        return self._js.label

    @label.setter
    def label(self, value):
        self._js.label = value


# class LabelProperty:
#     def __get__(self, obj, objtype=None):
#         return obj._js.label

#     def __set__(self, obj, value):
#         obj._js.label = value


class PlaceholderProperty:
    def __get__(self, obj, objtype=None):
        return obj._js.placeholder

    def __set__(self, obj, value):
        obj._js.placeholder = value


class Input(ShoeBase):
    tag = "sl-input"

    label = js_property("label")
    placeholder = js_property("placeholder")
    pill = js_property("pill")
    help_text = js_property("helpText")
    value = js_property("value")

    def __init__(
        self,
        label=None,
        value=None,
        type="text",
        placeholder=None,
        help_text=None,
        size=None,
        filled=False,
        pill=False,
        disabled=False,
        readonly=False,
        autofocus=False,
        autocomplete=None,
        autocorrect=None,
        autocapitalize=None,
        spellcheck=None,
        min=None,
        max=None,
        step=None,
        name=None,
        required=False,
        pattern=None,
        minlength=None,
        maxlength=None,
        style=None,
        **kwargs,
    ):
        super().__init__(
            style=style,
            label=label,
            value=value,
            type=type,
            placeholder=placeholder,
            help_text=help_text,
            size=size,
            filled=filled,
            pill=pill,
            disabled=disabled,
            readonly=readonly,
            autofocus=autofocus,
            autocomplete=autocomplete,
            autocorrect=autocorrect,
            autocapitalize=autocapitalize,
            spellcheck=spellcheck,
            min=min,
            max=max,
            step=step,
            name=name,
            required=required,
            pattern=pattern,
            minlength=minlength,
            maxlength=maxlength,
            **kwargs,
        )


class Badge(TextShoeBase):
    tag = "sl-badge"
    variant = js_property("variant")
    pill = js_property("pill")
    pulse = js_property("pulse")


class Rating(ShoeBase):
    tag = "sl-rating"
    label = js_property("label")
    value = js_property("value")
    max = js_property("max")
    # TODO: Properties missing...


class TextArea(ShoeBase):
    tag = "sl-textarea"
    label = js_property("label")
    helpText = js_property("helpText")
    # TODO: Properties missing...


class Card(TextShoeBase):
    tag = "sl-card"

    def __init__(
        self,
        content=None,
        image=None,
        img_alt=None,
        header=None,
        footer=None,
        style=None,
        **kwargs,
    ):
        main_div = el.div()
        if image:
            if not isinstance(image, el.img):
                image = el.img(image, alt=img_alt)

            image.slot = "image"

        if content:
            if isinstance(content, pydom.Element):
                main_div.append(content)
            else:
                main_div.append(el.div(content))
            main_div.append(content)

        super().__init__(content, style=style, **kwargs)
        self._js.insertBefore(image._js, self._js.firstChild)

        if header:
            header = el.div(header, slot="header")
            self._js.insertBefore(header._js, self._js.firstChild)

        if footer:
            self.append(el.div(footer, slot="footer"))

        self.add_class("card-overview")


class Icon(ShoeBase):
    tag = "sl-icon"

    name = js_property("name")
    src = js_property("src")
    label = js_property("label")
    library = js_property("library")
    update_complete = js_property("updateComplete")

    def __init__(
        self, name=None, src=None, label=None, library=None, style=None, **kwargs
    ):
        super().__init__(
            name=name, src=src, label=label, library=library, style=style, **kwargs
        )


class Radio(ShoeBase):
    tag = "sl-radio"
    value = js_property("value")
    size = js_property("size")
    disabled = js_property("disabled")
    update_complete = js_property("updateComplete")

    def __init__(self, value=None, size=None, disabled=None, style=None, **kwargs):
        super().__init__(
            value=value, size=size, disabled=disabled, style=style, **kwargs
        )


class CopyButton(ShoeBase):
    tag = "sl-copy-button"
    value = js_property("value")
    _from = js_property("from")
    disabled = js_property("disabled")
    copy_label = js_property("copyLabel")
    success_label = js_property("successLabel")
    error_label = js_property("errorLabel")
    feedback_duration = js_property("feedbackDuration")
    tooltip_placement = js_property("tooltipPlacement")
    hoist = js_property("hoist")
    update_complete = js_property("updateComplete")

    def __init__(
        self,
        value=None,
        _from=None,
        disabled=None,
        copy_label=None,
        success_label=None,
        error_label=None,
        feedback_duration=None,
        tooltip_placement=None,
        hoist=None,
        style=None,
        **kwargs,
    ):
        super().__init__(
            value=value,
            _from=_from,
            disabled=disabled,
            copy_label=copy_label,
            success_label=success_label,
            error_label=error_label,
            feedback_duration=feedback_duration,
            tooltip_placement=tooltip_placement,
            hoist=hoist,
            style=style,
            **kwargs,
        )


class Skeleton(ShoeBase):
    tag = "sl-skeleton"
    effect = js_property("effect")
    update_complete = js_property("updateComplete")

    def __init__(self, effect=None, style=None, **kwargs):
        super().__init__(effect=effect, style=style, **kwargs)


class Spinner(ShoeBase):
    tag = "sl-spinner"
    update_complete = js_property("updateComplete")

    def __init__(self, style=None, **kwargs):
        super().__init__(style=style, **kwargs)


# # TODO: Need to make sure we can pass elements in it.
# class SplitPanel(ShoeBase):
#     tag = "sl-split-panel"
#     content = js_property("content")
#     position = js_property("position")
#     position_in_pixels = js_property("positionInPixels")
#     vertical = js_property("vertical")
#     disabled = js_property("disabled")
#     primary = js_property("primary")
#     snap = js_property("snap")
#     snap_threshold = js_property("snapThreshold")
#     update_complete = js_property("updateComplete")

#     def __init__(self, content, position=None, position_in_pixels=None, vertical=None, disabled=None, primary=None, snap=None, snap_threshold=None, style=None, **kwargs):
#         super().__init__(**kwargs)
#         self._js.InnerHTML = content

#         self._init_properties(**locals())


class Switch(ShoeBase):
    tag = "sl-switch"
    name = js_property("name")
    value = js_property("value")
    size = js_property("size")
    disabled = js_property("disabled")
    checked = js_property("checked")
    default_checked = js_property("defaultChecked")
    form = js_property("form")
    required = js_property("required")
    validity = js_property("validity")
    validation_message = js_property("validationMessage")
    update_complete = js_property("updateComplete")

    def __init__(
        self,
        name=None,
        value=None,
        size=None,
        disabled=None,
        checked=None,
        default_checked=None,
        form=None,
        required=None,
        validity=None,
        validation_message=None,
        style=None,
        **kwargs,
    ):
        super().__init__(
            name=name,
            value=value,
            size=size,
            disabled=disabled,
            checked=checked,
            default_checked=default_checked,
            form=form,
            required=required,
            validity=validity,
            validation_message=validation_message,
            style=style,
            **kwargs,
        )


class Textarea(ShoeBase):
    tag = "sl-textarea"
    name = js_property("name")
    value = js_property("value")
    size = js_property("size")
    filled = js_property("filled")
    label = js_property("label")
    help_text = js_property("helpText")
    placeholder = js_property("placeholder")
    rows = js_property("rows")
    resize = js_property("resize")
    disabled = js_property("disabled")
    readonly = js_property("readonly")
    form = js_property("form")
    required = js_property("required")
    min_length = js_property("minLength")
    max_length = js_property("maxLength")
    autocalpitalize = js_property("autocapitalize")
    autocomplete = js_property("autocomplete")
    autofocus = js_property("autofocus")
    enterkeyhint = js_property("enterkeyhint")
    spellcheck = js_property("spellcheck")
    inputmode = js_property("inputmode")
    default_value = js_property("defaultValue")
    validity = js_property("validity")
    validatio_message = js_property("validationMessage")
    update_complete = js_property("updateComplete")

    def __init__(
        self,
        name=None,
        value=None,
        size=None,
        filled=None,
        label=None,
        help_text=None,
        placeholder=None,
        rows=None,
        resize=None,
        disabled=None,
        readonly=None,
        form=None,
        required=None,
        min_length=None,
        max_length=None,
        autocapitalize=None,
        autocomplete=None,
        autofocus=None,
        enterkeyhint=None,
        spellcheck=None,
        inputmode=None,
        default_value=None,
        validity=None,
        validation_message=None,
        style=None,
        **kwargs,
    ):
        super().__init__(
            name=name,
            value=value,
            size=size,
            filled=filled,
            label=label,
            help_text=help_text,
            placeholder=placeholder,
            rows=rows,
            resize=resize,
            disabled=disabled,
            readonly=readonly,
            form=form,
            required=required,
            min_length=min_length,
            max_length=max_length,
            autocapitalize=autocapitalize,
            autocomplete=autocomplete,
            autofocus=autofocus,
            enterkeyhint=enterkeyhint,
            spellcheck=spellcheck,
            inputmode=inputmode,
            default_value=default_value,
            validity=validity,
            validation_message=validation_message,
            style=style,
            **kwargs,
        )


class Tag(ShoeBase):
    tag = "sl-tag"
    variant = js_property("variant")
    size = js_property("size")
    pill = js_property("pill")
    removable = js_property("removable")
    update_complete = js_property("updateComplete")

    def __init__(
        self,
        content,
        variant=None,
        size=None,
        pill=None,
        removable=None,
        style=None,
        **kwargs,
    ):
        super().__init__(**kwargs)
        self._js.textContent = content

        self._init_properties(**locals())


class Range(ShoeBase):
    tag = "sl-range"
    name = js_property("name")
    value = js_property("value")
    label = js_property("label")
    help_text = js_property("helpText")
    disabled = js_property("disabled")
    _min = js_property("min")
    _max = js_property("max")
    step = js_property("step")
    tooltip = js_property("tooltip")
    tooltip_formatter = js_property("tooltipFormatter")
    form = js_property("form")
    default_value = js_property("defaultValue")
    validity = js_property("validity")
    validation_message = js_property("validationMessage")
    update_complete = js_property("updateComplete")

    def __init__(
        self,
        name=None,
        value=None,
        label=None,
        help_text=None,
        disabled=None,
        _min=None,
        _max=None,
        step=None,
        tooltip=None,
        tooltip_formatter=None,
        form=None,
        default_value=None,
        validity=None,
        validation_message=None,
        style=None,
        **kwargs,
    ):
        super().__init__(**kwargs)

        self._init_properties(**locals())


class RelativeTime(ShoeBase):
    tag = "sl-relative-time"
    date = js_property("date")
    _format = js_property("format")
    numeric = js_property("numeric")
    sync = js_property("sync")
    update_complete = js_property("updateComplete")

    def __init__(self, date=None, style=None, **kwargs):
        super().__init__(date=date, style=style, **kwargs)


# Load resources...
CSS = """
.card-overview {
    max-width: 300px;
}

.card-overview small {
    color: var(--sl-color-neutral-500);
}

.card-overview [slot='footer'] {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
"""


def load_resources(parent=None):
    print("Loading shoelace resources...")
    if parent is None:
        parent = pydom.body
    parent.append(
        el.link(
            href="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/cdn/themes/light.css",
            rel="stylesheet",
        )
    )
    parent.append(
        el.script(
            src="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/cdn/shoelace-autoloader.js",
            type="module",
        ),
    )
    parent.append(el.style(CSS))
    print("Resources loaded!")

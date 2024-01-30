import string
from textwrap import dedent

from pyscript import document, when, window
from pyweb import pydom


class ElementBase(pydom.Element):
    tag = 'div'

    def __init__(self, style = None, **kwargs):
        super().__init__(document.createElement(self.tag))
        
        # set all the style properties provided in input
        if style:
            for key, value in style.items():
                self.style[key] = value
                
        # IMPORTANT!!! This is used to auto-harvest all input arguments and set them as properties
        kwargs['self'] = self
        self._init_properties(**kwargs)

    @staticmethod
    def _init_properties(**kwargs):
        self = kwargs.pop('self')

        # Look at all the properties of the class and see if they were provided in kwargs
        for attr_name, attr in self.__class__.__dict__.items():
            # For each one, actually check if it is a property of the class and set it
            if isinstance(attr, JSProperty) and attr_name in kwargs:
                    setattr(self, attr_name, kwargs[attr_name])

    # def __add__(self, other):
    #     if isinstance(other, list):
    #         other = div(*other)
    #     return WidgetCollection(*self.widgets, other, separator=self.separator)

class TextElementBase(ElementBase):
    def __init__(self, content=None, style=None, **kwargs):
        super().__init__(style=style, **kwargs)

        if isinstance(content, pydom.Element):
            self.append(content)
        elif isinstance(content, list):
            for item in content:
                self.append(item)
        elif content is None:
            pass
        else:
            self._js.innerHTML = content

class h1(TextElementBase):
    tag = "h1"


class h2(TextElementBase):
    tag = "h2"


class h3(TextElementBase):
    tag = "h3"


class button(TextElementBase):
    tag = 'button'

    # JS Properties
    autofocus = js_property('autofocus')
    disabled = js_property('disabled')
    name = js_property('name')
    type = js_property('type')
    value = js_property('value')


class link(TextElementBase):
    tag = 'a'
    href = js_property('href')

    def __init__(self, content, href, style = None, **kwargs):
        super().__init__(content, href=href, style=style, **kwargs)

class a(link):
    pass

class p(TextElementBase):
    tag = 'p'

class code(TextElementBase):
    tag = 'code'

class pre(TextElementBase):
    tag = 'pre'

class strong(TextElementBase):
    tag = 'strong'

class small(TextElementBase):
    tag = 'small'

class br(ElementBase):
    tag = 'br'

class div(TextElementBase):
    tag = 'div'

class img(ElementBase):
    tag = 'img'
    src = js_property('src')
    # TODO: This should probably go on the ElementBase class since it's a global attribtute
    # https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/slot
    slot = js_property('slot')

    def __init__(self, src, alt="", style = None, **kwargs):
        super().__init__(src=src, alt=alt, style=style, **kwargs)

class Grid(ElementBase):
    tag = 'div'

    def __init__(self, layout="", gap=None, **kwargs):
        super().__init__(**kwargs)
        self.style['display'] = 'grid'
        self.style['grid-template-columns'] = layout

        # TODO: This should be a property
        if not gap is None:
            self.style['gap'] = gap

class input(ElementBase):
    tag = 'input'

    # JS Properties
    autofocus = js_property('autofocus')
    alt = js_property('alt')
    autocapitalize = js_property('autocapitalize')
    autocomplete = js_property('autocomplete')
    checked = js_property('checked')
    disabled = js_property('disabled')
    name = js_property('name')
    type = js_property('type')
    value = js_property('value')
    placeholder = js_property('placeholder')

    # TODO: This is by anymeans complete!! We need to add more attributes

    def __init__(self, style = None, **kwargs):
        super().__init__(style=style, **kwargs)

# class Input(pydom.Element):
#     tag = "sl-input"

#     label = LabelProperty()
#     placeholder = js_property('placeholder')
#     pill = js_property('pill')

#     def __init__(self, label=None, value=None, type='text', placeholder=None, help_text=None, 
#                 size=None, filled=False, pill=False, disabled=False, readonly=False, autofocus=False,
#                 autocomplete=None, autocorrect=None, autocapitalize=None, spellcheck=None, min=None, max=None,
#                 step=None, name=None, required=False, pattern=None, minlength=None, maxlength=None,
#     ):
#         super().__init__()
    
#     # Now lets map all the properties to the js object
#         self.label = label
#         self.placeholder = placeholder
#         self.pill = pill
#         # self.value = value
#         # self.type = type
#         # self.placeholder = placeholder
#         # self.help_text = help_text
#         # self.size = size
#         # self.filled = filled
#         # self.pill = pill
#         # self.disabled = disabled
#         # self.readonly = readonly
#         # self.autofocus = autofocus
#         # self.autocomplete = autocomplete
#         # self.autocorrect = autocorrect
#         # self.autocapitalize = autocapitalize
#         # self.spellcheck = spellcheck
#         # self.min = min
#         # self.max = max
#         # self.step = step
#         # self.name = name
#         # self.required = required
#         # self.pattern = pattern
#         # self.minlength = minlength
#         # self.maxlength = maxlength

#     @property
#     def value(self):
#         return self._js.value
    
#     @value.setter
#     def value(self, value):
#         self._js.value = value

#     @property
#     def type(self):
#         return self._js.type

#     @type.setter
#     def type(self, value):
#         self._js.type = value

#     @property
#     def placeholder(self):
#         return self._js.placeholder

#     @placeholder.setter
#     def placeholder(self, value):
#         self._js.placeholder = value

#     @property
#     def help_text(self):
#         return self._js.helpText
    
#     @help_text.setter
#     def help_text(self, value):
#         self._js.helpText = value

#     @property
#     def size(self):
#         return self._js.size
    
#     @size.setter
#     def size(self, value):
#         self._js.size = value

#     @property
#     def filled(self):
#         return self._js.filled
    
#     @filled.setter
#     def filled(self, value):
#         self._js.filled = value

#     @property
#     def pill(self):
#         return self._js.pill
    
#     @pill.setter
#     def pill(self, value):
#         self._js.pill = value

#     @property
#     def disabled(self):
#         return self._js.disabled
    
#     @disabled.setter
#     def disabled(self, value):
#         self._js.disabled = value

#     @property
#     def readonly(self):
#         return self._js.readonly
    
#     @readonly.setter
#     def readonly(self, value):
#         self._js.readonly = value
    


# class Badge(Widget):
#     template = '<sl-badge variant="{variant}" pill>{content}</sl-badge>'

#     def __init__(self, content, variant='neutral'):
#         self.content = content
#         self.variant = variant

# class Card(ComplexWidget):
#     template = dedent("""
#             <sl-card class="card-overview">
#                 {img}
#                 {header}
#                 {content}
#                 {footer}
#             </sl-card>
#     """)
#     templates = {
#         'content': '{content}',
#         'footer': dedent("""
#             <div slot="footer">
#                 {footer}
#             </div>
#         """),
#         'header': dedent("""<div slot="header">
#                 {header}
#             </div>"""
#         ),
#         'img': dedent("""
#             <img crossorigin='anonymous' slot="image" src="{img}" alt="..."
#             />"""),
#     }
    
#     def __init__(self, content=None, header=None, footer=None, img=None, img_alt=''):
#         self.content = to_widget(content)
#         self.header = to_widget(header)
#         self.footer = to_widget(footer)
#         self.img_alt = img_alt
#         if img:
#             self.img = to_widget(img)
#         else:
#             self.img = to_widget('')

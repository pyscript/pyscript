from js import document, console
import asyncio
import io, base64

loop = asyncio.get_event_loop()

MIME_METHODS = {
    '__repr__': 'text/plain',
    '_repr_html_': 'text/html',
    '_repr_markdown_': 'text/markdown',
    '_repr_svg_': 'image/svg+xml',
    '_repr_png_': 'image/png',
    '_repr_pdf_': 'application/pdf',
    '_repr_jpeg_': 'image/jpeg',
    '_repr_latex': 'text/latex',
    '_repr_json_': 'application/json',
    '_repr_javascript_': 'application/javascript',
    'savefig': 'image/png'
}

def render_image(mime, value, meta):
    data = f'data:{mime};charset=utf-8;base64,{value}'
    attrs = ' '.join(['{k}="{v}"' for k, v in meta.items()])
    return f'<img src="{data}" {attrs}</img>'

def identity(value, meta):
    return value


MIME_RENDERERS = {
    'text/plain': identity,
    'text/html' : identity,
    'image/png' : lambda value, meta: render_image('image/png', value, meta),
    'image/jpeg': lambda value, meta: render_image('image/jpeg', value, meta),
    'image/svg+xml': identity,
    'application/json': identity,
    'application/javascript': lambda value, meta: f'<script>{value}</script>'
}  


def eval_formatter(obj, print_method):
    """
    Evaluates a formatter method.
    """
    if print_method == '__repr__':
         return repr(obj)
    elif hasattr(obj, print_method):
        if print_method == 'savefig':
            buf = io.BytesIO()
            obj.savefig(buf, format='png')
            buf.seek(0)
            return base64.b64encode(buf.read()).decode('utf-8')
        return getattr(obj, print_method)()
    elif print_method == '_repr_mimebundle_':
        return {}, {}
    return None


def format_mime(obj):
    """
    Formats object using _repr_x_ methods.
    """
    if isinstance(obj, str):
        return obj, 'text/plain'

    mimebundle = eval_formatter(obj, '_repr_mimebundle_')
    if isinstance(mimebundle, tuple):
        format_dict, md_dict = mimebundle
    else:
        format_dict = mimebundle
        md_dict = {}

    output, not_available = None, []
    for method, mime_type in reversed(MIME_METHODS.items()):
        if mime_type in format_dict:
            output = format_dict[mime_type]
        else:
            output = eval_formatter(obj, method)

        if output is None:
            continue
        elif mime_type not in MIME_RENDERERS:
            not_available.append(mime_type)
            continue
        break
    if output is None:
        if not_available:
            console.warning(f'Rendered object requested unavailable MIME renderers: {not_available}')
        output = repr(output)
        mime_type = 'text/plain'
    elif isinstance(output, tuple):
        output, meta = output
    else:
        meta = {}
    return MIME_RENDERERS[mime_type](output, meta), mime_type


class PyScript:
    loop = loop

    @staticmethod
    def write(element_id, value, append=False, exec_id=0):
        """Writes value to the element with id "element_id"""
        console.log(f"APPENDING: {append} ==> {element_id} --> {value}")
        if append:
            child = document.createElement('div');
            element = document.querySelector(f'#{element_id}');
            if not element:
                return
            exec_id = exec_id or element.childElementCount + 1
            element_id = child.id = f"{element_id}-{exec_id}";
            element.appendChild(child);

        element = document.getElementById(element_id)
        html, mime_type = format_mime(value)
        if mime_type in ('application/javascript', 'text/html'):
            scriptEl = document.createRange().createContextualFragment(html)
            element.appendChild(scriptEl)
        else:
            element.innerHTML = html

    @staticmethod
    def run_until_complete(f):
        p = loop.run_until_complete(f)


class Element:
    def __init__(self, element_id, element=None):
        self._id = element_id
        self._element = element

    @property
    def element(self):
        """Return the dom element"""
        if not self._element:
            self._element = document.querySelector(f'#{self._id}');
        return self._element

    def write(self, value, append=False):
        console.log(f"Element.write: {value} --> {append}")
        # TODO: it should be the opposite... pyscript.write should use the Element.write
        #       so we can consolidate on how we write depending on the element type
        pyscript.write(self._id, value, append=append)

    def clear(self):
        if hasattr(self.element, 'value'):
            self.element.value = ''
        else:
            self.write("", append=False)

    def select(self, query, from_content=False):
        el = self.element
        if from_content:
            el = el.content

        _el = el.querySelector(query)
        if _el:
            return Element(_el.id, _el)
        else:
            console.log(f"WARNING: can't find element matching query {query}")

    def clone(self, new_id=None, to=None):
        if new_id is None:
            new_id = self.element.id

        clone = self.element.cloneNode(True);
        clone.id = new_id;

        if to:
            to.element.appendChild(clone)

        # Inject it into the DOM
        self.element.after(clone);
        
        return Element(clone.id, clone)

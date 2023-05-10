import base64
import html
import io
import re

from js import console

MIME_METHODS = {
    "__repr__": "text/plain",
    "_repr_html_": "text/html",
    "_repr_markdown_": "text/markdown",
    "_repr_svg_": "image/svg+xml",
    "_repr_png_": "image/png",
    "_repr_pdf_": "application/pdf",
    "_repr_jpeg_": "image/jpeg",
    "_repr_latex": "text/latex",
    "_repr_json_": "application/json",
    "_repr_javascript_": "application/javascript",
    "savefig": "image/png",
}


def render_image(mime, value, meta):
    # If the image value is using bytes we should convert it to base64
    # otherwise it will return raw bytes and the browser will not be able to
    # render it.
    if isinstance(value, bytes):
        value = base64.b64encode(value).decode("utf-8")

    # This is the pattern of base64 strings
    base64_pattern = re.compile(
        r"^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$"
    )
    # If value doesn't match the base64 pattern we should encode it to base64
    if len(value) > 0 and not base64_pattern.match(value):
        value = base64.b64encode(value.encode("utf-8")).decode("utf-8")

    data = f"data:{mime};charset=utf-8;base64,{value}"
    attrs = " ".join(['{k}="{v}"' for k, v in meta.items()])
    return f'<img src="{data}" {attrs}></img>'


def identity(value, meta):
    return value


MIME_RENDERERS = {
    "text/plain": html.escape,
    "text/html": identity,
    "image/png": lambda value, meta: render_image("image/png", value, meta),
    "image/jpeg": lambda value, meta: render_image("image/jpeg", value, meta),
    "image/svg+xml": identity,
    "application/json": identity,
    "application/javascript": lambda value, meta: f"<script>{value}</script>",
}


def eval_formatter(obj, print_method):
    """
    Evaluates a formatter method.
    """
    if print_method == "__repr__":
        return repr(obj)
    elif hasattr(obj, print_method):
        if print_method == "savefig":
            buf = io.BytesIO()
            obj.savefig(buf, format="png")
            buf.seek(0)
            return base64.b64encode(buf.read()).decode("utf-8")
        return getattr(obj, print_method)()
    elif print_method == "_repr_mimebundle_":
        return {}, {}
    return None


def format_mime(obj):
    """
    Formats object using _repr_x_ methods.
    """
    if isinstance(obj, str):
        return html.escape(obj), "text/plain"

    mimebundle = eval_formatter(obj, "_repr_mimebundle_")
    if isinstance(mimebundle, tuple):
        format_dict, _ = mimebundle
    else:
        format_dict = mimebundle

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
            console.warn(
                f"Rendered object requested unavailable MIME renderers: {not_available}"
            )
        output = repr(output)
        mime_type = "text/plain"
    elif isinstance(output, tuple):
        output, meta = output
    else:
        meta = {}
    return MIME_RENDERERS[mime_type](output, meta), mime_type

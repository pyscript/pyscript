// ⚠️ This file is an artifact: DO NOT MODIFY
export default {
  "_pyscript": {
    "__init__.py": "import js as window\n\nIS_WORKER = not hasattr(window, \"document\")\n\nif IS_WORKER:\n    from polyscript import xworker as _xworker\n\n    window = _xworker.window\n    document = window.document\n    sync = _xworker.sync\nelse:\n    document = window.document\n",
    "display.py": "import base64\nimport html\nimport io\nimport re\n\nfrom . import document, window\n\n_MIME_METHODS = {\n    \"__repr__\": \"text/plain\",\n    \"_repr_html_\": \"text/html\",\n    \"_repr_markdown_\": \"text/markdown\",\n    \"_repr_svg_\": \"image/svg+xml\",\n    \"_repr_png_\": \"image/png\",\n    \"_repr_pdf_\": \"application/pdf\",\n    \"_repr_jpeg_\": \"image/jpeg\",\n    \"_repr_latex\": \"text/latex\",\n    \"_repr_json_\": \"application/json\",\n    \"_repr_javascript_\": \"application/javascript\",\n    \"savefig\": \"image/png\",\n}\n\n\ndef _render_image(mime, value, meta):\n    # If the image value is using bytes we should convert it to base64\n    # otherwise it will return raw bytes and the browser will not be able to\n    # render it.\n    if isinstance(value, bytes):\n        value = base64.b64encode(value).decode(\"utf-8\")\n\n    # This is the pattern of base64 strings\n    base64_pattern = re.compile(\n        r\"^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$\"\n    )\n    # If value doesn't match the base64 pattern we should encode it to base64\n    if len(value) > 0 and not base64_pattern.match(value):\n        value = base64.b64encode(value.encode(\"utf-8\")).decode(\"utf-8\")\n\n    data = f\"data:{mime};charset=utf-8;base64,{value}\"\n    attrs = \" \".join(['{k}=\"{v}\"' for k, v in meta.items()])\n    return f'<img src=\"{data}\" {attrs}></img>'\n\n\ndef _identity(value, meta):\n    return value\n\n\n_MIME_RENDERERS = {\n    \"text/plain\": html.escape,\n    \"text/html\": _identity,\n    \"image/png\": lambda value, meta: _render_image(\"image/png\", value, meta),\n    \"image/jpeg\": lambda value, meta: _render_image(\"image/jpeg\", value, meta),\n    \"image/svg+xml\": _identity,\n    \"application/json\": _identity,\n    \"application/javascript\": lambda value, meta: f\"<script>{value}<\\\\/script>\",\n}\n\n\ndef _eval_formatter(obj, print_method):\n    \"\"\"\n    Evaluates a formatter method.\n    \"\"\"\n    if print_method == \"__repr__\":\n        return repr(obj)\n    elif hasattr(obj, print_method):\n        if print_method == \"savefig\":\n            buf = io.BytesIO()\n            obj.savefig(buf, format=\"png\")\n            buf.seek(0)\n            return base64.b64encode(buf.read()).decode(\"utf-8\")\n        return getattr(obj, print_method)()\n    elif print_method == \"_repr_mimebundle_\":\n        return {}, {}\n    return None\n\n\ndef _format_mime(obj):\n    \"\"\"\n    Formats object using _repr_x_ methods.\n    \"\"\"\n    if isinstance(obj, str):\n        return html.escape(obj), \"text/plain\"\n\n    mimebundle = _eval_formatter(obj, \"_repr_mimebundle_\")\n    if isinstance(mimebundle, tuple):\n        format_dict, _ = mimebundle\n    else:\n        format_dict = mimebundle\n\n    output, not_available = None, []\n    for method, mime_type in reversed(_MIME_METHODS.items()):\n        if mime_type in format_dict:\n            output = format_dict[mime_type]\n        else:\n            output = _eval_formatter(obj, method)\n\n        if output is None:\n            continue\n        elif mime_type not in _MIME_RENDERERS:\n            not_available.append(mime_type)\n            continue\n        break\n    if output is None:\n        if not_available:\n            window.console.warn(\n                f\"Rendered object requested unavailable MIME renderers: {not_available}\"\n            )\n        output = repr(output)\n        mime_type = \"text/plain\"\n    elif isinstance(output, tuple):\n        output, meta = output\n    else:\n        meta = {}\n    return _MIME_RENDERERS[mime_type](output, meta), mime_type\n\n\ndef _write(element, value, append=False):\n    html, mime_type = _format_mime(value)\n    if html == \"\\\\n\":\n        return\n\n    if append:\n        out_element = document.createElement(\"div\")\n        element.append(out_element)\n    else:\n        out_element = element.lastElementChild\n        if out_element is None:\n            out_element = element\n\n    if mime_type in (\"application/javascript\", \"text/html\"):\n        script_element = document.createRange().createContextualFragment(html)\n        out_element.append(script_element)\n    else:\n        out_element.innerHTML = html\n\n\ndef display(*values, target=None, append=True):\n    element = document.getElementById(target)\n    for v in values:\n        _write(element, v, append=append)\n"
  },
  "pyscript.py": "# export only what we want to expose as `pyscript` module\n# but not what is WORKER/MAIN dependent\nfrom _pyscript import window, document, IS_WORKER\nfrom _pyscript.display import display as _display\n\n# this part is needed to disambiguate between MAIN and WORKER\nif IS_WORKER:\n    # in workers the display does not have a default ID\n    # but there is a sync utility from xworker\n    import polyscript as _polyscript\n    from _pyscript import sync\n\n    def current_target():\n        return _polyscript.target\n\nelse:\n    # in MAIN both PyWorker and current element target exist\n    # so these are both exposed and the display will use,\n    # if not specified otherwise, such current element target\n    import _pyscript_js\n\n    PyWorker = _pyscript_js.PyWorker\n\n    def current_target():\n        return _pyscript_js.target\n\n\n# the display provides a handy default target either in MAIN or WORKER\ndef display(*values, target=None, append=True):\n    if target is None:\n        target = current_target()\n\n    return _display(*values, target=target, append=append)\n"
};

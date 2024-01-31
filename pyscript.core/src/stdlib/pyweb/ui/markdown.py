"""Markdown module to generate web/HTML components from Markdown code"""
from pyweb.ui.elements import TextElementBase

from pyscript import document, window


class markdown(TextElementBase):
    """Markdown component to render HTML from Markdown code"""

    tag = "div"

    def __init__(self, content, style=None, **kwargs):
        # TODO: We should sanitize the content!!!!!
        html = window.marked.parse(content)
        super().__init__(html, style=style, **kwargs)

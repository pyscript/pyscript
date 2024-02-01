"""Markdown module to generate web/HTML components from Markdown code"""
from pyweb import pydom
from pyweb.ui.elements import TextElementBase, script

from pyscript import document, window


class markdown(TextElementBase):
    """Markdown component to render HTML from Markdown code"""

    tag = "div"

    def __init__(self, content, style=None, **kwargs):
        # TODO: We should sanitize the content!!!!!

        html = window.marked.parse(content)
        super().__init__(html, style=style, **kwargs)


# TODO: DON'T KNOW WHY BUT THIS DOESN'T WORK
def load_resources(parent=None):
    if parent is None:
        parent = pydom.body

    parent.append(
        script(src="https://cdn.jsdelivr.net/npm/marked@11.1.1/lib/marked.umd.min.js"),
    )


# load_resources()

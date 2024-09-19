"""
Sanity check for the pyscript.document object.
"""

from pyscript import document


def test_document():
    """
    The document object should be available and we can change its attributes
    (in this case, the title).
    """
    title = document.title
    assert title
    document.title = "A new title"
    assert document.title == "A new title"
    document.title = title

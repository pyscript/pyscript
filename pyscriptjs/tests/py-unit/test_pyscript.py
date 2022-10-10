import sys
from unittest.mock import Mock

import pyscript


class TestElement:
    def test_id_is_correct(self):
        el = pyscript.Element("something")
        assert el.id == "something"

    def test_element(self, monkeypatch):
        el = pyscript.Element("something")
        document_mock = Mock()
        call_result = "some_result"
        document_mock.querySelector = Mock(return_value=call_result)
        monkeypatch.setattr(pyscript, "document", document_mock)
        assert not el._element
        real_element = el.element
        assert real_element
        assert pyscript.document.querySelector.call_count == 1
        pyscript.document.querySelector.assert_called_with("#something")
        assert real_element == call_result


def test_format_mime_str():
    obj = "just a string"
    out, mime = pyscript.format_mime(obj)
    assert out == obj
    assert mime == "text/plain"

def test_format_mime_str_escaping():
    obj = "<p>hello</p>"
    out, mime = pyscript.format_mime(obj)
    assert out == "&lt;p&gt;hello&lt;/p&gt;"
    assert mime == "text/plain"


def test_format_mime_repr_escaping():
    out, mime = pyscript.format_mime(sys)
    assert out == "&lt;module 'sys' (built-in)&gt;"
    assert mime == "text/plain"


def test_format_mime_HTML():
    obj = pyscript.HTML("<p>hello</p>")
    out, mime = pyscript.format_mime(obj)
    assert out == "<p>hello</p>"
    assert mime == "text/html"

    res = pyscript.format_mime(obj)
    assert res[0] == obj
    assert res[1] == "text/plain"


def test_set_version():
    pyscript.PyScript.set_version_info(
        '{"year": 1234, "month": 56, "patch": 78, "releaselevel": "testing", "commit": "dummycommit"}'
    )
    assert pyscript.PyScript.__version__ == "1234.56.78.testing.dummycommit"
    assert pyscript.PyScript.version_info == (1234, 56, 78, "testing", "dummycommit")

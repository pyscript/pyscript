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

    res = pyscript.format_mime(obj)
    assert res[0] == obj
    assert res[1] == "text/plain"

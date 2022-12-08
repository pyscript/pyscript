import sys
import textwrap
from unittest.mock import Mock

import py_markdown


class TestPyMarkdown:
    def test_plugin_hooks(self, monkeypatch):
        console_mock = Mock()
        monkeypatch.setattr(py_markdown, "console", console_mock)
        config = "just a config"
        runtime = "just a runtime"

        py_markdown.plugin.configure(config)
        console_mock.log.assert_called_with("configuration received: just a config")
        
        py_markdown.plugin.afterStartup(runtime)
        console_mock.log.assert_called_with("runtime received: just a runtime")

    # def test_connected(self, monkeypatch):
    #     el = pyscript.Element("something")
    #     document_mock = Mock()
    #     call_result = "some_result"
    #     document_mock.querySelector = Mock(return_value=call_result)
    #     monkeypatch.setattr(pyscript, "document", document_mock)
    #     assert not el._element
    #     real_element = el.element
    #     assert real_element
    #     assert pyscript.document.querySelector.call_count == 1
    #     pyscript.document.querySelector.assert_called_with("#something")
    #     assert real_element == call_result

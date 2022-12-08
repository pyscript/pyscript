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

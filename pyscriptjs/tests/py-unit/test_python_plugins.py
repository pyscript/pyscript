import html
from unittest.mock import Mock

import py_markdown
import py_tutor
import pyscript_plugins_tester as ppt

import pyscript

TUTOR_SOURCE = """
<py-config>
    packages = [
    "folium",
    "pandas"
    ]
    plugins = [
    "../build/plugins/python/py_tutor.py"
    ]
</py-config>

<py-script>
import folium
import json
import pandas as pd

from pyodide.http import open_url

# the rest of the code goes one
</py-script>
"""


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


class TestPyTutor:
    def check_prism_added(self):
        head = pyscript.js.document.head

        # EXPECT the head elements to be present and correctly configured
        links = head.getElementsByTagName("link")
        assert len(links) == 1
        link = links[0]
        assert link.type == "text/css"
        assert link.rel == "stylesheet"
        assert link.href == "./assets/prism/prism.css"

        scripts = head.getElementsByTagName("script")
        assert len(scripts) == 1
        script = scripts[0]
        assert script.type == "text/javascript"
        assert script.src == "./assets/prism/prism.js"

        # TODO: Check this because seems wrong. It should have src and not really PAGE_SCRIPT?

        # Check the actual JS script code
        # To do so we have 2 methods (it depends on browser support so we check either...)
        if script.childNodes:
            # in this case it means the content has been added as a child element
            node = script.childNodes[0]
            assert node.data == py_tutor.PAGE_SCRIPT

    def check_append_script_to_page(self):
        body = pyscript.js.document.body
        scripts = body.getElementsByTagName("script")
        assert len(scripts) == 1
        script = scripts[0]
        assert script.type == "text/javascript"

        # Check the actual JS script code
        # To do so we have 2 methods (it depends on browser support so we check either...)
        if script.childNodes:
            # in this case it means the content has been added as a child element
            node = script.childNodes[0]
            assert node.data == py_tutor.PAGE_SCRIPT
        else:
            assert script.text == py_tutor.PAGE_SCRIPT

    def check_create_code_section(self):
        console = py_tutor.js.console
        console.info.assert_any_call("Creating code introspection section.")
        console.info.assert_any_call("Creating new code section element.")

        body = pyscript.js.document.body
        sections = body.getElementsByTagName("section")
        section = sections[0]
        assert "code" in section.classList._classes
        section_innerHTML = py_tutor.TEMPLATE_CODE_SECTION.format(
            source=html.escape(TUTOR_SOURCE), modules_section=""
        )
        assert html.escape(TUTOR_SOURCE) in section.innerHTML
        assert section.innerHTML == section_innerHTML

    def test_connected_calls(self, plugins_manager: ppt.PluginsManager):
        # GIVEN THAT we add the plugin to the app plugin manager
        # this will:
        # - init the plugin instance passing the plugins_manager as parent app
        # - add the plugin instance to plugins_manager.plugins
        assert not py_tutor.plugin.app
        plugins_manager.addPythonPlugin(py_tutor.plugin)

        # EXPECT: the plugin app to now be the plugin manager
        assert py_tutor.plugin.app == plugins_manager
        tutor_ce = plugins_manager._custom_elements["py-tutor"]
        # tutor_ce_python_instance = tutor_ce.pyPluginInstance
        # GIVEN: The following innerHTML on the ce elements
        tutor_ce.innerHTML = TUTOR_SOURCE

        # GIVEN: the CustomElement connectedCallback gets called
        tutor_ce.connectedCallback()

        # EXPECT: the
        self.check_prism_added()

        self.check_append_script_to_page()

        self.check_create_code_section()

    def test_plugin_registered(self, plugins_manager: ppt.PluginsManager):
        # EXPECT py_tutor.plugin to not have any app associate
        assert not py_tutor.plugin.app

        # EXPECT: the plugin manager to not have any plugin registered
        assert not plugins_manager.plugins

        # GIVEN THAT we add the plugin to the app plugin manager
        plugins_manager.addPythonPlugin(py_tutor.plugin)

        # EXPECT: the plugin app to now be the plugin manager
        assert py_tutor.plugin.app == plugins_manager

        # EXPECT: the pytutor.plugin manager to be part of
        assert py_tutor.plugin in plugins_manager.plugins

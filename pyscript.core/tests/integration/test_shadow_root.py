import pytest

from .support import PyScriptTest


class TestShadowRoot(PyScriptTest):
    @pytest.mark.skip("NEXT: Element interface is gone. Replace with PyDom")
    def test_reachable_shadow_root(self):
        self.pyscript_run(
            r"""
            <script>
                // reason to wait for py-script is that it's the entry point for
                // all patches and the MutationObserver, otherwise being this a synchronous
                // script the constructor gets instantly invoked at the node before
                // py-script gets a chance to initialize itself.
                customElements.whenDefined('py-script').then(() => {
                    customElements.define('s-r', class extends HTMLElement {
                      constructor() {
                        super().attachShadow({mode: 'closed'}).innerHTML =
                            '<div id="shadowed">OK</div>';
                      }
                  });
                });
            </script>
            <s-r></s-r>
            <script type="py">
                import js
                js.console.log(Element("shadowed").innerHtml)
            </script>
            """
        )
        assert self.console.log.lines[-1] == "OK"

import html

from pyscript import Plugin, js

js.console.warn(
    "WARNING: This plugin is still in a very experimental phase and will likely change"
    " and potentially break in the future releases. Use it with caution."
)

plugin = Plugin("PyTutorial")

# TODO: We can totally implement this in Python
PAGE_SCRIPT = """
    const viewCodeButton = document.getElementById("view-code-button");

    const codeSection = document.getElementById("code-section");
    const handleClick = () => {
      if (codeSection.classList.contains("code-section-hidden")) {
        codeSection.classList.remove("code-section-hidden");
        codeSection.classList.add("code-section-visible");
      } else {
        codeSection.classList.remove("code-section-visible");
        codeSection.classList.add("code-section-hidden");
      }
    }

    viewCodeButton.addEventListener("click", handleClick)
    viewCodeButton.addEventListener("keydown", (e) => {
      if (e.key === " " || e.key === "Enter" || e.key === "Spacebar") {
        handleClick();
      }
    })
"""

TEMPLATE_CODE_SECTION = """
      <div id="view-code-button" role="button" aria-pressed="false" tabindex="0">View Code</div>
      <div id="code-section" class="code-section-hidden">
        <p>index.html</p>
        <pre class="prism-code language-html">
          <code class="language-html">
              {source}
          </code>
        </pre>
      </div>
"""


@plugin.register_custom_element("py-tutor")
class PyMarkdown:
    def __init__(self, element):
        self.element = element

    def create_script(self):
        el = js.document.createElement("script")
        el.type = "text/javascript"
        try:
            el.appendChild(js.document.createTextNode(PAGE_SCRIPT))
        except BaseException:
            el.text = PAGE_SCRIPT

        js.document.body.appendChild(el)

    def add_prism(self):
        # Add The CSS
        link = js.document.createElement("link")
        link.type = "text/css"
        link.rel = "stylesheet"
        js.document.head.appendChild(link)
        link.href = "./assets/prism/prism.css"

        # Add the JS file
        script = js.document.createElement("script")
        script.type = "text/javascript"
        try:
            script.appendChild(js.document.createTextNode(PAGE_SCRIPT))
        except BaseException:
            script.text = PAGE_SCRIPT
        script.src = "./assets/prism/prism.js"
        js.document.head.appendChild(script)

    def _create_code_section(self, source, parent=None):
        if not parent:
            parent = js.document.body

        el = js.document.createElement("section")
        el.classList.add("code")
        el.innerHTML = TEMPLATE_CODE_SECTION.format(source=source)
        parent.appendChild(el)

    def create_page_code_section(self):
        self._create_code_section(html.escape(self.element.innerHTML))

    def create_single_scripts_section(self):
        """
        Creates a code section (that inspects the code) for each py-script element
        in the page.
        """
        for pyscript_tag in js.document.querySelectorAll("py-script"):
            try:
                source = pyscript_tag.pySrc
            except AttributeError:
                source = pyscript_tag.innerHTML

            self._create_code_section(source)

    def connect(self):
        self.create_page_code_section()

        # append the script needed to show source first...
        self.create_script()

        self.add_prism()

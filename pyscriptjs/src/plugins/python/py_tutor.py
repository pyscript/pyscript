import html

from pyscript import Plugin, js

js.console.warn(
    "WARNING: This plugin is still in a very experimental phase and will likely change"
    " and potentially break in the future releases. Use it with caution."
)

plugin = Plugin("PyTutorial")

# TODO: Part of the CSS is hidden in examples.css ---->> IMPORTANT: move it here!!

# TODO: Python files running and <py-script src="bla.py"> not in the config are not available...

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

{modules_section}
</div>
"""

TEMPLATE_PY_MODULE_SECTION = """
<p>{module_name}</p>
<pre class="prism-code language-python">
    <code class="language-python">
{source}
    </code>
</pre>
"""


@plugin.register_custom_element("py-tutor")
class PyTutor:
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

    def _create_code_section(self, source, module_paths=None, parent=None):
        if not parent:
            parent = js.document.body

        js.console.info("Creating code introspection section.")
        modules_section = self.create_modules_section(module_paths)

        js.console.info("Creating new code section element.")
        el = js.document.createElement("section")
        el.classList.add("code")

        el.innerHTML = TEMPLATE_CODE_SECTION.format(
            source=source, modules_section=modules_section
        )
        parent.appendChild(el)

    @classmethod
    def create_modules_section(cls, module_paths=None):
        js.console.info(f"Module paths to parse: {module_paths}")
        if not module_paths:
            return ""

        return "\n\n".join([cls.create_module_section(m) for m in module_paths])

    @staticmethod
    def create_module_section(module_path):
        js.console.info(f"Creating module section: {module_path}")
        with open(module_path) as fp:
            content = fp.read()
        return TEMPLATE_PY_MODULE_SECTION.format(
            module_name=module_path, source=content
        )

    def create_page_code_section(self):
        # Get the content of all the modules that were passed to be documented
        module_paths = self.element.getAttribute("modules")
        if module_paths:
            js.console.info(f"Module paths detected: {module_paths}")
            module_paths = str(module_paths).split(";")

        # Get the inner HTML content of the py-tutor tag and document that
        tutor_tag_innerHTML = html.escape(self.element.innerHTML)

        self._create_code_section(tutor_tag_innerHTML, module_paths)

    # def create_single_scripts_section(self):
    #     """
    #     Creates a code section (that inspects the code) for each py-script element
    #     in the page.
    #     """
    #     # For all script tags in the page
    #     for pyscript_tag in js.document.querySelectorAll("py-script"):
    #         try:
    #             source = pyscript_tag.pySrc
    #         except AttributeError:
    #             source = pyscript_tag.innerHTML

    #         self._create_code_section(source)

    def connect(self):
        self.create_page_code_section()

        # append the script needed to show source first...
        self.create_script()

        self.add_prism()

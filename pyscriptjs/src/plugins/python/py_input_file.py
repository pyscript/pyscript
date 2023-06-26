import os

from js import FileReader, Uint8Array, console, document
from pyscript import Plugin

console.warn(
    "WARNING: This plugin is still in a very experimental phase and will likely change"
    " and potentially break in the future releases. Use it with caution."
)

plugin = Plugin("PyInputFile")


@plugin.register_custom_element("py-input-file")
class PyInputFile:
    def __init__(self, element):
        self.element = element
        self.fileInput = document.createElement("input")
        # Uploading files to dir ('/home/uploads')
        self.path = "/home/uploads"
        for attr in self.element.attributes:
            if attr.name in ["id", "name"]:
                attr.value = f"py-{attr.value}"
            self.fileInput.setAttribute(attr.name, attr.value)

        self.create_folder(self.path)

    def onchange(self):
        if self.element.getAttribute("type") != "file":
            return self.element.onchange

        print("Uploading...")
        for file in self.fileInput.files:
            reader = FileReader.new()
            reader.readAsArrayBuffer(file)
            self.file_process(reader, file.name)
            reader.onload = lambda event: self.file_process(
                self.onload(event, file), file.name
            )  # self.onload
            reader.onerror = lambda event: console.error(event.target.error)
        print("Uploaded...")

    def file_process(self, arrayBuffer, file_name):
        filedata = Uint8Array.new(arrayBuffer)
        with open(f"{self.path}/{file_name}", "wb") as file:
            file.write(bytearray(filedata))

    def onload(self, event, file):
        return event.target.result

    def create_folder(self, dir):
        if not os.path.exists(dir):
            os.makedirs(dir)
            print(f"Created folder:{dir}")
        print(f"Folder already exists: {dir}")

    def connect(self):
        self.fileInput.onchange = lambda event: self.onchange()
        self.element.appendChild(self.fileInput)

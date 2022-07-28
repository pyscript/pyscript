from datetime import datetime as dt
import pyscript
from js import document

class MyHello:
    __tag__ = 'my-hello'

    def __init__(self, parent):
        self.parent = parent

    def connect(self):
        div = document.createElement('div')
        div.innerHTML = "<b>Hello world, I'm a custom widget</b>"
        self.parent.shadow.appendChild(div)


# this is automatically called by <py-plugin>
def pyscript_init_plugin():
    pyscript.register_custom_widget(MyHello)

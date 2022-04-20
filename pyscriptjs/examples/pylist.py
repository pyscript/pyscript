from datetime import datetime as dt
from xml.dom.pulldom import END_ELEMENT
from js import console, HTMLElement, document


class PyList(PyListTemplate):
  pass


class PyItem(PyItemTemplate):
  def on_click(self, evt=None):
    self.data['done'] = not self.data['done']
    self.strike(self.data['done'])
  
    self.select('input').element.checked = self.data['done']
    

def add_task(*ags, **kws):
  task = { "content": new_task_content.value,  "done": False, "created_at": dt.now() }
  myList.add(PyItem(task, labels=['content'], state_key="done"))
  new_task_content.clear()

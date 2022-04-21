from datetime import datetime as dt

class PyItem(PyItemTemplate):
  def on_click(self, evt=None):
    self.data['done'] = not self.data['done']
    self.strike(self.data['done'])
  
    self.select('input').element.checked = self.data['done']
    
class PyList(PyListTemplate):
  item_class = PyItem

def add_task(*ags, **kws):
  task = { "content": new_task_content.value,  "done": False, "created_at": dt.now() }
  myList.add(task, labels=['content'], state_key="done")
  new_task_content.clear()

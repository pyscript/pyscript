from datetime import datetime as dt

class PyItem(PyItemTemplate):
  def on_click(self, evt=None):
    self.data['done'] = not self.data['done']
    self.strike(self.data['done'])
  
    self.select('input').element.checked = self.data['done']
    
class PyList(PyListTemplate):
  item_class = PyItem

def add_task(*ags, **kws):
  # create a new dictionary representing the new task
  task = { "content": new_task_content.value,  "done": False, "created_at": dt.now() }

  # add a new task to the list and tell it to use the `content` key to show in the UI
  # and to use the key `done` to sync the task status with a checkbox element in the UI
  myList.add(task, labels=['content'], state_key="done")

  # clear the inputbox element used to create the new task
  new_task_content.clear()

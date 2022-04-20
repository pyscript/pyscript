from datetime import datetime as dt
from xml.dom.pulldom import END_ELEMENT
from js import console, HTMLElement, document


def add_classes(element, class_list):
  for klass in class_list.split(' '):
      element.classList.add(klass)

def create(what, id_=None, classes=''):
  element = document.createElement(what)
  if id_:
    element.id = id_
  add_classes(element, classes)
  return Element(id_, element)


class PyList:
  def __init__(self, parent):
    self.parent = parent
    self._children = []
    self.id = self.parent.id

  def connect(self):
    self.md = main_div = document.createElement('div');
    main_div.id = self.id + "-list-tasks-container"

    for klass in "flex flex-col-reverse mt-4".split(' '):
      main_div.classList.add(klass)
    
    self.parent.appendChild(main_div)

  def add(self, data, labels):
    child = PyItem(self, data, labels)
    return self._add(child)

  def _add(self, child_elem):
    self._children.append(child_elem)
    console.log("appending child", child_elem.element)
    self.md.appendChild(child_elem.create().element)
    return child_elem

class PyItem(Element):
  def __init__(self, parent, data, labels):
    self._parent = parent
    self.id = f"{self._parent.id}-c-{len(self._parent._children)}"
    self.data = data
    self.data['id'] = self.id
    self.labels = labels

    super().__init__(self.id)

  def create(self):
    console.log('creating section')
    new_child = create('section', self.id, "task bg-white my-1")
    console.log('creating values')
    values = ' - '.join([self.data[f] for f in self.labels])
    console.log('creating innerHtml')
    new_child._element.innerHTML = f"""
<label for="flex items-center p-2 ">
  <input class="mr-2" type="checkbox" class="task-check">
  <p class="m-0 inline">{values}</p>
</label>
    """

    check = new_child.select('input').element
    check.onclick = self.check_task
    console.log('returning')
    return new_child

  def check_task(self, evt=None):
    self.data['done'] = not self.data['done']
    if self.data['done']:
      self.add_class("line-through")
    else:
      self.remove_class("line-through")

  
def add_task(*ags, **kws):
  console.log(new_task_content.value) 
  console.log('adding', myList)
  task = {
    "content": new_task_content.value, 
    "done": False,
    "created_at": dt.now()
  }
  myList.add(task, ['content'])
  new_task_content.clear()

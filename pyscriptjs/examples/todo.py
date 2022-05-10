from datetime import datetime as dt

from utils import add_class, remove_class

tasks = []

# define the task template that will be use to render new templates to the page
task_template = Element("task-template").select(".task", from_content=True)
task_list = Element("list-tasks-container")
new_task_content = Element("new-task-content")


def add_task(*ags, **kws):
    # ignore empty task
    if not new_task_content.element.value:
        return None

    # create task
    task_id = f"task-{len(tasks)}"
    task = {
        "id": task_id,
        "content": new_task_content.element.value,
        "done": False,
        "created_at": dt.now(),
    }

    tasks.append(task)

    # add the task element to the page as new node in the list by cloning from a
    # template
    task_html = task_template.clone(task_id, to=task_list)
    task_html_content = task_html.select("p")
    task_html_content.element.innerText = task["content"]
    task_html_check = task_html.select("input")
    task_list.element.appendChild(task_html.element)

    def check_task(evt=None):
        task["done"] = not task["done"]
        if task["done"]:
            add_class(task_html_content, "line-through")
        else:
            remove_class(task_html_content, "line-through")

    new_task_content.clear()
    task_html_check.element.onclick = check_task


def add_task_event(e):
    if e.key == "Enter":
        add_task()


new_task_content.element.onkeypress = add_task_event

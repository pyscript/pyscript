from datetime import datetime as dt

from pyscript import document

tasks = []


def q(selector, root=document):
    return root.querySelector(selector)


# define the task template that will be use to render new templates to the page
task_template = q("#task-template").content.querySelector(".task")
task_list = q("#list-tasks-container")
new_task_content = q("#new-task-content")


def add_task(e):
    # ignore empty task
    if not new_task_content.value:
        return None

    # create task
    task_id = f"task-{len(tasks)}"
    task = {
        "id": task_id,
        "content": new_task_content.value,
        "done": False,
        "created_at": dt.now(),
    }

    tasks.append(task)

    # add the task element to the page as new node in the list by cloning from a
    # template
    task_html = task_template.cloneNode(True)
    task_html.id = task_id
    task_html_check = q("input", root=task_html)
    task_html_content = q("p", root=task_html)
    task_html_content.textContent = task["content"]
    task_list.append(task_html)

    def check_task(evt=None):
        task["done"] = not task["done"]
        task_html_content.classList.toggle("line-through", task["done"])

    new_task_content.value = ""
    task_html_check.onclick = check_task


def add_task_event(e):
    if e.key == "Enter":
        add_task(e)


new_task_content.onkeypress = add_task_event

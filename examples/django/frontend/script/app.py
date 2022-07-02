import json
import asyncio
from pyodide.http import pyfetch
from pyodide import JsException,create_proxy
import js
import pyodide


async def GetTasks():
    response = await pyfetch(
        url="http://127.0.0.1:8000/",
        method="GET",
        headers={"Content-Type": "application/json"},
    )
    if response.ok:
        data = await response.json()
        parent = js.document.querySelector("#todo-row")
        js.document.querySelector('#taskadd').value =""
        before_child = js.document.querySelectorAll(".task-test")
        before_child2 = js.document.querySelectorAll("#del")
        if before_child and before_child2:
            for b in before_child:
                b.remove()
            for c in before_child2:
                c.remove() 
        i=0
        for t in data:
            i +=1
            html_data =js.document.createElement("h6")
            html_data.className = "task-test col-8"
            html_data.innerHTML = t["task"]
            parent.appendChild(html_data)
            button=js.document.createElement("button")
            button.className = "btn btn-delete btn-outline-light btn-danger col-4"
            button.innerHTML = "Delete"
            button.value = t["id"]
            button.setAttribute("id", "del")
            button.addEventListener("click", create_proxy(delete))
            parent.appendChild(button)
    
    



async def create(e):
    task = js.document.querySelector('#taskadd').value
    response = await pyfetch(
        url=f"http://127.0.0.1:8000/",
        method="POST",
        headers={"Content-Type": "application/json"},
        body = json.dumps({
            "task":task
        })
    )
    loop = asyncio.get_event_loop()
    loop.run_until_complete(GetTasks())


async def delete(e):
    id = e.target.value
    response = await pyfetch(
        url=f"http://127.0.0.1:8000/delete/{id}",
        method="DELETE",
        headers={"Content-Type": "application/json"},
     
    )
    loop = asyncio.get_event_loop()
    loop.run_until_complete(GetTasks())
    


loop = asyncio.get_event_loop()
loop.run_until_complete(GetTasks())

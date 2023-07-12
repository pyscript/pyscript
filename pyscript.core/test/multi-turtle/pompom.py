import turtle
import random

turtle.set_defaults(canvwidth=300, canvheight=240)

colours = [
    "red",
    "green",
    "blue",
    "yellow",
    "orange",
    "brown",
    "gold",
    "purple",
    "black",
]

turtle.speed(8)
turtle.pensize(12)

for i in range(100):
    turtle.penup()
    turtle.setpos(0, 0)
    turtle.left(random.randint(1, 360))
    turtle.pendown()
    turtle.color(random.choice(colours))
    turtle.forward(random.randint(20, 90))

turtle.Screen().show_scene()
result = turtle.svg()

from xworker import xworker

document = xworker.window.document

container = document.createElement("span")
container.innerHTML = result
document.body.appendChild(container)

import js
from pyodide.ffi import to_js
from pyscript import when

def colorize(color):
    print("Color: ", color)

def printEventId(event, name):
    print(f"{name}'s favorite page element is {event.target.id}")

class Instance():
  def somefunc(self):
    print(self)
    print("Somefunc got called")

  def someEventFunc(self, evt):
    print("Got event with target ", evt.target)
    print("someEventFunc got called")

  @classmethod
  def classMethod(cls, evt):
    print(evt)

instance = Instance()

# maybe we could accept name so we can select several tags
@when.click(id="whenWithEvent")
def whenWithEvent(evt):
    print(f"I've clicked {evt.target} with id {evt.target.id}")

@when("click", id="whenWithoutEvent")
def myFunction():
    print(f"Hey! I got called successfully")

@app.myId("click")
def foo():
    print("Hi")

def pyClickWithEvent(evt, default = "jeff"):
    print(f"I've called pyClickWithEvent, clicked {evt.target} with id {evt.target.id}")


def pyClickWithoutEvent():
    print(f"I've clicked myboo, and it ran with no arguements")

def pyClickTwoArguments(first, second):
    print(f"I got {first=}, {second=}")

#@pys_handler(options="blah")
#def fun(func_param="blu"):
#  print('🔥')

#def pop(evt):
#  return loo(evt, 123)

#@pys_handler
#def a():
#  js.console.log("loo called with *event")

#@pys_handler
#def loo(*e):
#    js.console.log("loo called with *event")
#    js.console.log( e[0] )
#    js.console.log( e[1] )
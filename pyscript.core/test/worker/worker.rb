require "js"

xworker = JS::eval("return xworker")

def on_message(event)
  puts event[:data]
  xworker.postMessage('Ruby: Hello MicroPython 👋')
end

xworker.onmessage = on_message

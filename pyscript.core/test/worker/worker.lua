function on_message(event)
  print(event.data)
  xworker.postMessage('Lua: Hello MicroPython 👋')
end

xworker.onmessage = on_message

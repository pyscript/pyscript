def on_message(event)
  puts event[:data]
  $xworker.call('postMessage', 'Ruby: Hello MicroPython 👋')
end

$xworker[:onmessage] = -> (event) { on_message event }

function on_message(event)
    print(event.data)
    xworker.postMessage('thread')
end

xworker.onmessage = on_message

-- be sure the page knows the worker has done parsing to avoid
-- unnecessary random timeouts all over the tests
xworker.window.document.documentElement.classList.add("worker")

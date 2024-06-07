from pyscript import document, window
from pyscript.js_modules.micro_repl import default as Board

# setup the board
def on_connect():
    from events import keydown, toggle
    connect.disabled = True
    reset.disabled = False
    if board.name == "SPIKE Prime with STM32F413":
        message.hidden = False
        message.onkeydown = keydown(board)
    else:
        led.hidden = False
        led.onclick = toggle(board)

def on_disconnect():
    connect.disabled = False
    reset.disabled = True
    led.hidden = True
    message.hidden = True

def on_error(error):
    window.console.warn(error)

board = Board({
    "onconnect": on_connect,
    "ondisconnect": on_disconnect,
    "onerror": on_error,
})

# setup the DOM
async def on_click(event):
    await board.connect(output)
    window.board = board

async def on_reset(error):
    reset.disabled = True
    board.terminal.reset()
    await board.reset()
    reset.disabled = False

connect, reset, led, message, output, = document.querySelectorAll(
    "#connect, #reset, #led, #message, #output"
)

connect.onclick = on_click
reset.onclick = on_reset

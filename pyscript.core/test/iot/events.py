from pyscript.js_modules.dedent import default as dedent

def keydown(board):
    async def on(event):
        if event.code == "Enter":
            import asyncio, json
            target = event.target
            value = json.dumps(target.value)
            target.value = ""
            board.eval(dedent(f"""
                from hub import light_matrix

                light_matrix.write({value})
            """))
            return False
    return on

def toggle(board):
    async def on(event):
        target = event.target
        target.disabled = True
        value = await board.eval(dedent(f"""
            led_value = led.value()
            led_value
        """))
        if value == 1:
            await board.eval("led.off()")
        else:
            await board.eval("led.on()")
        target.disabled = False
        return False
    return on

###### magic monkey patching ######
import sys
import builtins
import js
from pyscript import sync
from pyodide.code import eval_code

sys.stdout = sync
builtins.input = sync.readline

globals = {"js": js}

####### main code ######
while True:
    code = input(f"> ")
    if len(code):
        try:
            result = eval_code(f"{code}", globals=globals)
            if result is not None:
                print(result)
        except:
            print(f"Unable to evaluate: {code}")
